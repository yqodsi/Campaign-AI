import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { emailGenerationQueue } from "@/lib/queue";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

// POST /api/test/quick - Quick test: schedule emails for next 15 minutes
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const campaignId = body.campaignId; // Optional: test specific campaign
    const minutesAhead = body.minutesAhead || 15; // Default: 15 minutes

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
        message:
          "No active campaigns found. Create a campaign and set it to ACTIVE first.",
      });
    }

    const results: any[] = [];

    for (const campaign of campaigns) {
      const campaignResult = await quickTestCampaign(campaign, minutesAhead);
      results.push(campaignResult);
    }

    return NextResponse.json({
      success: true,
      minutesAhead,
      campaignsProcessed: results.length,
      results,
    });
  } catch (error: any) {
    console.error("[Quick Test] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to run quick test",
      },
      { status: 500 }
    );
  }
}

async function quickTestCampaign(campaign: any, minutesAhead: number) {
  const result: any = {
    campaignId: campaign.id,
    campaignName: campaign.name,
    scheduleType: campaign.scheduleType,
    emailsPerDay: campaign.emailsPerDay,
    timezone: campaign.timezone,
    leadsCount: campaign.leads.length,
    scheduledEmails: [],
    errors: [],
  };

  if (campaign.leads.length === 0) {
    result.error = "No leads in campaign";
    return result;
  }

  const now = new Date();
  const testTime = new Date(now.getTime() + minutesAhead * 60 * 1000);
  const campaignTzNow = toZonedTime(testTime, campaign.timezone);

  // Schedule emails for each lead
  const emailsToSend = Math.min(campaign.emailsPerDay, 3); // Limit to 3 emails max for quick test
  const scheduled: any[] = [];

  for (const lead of campaign.leads) {
    for (let emailIndex = 0; emailIndex < emailsToSend; emailIndex++) {
      try {
        // Calculate send time: space emails 2 minutes apart
        const sendMinutes = minutesAhead + emailIndex * 2;
        const sendTime = new Date(now.getTime() + sendMinutes * 60 * 1000);
        const sendTimeInTz = toZonedTime(sendTime, campaign.timezone);

        // Get date components in campaign timezone
        const year = sendTimeInTz.getFullYear();
        const month = sendTimeInTz.getMonth() + 1;
        const day = sendTimeInTz.getDate();
        const hour = sendTimeInTz.getHours();
        const minute = sendTimeInTz.getMinutes();

        // Create date string in campaign timezone
        const dateStringInTz = `${year}-${String(month).padStart(
          2,
          "0"
        )}-${String(day).padStart(2, "0")}T${String(hour).padStart(
          2,
          "0"
        )}:${String(minute).padStart(2, "0")}:00`;

        // Convert to UTC
        const scheduledFor = fromZonedTime(dateStringInTz, campaign.timezone);

        // Use a unique scheduleDay for quick test (negative to avoid conflicts)
        const testScheduleDay = -1000 - emailIndex;

        // Check if already exists
        const existing = await prisma.scheduledEmail.findUnique({
          where: {
            campaignId_leadId_scheduleDay: {
              campaignId: campaign.id,
              leadId: lead.id,
              scheduleDay: testScheduleDay,
            },
          },
        });

        if (existing) {
          scheduled.push({
            leadEmail: lead.email,
            leadName: `${lead.firstName} ${lead.lastName || ""}`.trim(),
            status: "already_scheduled",
            scheduledFor: scheduledFor.toISOString(),
            scheduledForLocal: dateStringInTz,
          });
          continue;
        }

        // Create scheduled email
        const scheduledEmail = await prisma.scheduledEmail.create({
          data: {
            campaignId: campaign.id,
            leadId: lead.id,
            scheduledFor: scheduledFor,
            scheduleDay: testScheduleDay,
            status: "PENDING",
          },
        });

        // Queue for generation
        await emailGenerationQueue.add("generate", {
          scheduledEmailId: scheduledEmail.id,
        });

        scheduled.push({
          leadEmail: lead.email,
          leadName: `${lead.firstName} ${lead.lastName || ""}`.trim(),
          scheduledEmailId: scheduledEmail.id,
          scheduledFor: scheduledFor.toISOString(),
          scheduledForLocal: dateStringInTz,
          status: "queued",
        });
      } catch (error: any) {
        result.errors.push({
          leadEmail: lead.email,
          error: error.message,
        });
      }
    }
  }

  result.scheduledEmails = scheduled;
  result.scheduledCount = scheduled.length;
  result.message = `Scheduled ${scheduled.length} test email(s) for the next ${minutesAhead} minutes`;

  return result;
}
