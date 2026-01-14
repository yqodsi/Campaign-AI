import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createLeadSchema } from '@/lib/validations/lead';

export const dynamic = 'force-dynamic';

// GET /api/campaigns/[id]/leads
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: params.id },
  });

  if (!campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }

  const leads = await prisma.lead.findMany({
    where: { campaignId: params.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ data: leads });
}

// POST /api/campaigns/[id]/leads
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
    const validated = createLeadSchema.parse(body);

    const lead = await prisma.lead.create({
      data: {
        ...validated,
        campaignId: params.id,
      },
    });

    return NextResponse.json(lead, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Lead with this email already exists in this campaign' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
  }
}

