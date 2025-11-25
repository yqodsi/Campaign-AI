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

  // Check if campaign has started
  if (now < campaignStart) {
    console.log(`[Scheduler] Campaign ${campaign.id} hasn't started yet`);
    return;
  }

  // Check if campaign duration exceeded
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

  // For WEEKLY, check if today is a selected day
  if (campaign.scheduleType === "WEEKLY") {
    const todayDow = getDay(campaignTzNow); // 0=Sun, 1=Mon, etc.
    if (!campaign.selectedDays.includes(todayDow)) {
      console.log(`[Scheduler] Campaign ${campaign.id}: not a scheduled day`);
      return;
    }
  }

  // Calculate schedule day based on campaign type
  let scheduleDay: number;

  if (campaign.scheduleType === "WEEKLY") {
    // For weekly: count only scheduled days that have occurred
    const startDate = new Date(campaign.startDate);

    // Count how many scheduled days have passed since start
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
    // For daily: use actual day count
    scheduleDay = daysSinceStart + 1;
  }

  console.log(
    `[Scheduler] Campaign ${campaign.id} is on schedule day ${scheduleDay}`
  );

  // Schedule emails for each lead
  if (campaign.leads.length === 0) {
    console.log(
      `[Scheduler] Campaign ${campaign.id} has no leads. Add leads to the campaign first.`
    );
    return;
  }

  // Send emailsPerDay emails on this day
  const emailsToSend = campaign.emailsPerDay;

  for (const lead of campaign.leads) {
    // Schedule multiple emails for this day (if emailsPerDay > 1)
    for (let emailIndex = 0; emailIndex < emailsToSend; emailIndex++) {
      // Create unique scheduleDay for each email on the same day
      // Format: baseDay * 10000 + emailIndex (e.g., day 1 email 0 = 10000, day 1 email 1 = 10001)
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
  // Check idempotency - already scheduled?
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

  // Calculate send time: distribute emails throughout the day
  // For multiple emails per day, space them out (e.g., 9am, 2pm, 6pm)
  const now = new Date();
  const campaignTzNow = toZonedTime(now, campaign.timezone);
  const hoursInDay = 24;
  const intervalHours =
    totalEmailsToday > 1 ? hoursInDay / (totalEmailsToday + 1) : 12; // Start at noon if single email
  const sendHour = Math.floor(9 + emailIndex * intervalHours); // Start at 9am, distribute from there
  const sendMinute = emailIndex * 15; // Stagger by 15 minutes

  // Get the date components in the campaign's timezone
  const year = campaignTzNow.getFullYear();
  const month = campaignTzNow.getMonth() + 1;
  const day = campaignTzNow.getDate();

  // Create a date string in the campaign timezone: "YYYY-MM-DDTHH:mm:ss"
  const dateStringInTz = `${year}-${String(month).padStart(2, "0")}-${String(
    day
  ).padStart(2, "0")}T${String(sendHour).padStart(2, "0")}:${String(
    sendMinute
  ).padStart(2, "0")}:00`;

  // Convert from campaign timezone to UTC for storage
  const scheduledFor = fromZonedTime(dateStringInTz, campaign.timezone);

  // If calculated time is in the past, send now with small delay
  if (scheduledFor < now) {
    scheduledFor.setTime(now.getTime() + emailIndex * 60000 * 5); // 5 min apart if past
  }

  // Create scheduled email
  const scheduledEmail = await prisma.scheduledEmail.create({
    data: {
      campaignId: campaign.id,
      leadId: lead.id,
      scheduledFor: scheduledFor,
      scheduleDay,
      status: "PENDING",
    },
  });

  // Queue for generation
  await emailGenerationQueue.add("generate", {
    scheduledEmailId: scheduledEmail.id,
  });

  console.log(
    `[Scheduler] Queued email ${emailIndex + 1}/${totalEmailsToday} for lead ${
      lead.id
    } day ${scheduleDay}`
  );
}
