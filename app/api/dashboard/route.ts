import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [
      totalCampaigns,
      activeCampaigns,
      totalLeads,
      emailsSent,
      totalAgents,
      recentCampaigns,
    ] = await Promise.all([
      prisma.campaign.count(),
      prisma.campaign.count({ where: { status: "ACTIVE" } }),
      prisma.lead.count(),
      prisma.scheduledEmail.count({ where: { status: "SENT" } }),
      prisma.aIAgent.count(),
      prisma.campaign.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { leads: true, scheduledEmails: true },
          },
        },
      }),
    ]);

    return NextResponse.json({
      totalCampaigns,
      activeCampaigns,
      totalLeads,
      emailsSent,
      totalAgents,
      recentCampaigns,
    });
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
