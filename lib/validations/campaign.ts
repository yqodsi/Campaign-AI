import { z } from 'zod';

// Preprocess function to convert datetime-local format to ISO datetime
const preprocessStartDate = z.preprocess((val) => {
  if (typeof val === 'string') {
    // If it's already in ISO format (has Z or timezone), return as is
    if (val.includes('Z') || val.match(/[+-]\d{2}:\d{2}$/)) {
      return val;
    }
    // If it's in datetime-local format (YYYY-MM-DDTHH:mm), convert to ISO
    if (val.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
      const date = new Date(val);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    }
  }
  return val;
}, z.string().datetime({ message: 'Please select a valid date and time' }));

export const createCampaignSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  scheduleType: z.enum(['DAILY', 'WEEKLY']),
  emailsPerDay: z.number().int().min(1).max(10).default(2),
  selectedDays: z.array(z.number().int().min(0).max(6)).default([1, 2, 3, 4, 5]),
  durationDays: z.number().int().min(1).max(365).default(30),
  startDate: preprocessStartDate,
  timezone: z.string().default('UTC'),
  aiAgentId: z.string().uuid('Invalid AI Agent'),
});

export const updateCampaignSchema = createCampaignSchema.partial();

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;

