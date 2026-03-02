import { BASE_URL, FEEDBACK_PATH } from './constants.js';
import { sha256Hex, signRequest } from './sign.js';
import type { FeedbackPayload, LoopEngineConfig, SendResult, SendOptions } from './types.js';

/**
 * LoopEngine SDK client for sending feedback to the Ingest API.
 * Two-line usage: `new LoopEngine(config)` then `client.send(payload)`.
 */
export class LoopEngine {
  private readonly projectKey: string;
  private readonly projectSecret: string;
  private readonly projectId: string;

  /**
   * Creates a client with the given credentials.
   * @param config - projectKey, projectSecret, projectId from your LoopEngine dashboard
   *
   * @example
   * const client = new LoopEngine({
   *   projectKey: 'pk_live_...',
   *   projectSecret: 'psk_live_...',
   *   projectId: 'proj_...',
   * });
   */
  constructor(config: LoopEngineConfig) {
    this.projectKey = config.projectKey;
    this.projectSecret = config.projectSecret;
    this.projectId = config.projectId;
  }

  /**
   * Sends a feedback payload to the LoopEngine Ingest API.
   * Injects `project_id` from config; no need to pass it in the payload.
   * Optionally pass coordinates so feedback is associated with device location instead of IP-based geo.
   *
   * @param payload - Feedback data (e.g. `{ message: '...' }`). May include any extra fields.
   * @param options - Optional. Pass `{ geoLat, geoLon }` to send device coordinates; both must be finite for geo to be included.
   * @returns Result with `ok`, `status`, and parsed `body`.
   *
   * @example
   * const result = await client.send({ message: 'User reported a bug' });
   * if (result.ok) console.log(result.body);
   *
   * @example
   * // With device location (e.g. from navigator.geolocation)
   * const result = await client.send(
   *   { message: 'Bug here' },
   *   { geoLat: coords.latitude, geoLon: coords.longitude }
   * );
   */
  async send(payload: FeedbackPayload, options?: SendOptions): Promise<SendResult> {
    const body = { ...payload, project_id: this.projectId } as Record<string, unknown>;
    const lat = options?.geoLat;
    const lon = options?.geoLon;
    if (
      typeof lat === 'number' &&
      typeof lon === 'number' &&
      Number.isFinite(lat) &&
      Number.isFinite(lon)
    ) {
      body.geo_lat = lat;
      body.geo_lon = lon;
    }
    const bodyStr = JSON.stringify(body);
    const bodyBytes = new TextEncoder().encode(bodyStr);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const bodyHashHex = await sha256Hex(bodyBytes);
    const signature = await signRequest(
      this.projectSecret,
      'POST',
      FEEDBACK_PATH,
      timestamp,
      bodyHashHex
    );

    const url = `${BASE_URL}${FEEDBACK_PATH}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Project-Key': this.projectKey,
        'X-Timestamp': timestamp,
        'X-Signature': `v1=${signature}`,
      },
      body: bodyStr,
    });

    const raw = await res.text();
    let parsed: unknown;
    try {
      parsed = raw ? JSON.parse(raw) : {};
    } catch {
      parsed = { raw };
    }

    return {
      ok: res.ok,
      status: res.status,
      body: parsed,
    };
  }
}
