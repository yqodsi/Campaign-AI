import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createCampaignSchema } from "@/lib/validations/campaign";

export const dynamic = 'force-dynamic';

// GET /api/campaigns
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const startDateFrom = searchParams.get("startDateFrom");
  const startDateTo = searchParams.get("startDateTo");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  const where: any = {};

  if (status) {
    where.status = status as any;
  }

  if (startDateFrom || startDateTo) {
    where.startDate = {};
    if (startDateFrom) {
      where.startDate.gte = new Date(startDateFrom);
    }
    if (startDateTo) {
      where.startDate.lte = new Date(startDateTo);
    }
  }

  const [campaigns, total] = await Promise.all([
    prisma.campaign.findMany({
      where,
      include: {
        aiAgent: { select: { id: true, name: true } },
        _count: { select: { leads: true, scheduledEmails: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.campaign.count({ where }),
  ]);

  return NextResponse.json({
    data: campaigns,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

// POST /api/campaigns
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createCampaignSchema.parse(body);

    const campaign = await prisma.campaign.create({
      data: {
        ...validated,
        startDate: new Date(validated.startDate),
      },
      include: { aiAgent: true },
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create campaign" },
      { status: 500 }
    );
  }
}
