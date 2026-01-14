import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const assignLeadsSchema = z.object({
  leadIds: z.array(z.string()),
});

const leadSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  company: z.string().optional(),
  phone: z.string().optional(),
});

const leadImportSchema = z.object({
  leads: z.array(leadSchema),
});

// POST /api/campaigns/[id]/leads/import
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Determine whether we received IDs to assign or raw lead data
    const validatedAssignment = assignLeadsSchema.safeParse(body);

    if (validatedAssignment.success) {
      const { leadIds } = validatedAssignment.data;

      // Attach selected leads to this campaign
      const result = await prisma.lead.updateMany({
        where: {
          id: { in: leadIds },
        },
        data: {
          campaignId: params.id,
        },
      });

      return NextResponse.json(
        {
          message: "Leads assigned successfully",
          count: result.count,
        },
        { status: 200 }
      );
    }

    const validatedLeads = leadImportSchema.safeParse(body);

    if (validatedLeads.success) {
      const { leads } = validatedLeads.data;

      const results = {
        imported: 0,
        errors: [] as string[],
      };

      for (const [index, leadData] of leads.entries()) {
        try {
          const validated = leadSchema.parse(leadData);

          const existing = await prisma.lead.findFirst({
            where: {
              email: validated.email,
              campaignId: params.id,
            },
          });

          if (existing) {
            results.errors.push(
              `Row ${index + 1}: Lead with email ${
                validated.email
              } already exists in this campaign`
            );
            continue;
          }

          const metadata: Record<string, string> = {};
          if (validated.company) metadata.company = validated.company;
          if (validated.phone) metadata.phone = validated.phone;

          await prisma.lead.create({
            data: {
              email: validated.email,
              firstName: validated.firstName,
              lastName: validated.lastName || null,
              metadata: Object.keys(metadata).length ? metadata : undefined,
              campaignId: params.id,
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
    }

    return NextResponse.json(
      {
        error: "Invalid request format. Expected leadIds array or leads array.",
      },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Failed to assign leads:", error);
    return NextResponse.json(
      { error: "Failed to assign leads" },
      { status: 500 }
    );
  }
}
