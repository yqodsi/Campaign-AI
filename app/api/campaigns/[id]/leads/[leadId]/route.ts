import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// DELETE /api/campaigns/[id]/leads/[leadId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; leadId: string } }
) {
  const lead = await prisma.lead.findUnique({
    where: { id: params.leadId },
  });

  if (!lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  if (lead.campaignId !== params.id) {
    return NextResponse.json({ error: 'Lead does not belong to this campaign' }, { status: 400 });
  }

  await prisma.lead.delete({
    where: { id: params.leadId },
  });

  return NextResponse.json({ success: true });
}

