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
 * Optional settings for send(). When both geoLat and geoLon are provided,
 * they are added to the request body (geo_lat, geo_lon) and included in the HMAC signature.
 * Omit or leave undefined to use IP-based geolocation.
 */
export interface SendOptions {
  /** Latitude (-90 to 90). Only sent when both geoLat and geoLon are finite. */
  geoLat?: number;
  /** Longitude (-180 to 180). Only sent when both geoLat and geoLon are finite. */
  geoLon?: number;
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
