import { Queue } from "bullmq";
import { redis } from "./redis";

// Queues
export const emailGenerationQueue = new Queue("email-generation", {
  connection: redis,
});

export const emailSendingQueue = new Queue("email-sending", {
  connection: redis,
});

// Job types
export interface EmailGenerationJob {
  scheduledEmailId: string;
}

export interface EmailSendingJob {
  scheduledEmailId: string;
}
