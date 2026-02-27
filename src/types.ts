/**
 * Configuration for the LoopEngine client.
 * Obtain credentials from your LoopEngine dashboard.
 */
export interface LoopEngineConfig {
  /** Project key (e.g. pk_live_...). */
  projectKey: string;
  /** Project secret (e.g. psk_live_...). */
  projectSecret: string;
  /** Project ID (e.g. proj_...). */
  projectId: string;
}

/**
 * Payload sent to the feedback ingest API.
 * `project_id` is injected by the client; include any other fields your app needs.
 */
export interface FeedbackPayload {
  /** Feedback message or content. */
  message?: string;
  [key: string]: unknown;
}

/**
 * Result of a send request.
 */
export interface SendResult {
  /** True if the response status was 2xx. */
  ok: boolean;
  /** HTTP status code. */
  status: number;
  /** Parsed JSON response body. */
  body: unknown;
}

/**
 * API response shape for a successful feedback submission.
 */
export interface FeedbackResponse {
  id: string;
  analysis_status: string;
}
