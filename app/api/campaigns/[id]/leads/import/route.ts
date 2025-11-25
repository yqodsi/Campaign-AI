import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { importLeadsSchema } from '@/lib/validations/lead';

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
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const body = await request.json();
    const validated = importLeadsSchema.parse(body);

    const results = {
      created: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const leadData of validated) {
      try {
        await prisma.lead.create({
          data: {
            ...leadData,
            campaignId: params.id,
          },
        });
        results.created++;
      } catch (error: any) {
        if (error.code === 'P2002') {
          results.skipped++;
        } else {
          results.errors.push(`Failed to create lead ${leadData.email}: ${error.message}`);
        }
      }
    }

    return NextResponse.json(results, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to import leads' }, { status: 500 });
  }
}

