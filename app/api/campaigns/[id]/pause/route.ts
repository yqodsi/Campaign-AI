import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: params.id },
  });

  if (!campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }

  if (campaign.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Only active campaigns can be paused' }, { status: 400 });
  }

  const updated = await prisma.campaign.update({
    where: { id: params.id },
    data: { status: 'PAUSED' },
  });

  return NextResponse.json(updated);
}

