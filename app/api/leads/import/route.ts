import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const leadSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  company: z.string().optional(),
  phone: z.string().optional(),
});

// POST /api/leads/import - Import multiple leads from CSV
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leads } = body;

    if (!Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json(
        { error: "Invalid leads data" },
        { status: 400 }
      );
    }

    const results = {
      imported: 0,
      errors: [] as string[],
    };

    for (const [index, leadData] of leads.entries()) {
      try {
        // Validate the row shape
        const validated = leadSchema.parse(leadData);

        // Skip duplicates by email among unassigned leads
        const existing = await prisma.lead.findFirst({
          where: {
            email: validated.email,
            campaignId: null, // Only consider unassigned leads
          },
        });

        if (existing) {
          results.errors.push(
            `Row ${index + 1}: Lead with email ${
              validated.email
            } already exists`
          );
          continue;
        }

        // Build metadata payload from optional fields
        const metadata: any = {};
        if (validated.company) metadata.company = validated.company;
        if (validated.phone) metadata.phone = validated.phone;

        // Save the lead without tying it to a campaign yet
        await prisma.lead.create({
          data: {
            email: validated.email,
            firstName: validated.firstName,
            lastName: validated.lastName || null,
            metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
            campaignId: null, // Keep unassigned for now
          },
        });

        results.imported++;
      } catch (error: any) {
        if (error.name === "ZodError") {
          results.errors.push(
            `Row ${index + 1}: Invalid data - ${
              error.errors[0]?.message || "validation failed"
            }`
          );
        } else {
          results.errors.push(
            `Row ${index + 1}: ${error.message || "Unknown error"}`
          );
        }
      }
    }

    return NextResponse.json(results, { status: 200 });
  } catch (error: any) {
    console.error("Failed to import leads:", error);
    return NextResponse.json(
      { error: "Failed to import leads", details: error.message },
      { status: 500 }
    );
  }
}
