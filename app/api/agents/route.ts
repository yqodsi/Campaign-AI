import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAgentSchema } from '@/lib/validations/agent';

// GET /api/agents
export async function GET(request: NextRequest) {
  const agents = await prisma.aIAgent.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { campaigns: true } },
    },
  });

  return NextResponse.json({ data: agents });
}

// POST /api/agents
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createAgentSchema.parse(body);

    const agent = await prisma.aIAgent.create({
      data: validated,
    });

    return NextResponse.json(agent, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create agent' }, { status: 500 });
  }
}

