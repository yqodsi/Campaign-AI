import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { emailGenerationQueue } from "@/lib/queue";

const MAX_MINUTES = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const minutesAheadRaw = Number(body?.minutesAhead) || 5;
    const minutesAhead = Math.min(Math.max(1, minutesAheadRaw), MAX_MINUTES);
    const campaignId =
      typeof body?.campaignId === "string" ? body.campaignId : undefined;

    const campaigns = await prisma.campaign.findMany({
      where: {
        status: "ACTIVE",
        ...(campaignId ? { id: campaignId } : {}),
      },
      include: {
        leads: {
          take: 20,
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!campaigns.length) {
      return NextResponse.json(
        { success: false, error: "No active campaigns found." },
        { status: 400 }
      );
    }

    const now = Date.now();
    const results: Array<{
      campaignId: string;
      campaignName: string;
      scheduledCount: number;
    }> = [];

    for (const campaign of campaigns) {
      if (!campaign.leads.length) {
        continue;
      }

      const perCampaignLimit = Math.min(
        Math.max(1, campaign.emailsPerDay || 1),
        campaign.leads.length,
        5
      );

      let scheduledCount = 0;
      const leadsSlice = campaign.leads.slice(0, perCampaignLimit);

      for (const [index, lead] of leadsSlice.entries()) {
        const targetTime = new Date(
          now +
            Math.floor(((index + 1) / perCampaignLimit) * minutesAhead * 60_000)
        );

        try {
          const scheduledEmail = await prisma.scheduledEmail.create({
            data: {
              campaignId: campaign.id,
              leadId: lead.id,
              scheduledFor: targetTime,
              scheduleDay: Math.floor(now / 1000) + index,
              status: "PENDING",
            },
          });

          await emailGenerationQueue.add("generate", {
            scheduledEmailId: scheduledEmail.id,
          });

          scheduledCount++;
        } catch (error) {
          console.warn(
            `[QuickTest] Skipped lead ${lead.id} for campaign ${campaign.id}:`,
            error
          );
        }
      }

      if (scheduledCount > 0) {
        results.push({
          campaignId: campaign.id,
          campaignName: campaign.name,
          scheduledCount,
        });
      }
    }

    if (!results.length) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No leads were scheduled. Make sure active campaigns have leads.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      minutesAhead,
      results,
    });
  } catch (error) {
    console.error("[QuickTest] Failed to run quick test:", error);
    return NextResponse.json(
      { success: false, error: "Failed to run quick test" },
      { status: 500 }
    );
  }
}

