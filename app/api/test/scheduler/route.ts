import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { emailGenerationQueue } from "@/lib/queue";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { getDay } from "date-fns";

// POST /api/test/scheduler - Test scheduler with simulated time
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const simulateDays = body.simulateDays || 0; // How many days to simulate forward
    const campaignId = body.campaignId; // Optional: test specific campaign

    const now = new Date();
    const simulatedNow = new Date(now);
    simulatedNow.setDate(simulatedNow.getDate() + simulateDays);

    console.log(`[Test Scheduler] Simulating time: ${simulatedNow.toISOString()}`);
    console.log(`[Test Scheduler] Simulated days forward: ${simulateDays}`);

    const where: any = { status: "ACTIVE" };
    if (campaignId) {
      where.id = campaignId;
    }

    const campaigns = await prisma.campaign.findMany({
      where,
      include: { leads: true },
    });

    if (campaigns.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No active campaigns found. Create a campaign and set it to ACTIVE first.",
      });
    }

    const results: any[] = [];

    for (const campaign of campaigns) {
      const campaignResult = await processCampaignForTest(
        campaign,
        simulatedNow
      );
      results.push(campaignResult);
    }

    return NextResponse.json({
      success: true,
      simulatedTime: simulatedNow.toISOString(),
      simulatedDaysForward: simulateDays,
      campaignsProcessed: results.length,
      results,
    });
  } catch (error: any) {
    console.error("[Test Scheduler] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to test scheduler",
      },
      { status: 500 }
    );
  }
}

async function processCampaignForTest(campaign: any, simulatedNow: Date) {
  const campaignTzNow = toZonedTime(simulatedNow, campaign.timezone);
  const campaignStart = new Date(campaign.startDate);

  const result: any = {
    campaignId: campaign.id,
    campaignName: campaign.name,
    scheduleType: campaign.scheduleType,
    emailsPerDay: campaign.emailsPerDay,
    selectedDays: campaign.selectedDays,
    timezone: campaign.timezone,
    startDate: campaign.startDate,
    durationDays: campaign.durationDays,
    leadsCount: campaign.leads.length,
    status: "not_started",
    scheduledEmails: [],
    errors: [],
  };

  // Check if campaign has started
  if (simulatedNow < campaignStart) {
    result.status = "not_started";
    result.message = `Campaign starts on ${campaignStart.toISOString()}`;
    return result;
  }

  // Check if campaign duration exceeded
  const daysSinceStart = Math.floor(
    (simulatedNow.getTime() - campaignStart.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysSinceStart >= campaign.durationDays) {
    result.status = "completed";
    result.message = `Campaign completed (${daysSinceStart} days since start)`;
    return result;
  }

  // For WEEKLY, check if today is a selected day
  if (campaign.scheduleType === "WEEKLY") {
    const todayDow = getDay(campaignTzNow); // 0=Sun, 1=Mon, etc.
    if (!campaign.selectedDays.includes(todayDow)) {
      result.status = "not_scheduled_day";
      result.message = `Today (${getDayName(todayDow)}) is not a scheduled day. Selected days: ${campaign.selectedDays.map(getDayName).join(", ")}`;
      return result;
    }
  }

  // Calculate schedule day
  let scheduleDay: number;
  if (campaign.scheduleType === "WEEKLY") {
    const startDate = new Date(campaign.startDate);
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
    scheduleDay = daysSinceStart + 1;
  }

  result.status = "active";
  result.scheduleDay = scheduleDay;
  result.daysSinceStart = daysSinceStart;

  // Check existing scheduled emails
  const existingEmails = await prisma.scheduledEmail.findMany({
    where: {
      campaignId: campaign.id,
    },
    include: { lead: true },
  });

  result.existingEmailsCount = existingEmails.length;

  // Simulate what would be scheduled
  const emailsToSend = campaign.emailsPerDay;
  const wouldSchedule: any[] = [];

  for (const lead of campaign.leads) {
    for (let emailIndex = 0; emailIndex < emailsToSend; emailIndex++) {
      const emailScheduleDay = scheduleDay * 10000 + emailIndex;

      // Check if already exists
      const existing = existingEmails.find(
        (e) =>
          e.leadId === lead.id &&
          e.scheduleDay === emailScheduleDay
      );

      if (!existing) {
        // Calculate send time in campaign timezone
        const intervalHours =
          emailsToSend > 1 ? 24 / (emailsToSend + 1) : 12;
        const sendHour = Math.floor(9 + emailIndex * intervalHours);
        const sendMinute = emailIndex * 15;

        // Get the date components in the campaign's timezone
        const year = campaignTzNow.getFullYear();
        const month = campaignTzNow.getMonth() + 1;
        const day = campaignTzNow.getDate();
        
        // Create a date string in the campaign timezone: "YYYY-MM-DDTHH:mm:ss"
        const dateStringInTz = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(sendHour).padStart(2, '0')}:${String(sendMinute).padStart(2, '0')}:00`;
        
        // Convert from campaign timezone to UTC for display
        const scheduledFor = fromZonedTime(dateStringInTz, campaign.timezone);

        wouldSchedule.push({
          leadId: lead.id,
          leadEmail: lead.email,
          leadName: `${lead.firstName} ${lead.lastName || ""}`.trim(),
          scheduleDay: emailScheduleDay,
          displayDay: formatScheduleDay(emailScheduleDay),
          scheduledFor: scheduledFor.toISOString(),
          scheduledForLocal: dateStringInTz, // Show the local time in campaign timezone
          emailIndex: emailIndex + 1,
          totalEmailsToday: emailsToSend,
        });
      } else {
        wouldSchedule.push({
          leadId: lead.id,
          leadEmail: lead.email,
          leadName: `${lead.firstName} ${lead.lastName || ""}`.trim(),
          scheduleDay: emailScheduleDay,
          displayDay: formatScheduleDay(emailScheduleDay),
          status: "already_scheduled",
          existingEmailId: existing.id,
        });
      }
    }
  }

  result.wouldScheduleCount = wouldSchedule.length;
  result.wouldSchedule = wouldSchedule;

  return result;
}

function getDayName(dayIndex: number): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days[dayIndex] || "Unknown";
}

function formatScheduleDay(scheduleDay: number): string {
  const baseDay = Math.floor(scheduleDay / 10000);
  const emailIndex = scheduleDay % 10000;
  if (emailIndex === 0) {
    return `Day ${baseDay}`;
  }
  return `Day ${baseDay} - Email ${emailIndex + 1}`;
}

