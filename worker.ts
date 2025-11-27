// worker.ts

import { Worker, Job } from "bullmq";
import { redis } from "./lib/redis";
import { prisma } from "./lib/prisma";
import { generateEmailContent } from "./lib/openai";
import {
  emailSendingQueue,
  EmailGenerationJob,
  EmailSendingJob,
} from "./lib/queue";
import { sendEmail } from "./lib/email";

// Email Generation Worker
const generationWorker = new Worker<EmailGenerationJob>(
  "email-generation",
  async (job: Job<EmailGenerationJob>) => {
    const { scheduledEmailId } = job.data;

    console.log(`[Generation] Processing email: ${scheduledEmailId}`);

    const scheduledEmail = await prisma.scheduledEmail.findUnique({
      where: { id: scheduledEmailId },
      include: {
        lead: true,
        campaign: {
          include: { aiAgent: true },
        },
      },
    });

    if (!scheduledEmail) {
      throw new Error(`Scheduled email not found: ${scheduledEmailId}`);
    }

    if (scheduledEmail.campaign.status !== "ACTIVE") {
      console.log(`[Generation] Campaign not active, skipping`);
      return;
    }

    // Update status to GENERATING
    await prisma.scheduledEmail.update({
      where: { id: scheduledEmailId },
      data: { status: "GENERATING" },
    });

    try {
      // Generate email using OpenAI
      const generated = await generateEmailContent({
        agentPrompt: scheduledEmail.campaign.aiAgent.systemPrompt,
        leadFirstName: scheduledEmail.lead.firstName,
        leadLastName: scheduledEmail.lead.lastName || undefined,
        leadEmail: scheduledEmail.lead.email,
        leadMetadata: scheduledEmail.lead.metadata as
          | Record<string, any>
          | undefined,
        campaignName: scheduledEmail.campaign.name,
        emailNumber: scheduledEmail.scheduleDay,
        totalEmails: scheduledEmail.campaign.durationDays,
        senderName: "Sales Team",
        companyName: "GURD",
      });

      // Save generated content - mark as READY for review
      await prisma.scheduledEmail.update({
        where: { id: scheduledEmailId },
        data: {
          status: "READY",
          generatedSubject: generated.subject,
          generatedBody: generated.body,
        },
      });

      // DO NOT queue for sending automatically - wait for approval
      // Email will be queued when user approves it via /api/emails/[id]/approve

      console.log(
        `[Generation] Email generated successfully and ready for review: ${scheduledEmailId}`
      );
    } catch (error) {
      await prisma.scheduledEmail.update({
        where: { id: scheduledEmailId },
        data: {
          status: "FAILED",
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
        },
      });
      throw error;
    }
  },
  { connection: redis, concurrency: 5 }
);

// Email Sending Worker
const sendingWorker = new Worker<EmailSendingJob>(
  "email-sending",
  async (job: Job<EmailSendingJob>) => {
    const { scheduledEmailId } = job.data;

    console.log(`[Sending] Processing email: ${scheduledEmailId}`);

    const scheduledEmail = await prisma.scheduledEmail.findUnique({
      where: { id: scheduledEmailId },
      include: { lead: true, campaign: true },
    });

    if (!scheduledEmail) {
      throw new Error(`Scheduled email not found: ${scheduledEmailId}`);
    }

    if (scheduledEmail.status === "SENT") {
      console.log(`[Sending] Already sent, skipping`);
      return;
    }

    if (scheduledEmail.campaign.status !== "ACTIVE") {
      console.log(`[Sending] Campaign not active, skipping`);
      return;
    }

    // Only send emails that are APPROVED
    if (scheduledEmail.status !== "APPROVED") {
      console.log(
        `[Sending] Email not approved (status: ${scheduledEmail.status}), skipping`
      );
      return;
    }

    // Send email using Resend (or mock if no API key)
    try {
      // Add small delay to respect rate limits (2 req/sec for Resend free tier)
      await new Promise((resolve) => setTimeout(resolve, 500));

      await sendEmail({
        to: scheduledEmail.lead.email,
        subject: scheduledEmail.generatedSubject || "No Subject",
        body: scheduledEmail.generatedBody || "",
      });

      // Mark as sent
      await prisma.scheduledEmail.update({
        where: { id: scheduledEmailId },
        data: {
          status: "SENT",
          sentAt: new Date(),
        },
      });

      console.log(`[Sending] Email sent successfully: ${scheduledEmailId}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Check if it's a Resend validation error (403) - don't mark as failed, keep as READY
      if (
        errorMessage.includes("validation_error") ||
        errorMessage.includes("403")
      ) {
        console.warn(
          `[Sending] Email cannot be sent due to Resend restrictions: ${errorMessage}`
        );
        console.warn(
          `[Sending] Email kept as READY. Verify your domain in Resend to send to this recipient.`
        );
        // Keep status as READY so user can retry after fixing domain
        await prisma.scheduledEmail.update({
          where: { id: scheduledEmailId },
          data: {
            errorMessage: errorMessage,
          },
        });
        return; // Don't throw, just skip this email
      }

      // Mark as failed for other errors
      await prisma.scheduledEmail.update({
        where: { id: scheduledEmailId },
        data: {
          status: "FAILED",
          errorMessage: errorMessage,
        },
      });
      throw error;
    }
  },
  { connection: redis, concurrency: 2 } // Reduced to respect Resend rate limits (2 req/sec)
);

// Error handling
generationWorker.on("failed", (job, err) => {
  console.error(`[Generation] Job ${job?.id} failed:`, err.message);
});

sendingWorker.on("failed", (job, err) => {
  console.error(`[Sending] Job ${job?.id} failed:`, err.message);
});

console.log("🚀 Workers started");
