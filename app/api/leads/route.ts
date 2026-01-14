import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createLeadSchema } from "@/lib/validations/lead";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: "insensitive" as const } },
            { firstName: { contains: search, mode: "insensitive" as const } },
            { lastName: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [leads, total, assignedTotal, unassignedTotal] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          campaign: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.lead.count({ where }),
      prisma.lead.count({
        where: {
          ...where,
          campaignId: { not: null },
        },
      }),
      prisma.lead.count({
        where: {
          ...where,
          campaignId: null,
        },
      }),
    ]);

    return NextResponse.json({
      data: leads,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        assigned: assignedTotal,
        unassigned: unassignedTotal,
      },
    });
  } catch (error) {
    console.error("Failed to fetch leads:", error);
    return NextResponse.json(
      { error: "Failed to fetch leads" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = createLeadSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { email, firstName, lastName, metadata } = validation.data;

    // Avoid duplicate emails
    const existingLead = await prisma.lead.findFirst({
      where: { email },
    });

    if (existingLead) {
      return NextResponse.json(
        { error: "Lead with this email already exists" },
        { status: 409 }
      );
    }

    const lead = await prisma.lead.create({
      data: {
        email,
        firstName,
        lastName,
        metadata: metadata || {},
        // Leave campaignId empty for now
      },
    });

    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error("Failed to create lead:", error);
    return NextResponse.json(
      { error: "Failed to create lead" },
      { status: 500 }
    );
  }
}
