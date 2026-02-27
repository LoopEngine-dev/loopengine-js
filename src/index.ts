/**
 * @loopengine/sdk — Official LoopEngine SDK for sending feedback to the Ingest API.
 *
 * @example
 * ```ts
 * import { LoopEngine } from '@loopengine/sdk';
 * const client = new LoopEngine({ projectKey, projectSecret, projectId });
 * const result = await client.send({ message: 'Hello' });
 * ```
 */

export { LoopEngine } from './client.js';
export type {
  LoopEngineConfig,
  FeedbackPayload,
  SendResult,
  FeedbackResponse,
} from './types.js';
