import { createHmac } from 'crypto';
import { describe, it, expect } from 'vitest';
import { verifyWebhook } from './webhook.js';

const SECRET = 'whsec_live_test_secret';
const BODY = new TextEncoder().encode('{"event":"feedback.created","id":"evt_123"}');
const BODY_STR = '{"event":"feedback.created","id":"evt_123"}';

/** Builds a valid timestamp (now) and matching v1=<hex> signature. */
function makeSignature(
  secret: string,
  body: Uint8Array | string,
  ts?: string
): { timestamp: string; signature: string } {
  const timestamp = ts ?? Math.floor(Date.now() / 1000).toString();
  const bodyBuf = typeof body === 'string' ? Buffer.from(body, 'utf8') : Buffer.from(body);
  const signed = Buffer.concat([Buffer.from(timestamp, 'utf8'), Buffer.from('.'), bodyBuf]);
  const hex = createHmac('sha256', secret).update(signed).digest('hex');
  return { timestamp, signature: `v1=${hex}` };
}

describe('verifyWebhook', () => {
  it('returns true for a valid signature with Uint8Array body', async () => {
    const { timestamp, signature } = makeSignature(SECRET, BODY);
    expect(await verifyWebhook(SECRET, BODY, signature, timestamp)).toBe(true);
  });

  it('returns true for a valid signature with string body', async () => {
    const { timestamp, signature } = makeSignature(SECRET, BODY_STR);
    expect(await verifyWebhook(SECRET, BODY_STR, signature, timestamp)).toBe(true);
  });

  it('returns false when the signature is tampered', async () => {
    const { timestamp, signature } = makeSignature(SECRET, BODY);
    const tampered = signature.slice(0, -4) + 'aaaa';
    expect(await verifyWebhook(SECRET, BODY, tampered, timestamp)).toBe(false);
  });

  it('returns false when the secret is wrong', async () => {
    const { timestamp, signature } = makeSignature('wrong_secret', BODY);
    expect(await verifyWebhook(SECRET, BODY, signature, timestamp)).toBe(false);
  });

  it('returns false when the body is altered after signing', async () => {
    const { timestamp, signature } = makeSignature(SECRET, BODY);
    const altered = new TextEncoder().encode('{"event":"feedback.created","id":"evt_456"}');
    expect(await verifyWebhook(SECRET, altered, signature, timestamp)).toBe(false);
  });

  it('returns false when timestamp is too old (replay)', async () => {
    const oldTs = (Math.floor(Date.now() / 1000) - 600).toString();
    const { signature } = makeSignature(SECRET, BODY, oldTs);
    expect(await verifyWebhook(SECRET, BODY, signature, oldTs, 300)).toBe(false);
  });

  it('returns true when timestamp is old but maxAgeSec=0 (check disabled)', async () => {
    const oldTs = (Math.floor(Date.now() / 1000) - 600).toString();
    const { signature } = makeSignature(SECRET, BODY, oldTs);
    expect(await verifyWebhook(SECRET, BODY, signature, oldTs, 0)).toBe(true);
  });

  it('returns false when signatureHeader lacks v1= prefix', async () => {
    const { timestamp, signature } = makeSignature(SECRET, BODY);
    expect(await verifyWebhook(SECRET, BODY, signature.slice(3), timestamp)).toBe(false);
  });

  it('returns false when signatureHeader is empty', async () => {
    const { timestamp } = makeSignature(SECRET, BODY);
    expect(await verifyWebhook(SECRET, BODY, '', timestamp)).toBe(false);
  });

  it('returns false when timestampHeader is empty', async () => {
    const { signature } = makeSignature(SECRET, BODY);
    expect(await verifyWebhook(SECRET, BODY, signature, '')).toBe(false);
  });

  it('returns false when timestampHeader is non-numeric', async () => {
    const { signature } = makeSignature(SECRET, BODY);
    expect(await verifyWebhook(SECRET, BODY, signature, 'not-a-number')).toBe(false);
  });
});
