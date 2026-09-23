import { z } from 'zod';

export const EventEnvelopeSchema = z.object({
  id: z.string().uuid(),
  timestamp: z.number().int().positive(),
  senderDomain: z.string().min(1),
  targetDomain: z.string().min(1),
  action: z.string().min(1),
  payload: z.unknown(),
});

export type EventEnvelope = z.infer<typeof EventEnvelopeSchema>;
