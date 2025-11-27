import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { emailGenerationQueue } from "@/lib/queue";

// POST /api/emails/[id]/regenerate
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const scheduledEmail = await prisma.scheduledEmail.findUnique({
    where: { id: params.id },
  });

  if (!scheduledEmail) {
    return NextResponse.json(
      { error: "Scheduled email not found" },
      { status: 404 }
    );
  }

  // Reset status and drop any previous content
  await prisma.scheduledEmail.update({
    where: { id: params.id },
    data: {
      status: "PENDING",
      generatedSubject: null,
      generatedBody: null,
      errorMessage: null,
    },
  });

  // Queue it back up for generation
  await emailGenerationQueue.add("generate", { scheduledEmailId: params.id });

  return NextResponse.json({ success: true });
}
