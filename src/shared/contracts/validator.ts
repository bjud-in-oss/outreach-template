import { z } from 'zod';
import { EventEnvelopeSchema, EventEnvelope } from './envelope';

export function parseAndValidateEnvelope<T>(
  data: unknown,
  payloadSchema: z.ZodType<T>
): EventEnvelope & { payload: T } {
  const envelope = EventEnvelopeSchema.parse(data);
  const validatedPayload = payloadSchema.parse(envelope.payload);

  return {
    ...envelope,
    payload: validatedPayload,
  };
}
