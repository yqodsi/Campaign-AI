import { z } from 'zod';

export const createLeadSchema = z.object({
  email: z.string().email('Invalid email'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export const importLeadsSchema = z.array(createLeadSchema);

export type CreateLeadInput = z.infer<typeof createLeadSchema>;

