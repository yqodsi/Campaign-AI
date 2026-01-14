import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateAgentSchema } from "@/lib/validations/agent";

export const dynamic = "force-dynamic";

// GET /api/agents/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const agent = await prisma.aIAgent.findUnique({
    where: { id: params.id },
    include: {
      _count: { select: { campaigns: true } },
    },
  });

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  return NextResponse.json(agent);
}

// PATCH /api/agents/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validated = updateAgentSchema.parse(body);

    const agent = await prisma.aIAgent.findUnique({
      where: { id: params.id },
    });

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const updated = await prisma.aIAgent.update({
      where: { id: params.id },
      data: validated,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update agent" },
      { status: 500 }
    );
  }
}

// DELETE /api/agents/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const agent = await prisma.aIAgent.findUnique({
    where: { id: params.id },
  });

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  await prisma.aIAgent.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ success: true });
}
