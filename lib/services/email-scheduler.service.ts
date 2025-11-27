import { prisma } from "../prisma";
import { emailGenerationQueue } from "../queue";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { getDay } from "date-fns";

export async function processActiveCampaigns() {
  console.log("[Scheduler] Starting to process active campaigns...");

  const activeCampaigns = await prisma.campaign.findMany({
    where: { status: "ACTIVE" },
    include: { leads: true },
  });

  console.log(`[Scheduler] Found ${activeCampaigns.length} active campaign(s)`);

  if (activeCampaigns.length === 0) {
    console.log(
      "[Scheduler] No active campaigns found. Make sure you have at least one campaign with status ACTIVE."
    );
    return;
  }

  for (const campaign of activeCampaigns) {
    console.log(
      `[Scheduler] Processing campaign: ${campaign.name} (${campaign.id})`
    );
    console.log(`[Scheduler] Campaign has ${campaign.leads.length} lead(s)`);
    await processCampaign(campaign);
  }

  console.log("[Scheduler] Finished processing all active campaigns");
}

async function processCampaign(campaign: any) {
  const now = new Date();
  const campaignTzNow = toZonedTime(now, campaign.timezone);
  const campaignStart = new Date(campaign.startDate);

  // Skip campaigns that start in the future
  if (now < campaignStart) {
    console.log(`[Scheduler] Campaign ${campaign.id} hasn't started yet`);
    return;
  }

  // Stop campaigns that have run their full course
  const daysSinceStart = Math.floor(
    (now.getTime() - campaignStart.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysSinceStart >= campaign.durationDays) {
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: "COMPLETED" },
    });
    console.log(`[Scheduler] Campaign ${campaign.id} completed`);
    return;
  }

  // Weekly campaigns only run on selected weekdays
  if (campaign.scheduleType === "WEEKLY") {
    const todayDow = getDay(campaignTzNow); // 0=Sun, 1=Mon, etc.
    if (!campaign.selectedDays.includes(todayDow)) {
      console.log(`[Scheduler] Campaign ${campaign.id}: not a scheduled day`);
      return;
    }
  }

  // Figure out which schedule day we’re on
  let scheduleDay: number;

  if (campaign.scheduleType === "WEEKLY") {
    // Weekly: count only the days the campaign was set to run
    const startDate = new Date(campaign.startDate);

    // Walk through each day since the start and count the eligible ones
    let scheduledDaysCount = 0;
    for (let i = 0; i <= daysSinceStart; i++) {
      const checkDate = new Date(startDate);
      checkDate.setDate(checkDate.getDate() + i);
      const checkTz = toZonedTime(checkDate, campaign.timezone);
      const checkDow = getDay(checkTz);
      if (campaign.selectedDays.includes(checkDow)) {
        scheduledDaysCount++;
      }
    }
    scheduleDay = scheduledDaysCount;
  } else {
    // Daily: simply use elapsed days
    scheduleDay = daysSinceStart + 1;
  }

  console.log(
    `[Scheduler] Campaign ${campaign.id} is on schedule day ${scheduleDay}`
  );

  // Bail out if no leads were assigned
  if (campaign.leads.length === 0) {
    console.log(
      `[Scheduler] Campaign ${campaign.id} has no leads. Add leads to the campaign first.`
    );
    return;
  }

  // Send the configured number of emails per lead
  const emailsToSend = campaign.emailsPerDay;

  for (const lead of campaign.leads) {
    // Space out multiple sends on the same day
    for (let emailIndex = 0; emailIndex < emailsToSend; emailIndex++) {
      // Encode scheduleDay as baseDay * 10000 + emailIndex
      const emailScheduleDay = scheduleDay * 10000 + emailIndex;
      await scheduleEmailForLead(
        campaign,
        lead,
        emailScheduleDay,
        emailIndex,
        emailsToSend
      );
    }
  }
}

async function scheduleEmailForLead(
  campaign: any,
  lead: any,
  scheduleDay: number,
  emailIndex: number = 0,
  totalEmailsToday: number = 1
) {
  // Skip if this lead already has an email for that slot
  const existing = await prisma.scheduledEmail.findUnique({
    where: {
      campaignId_leadId_scheduleDay: {
        campaignId: campaign.id,
        leadId: lead.id,
        scheduleDay,
      },
    },
  });

  if (existing) {
    console.log(
      `[Scheduler] Email already scheduled for lead ${lead.id} day ${scheduleDay}`
    );
    return;
  }

  // Space sends throughout the day (e.g., 9am, 2pm, 6pm)
  const now = new Date();
  const campaignTzNow = toZonedTime(now, campaign.timezone);
  const hoursInDay = 24;
  const intervalHours =
    totalEmailsToday > 1 ? hoursInDay / (totalEmailsToday + 1) : 12; // Start at noon if single email
  const sendHour = Math.floor(9 + emailIndex * intervalHours); // Start at 9am, distribute from there
  const sendMinute = emailIndex * 15; // Stagger by 15 minutes

  // Build the send timestamp in the campaign timezone
  const year = campaignTzNow.getFullYear();
  const month = campaignTzNow.getMonth() + 1;
  const day = campaignTzNow.getDate();

  // Compose the ISO string
  const dateStringInTz = `${year}-${String(month).padStart(2, "0")}-${String(
    day
  ).padStart(2, "0")}T${String(sendHour).padStart(2, "0")}:${String(
    sendMinute
  ).padStart(2, "0")}:00`;

  // Convert to UTC before saving
  const scheduledFor = fromZonedTime(dateStringInTz, campaign.timezone);

  // If the slot already passed today, push it a bit forward
  if (scheduledFor < now) {
    scheduledFor.setTime(now.getTime() + emailIndex * 60000 * 5); // 5 min apart if past
  }

  // Persist the scheduled email
  const scheduledEmail = await prisma.scheduledEmail.create({
    data: {
      campaignId: campaign.id,
      leadId: lead.id,
      scheduledFor: scheduledFor,
      scheduleDay,
      status: "PENDING",
    },
  });

  // Kick off generation
  await emailGenerationQueue.add("generate", {
    scheduledEmailId: scheduledEmail.id,
  });

  console.log(
    `[Scheduler] Queued email ${emailIndex + 1}/${totalEmailsToday} for lead ${
      lead.id
    } day ${scheduleDay}`
  );
}
