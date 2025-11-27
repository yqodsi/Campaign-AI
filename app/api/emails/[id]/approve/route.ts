import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { emailSendingQueue } from "@/lib/queue";

// POST /api/emails/[id]/approve
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const scheduledEmail = await prisma.scheduledEmail.findUnique({
    where: { id: params.id },
    include: { campaign: true },
  });

  if (!scheduledEmail) {
    return NextResponse.json(
      { error: "Scheduled email not found" },
      { status: 404 }
    );
  }

  if (scheduledEmail.status !== "READY") {
    return NextResponse.json(
      {
        error: "Email must be in READY status to approve",
        currentStatus: scheduledEmail.status,
      },
      { status: 400 }
    );
  }

  // Mark as approved
  await prisma.scheduledEmail.update({
    where: { id: params.id },
    data: { status: "APPROVED" },
  });

  // Figure out how long to wait before sending
  const delay = Math.max(
    0,
    new Date(scheduledEmail.scheduledFor).getTime() - Date.now()
  );

  // Schedule the send job
  await emailSendingQueue.add(
    "send",
    { scheduledEmailId: params.id },
    {
      delay,
    }
  );

  return NextResponse.json({
    success: true,
    message: "Email approved and queued for sending",
    scheduledFor: scheduledEmail.scheduledFor,
    delayMs: delay,
  });
}
