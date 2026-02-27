import { createHash, createHmac } from 'crypto';
import { describe, it, expect } from 'vitest';
import { sha256Hex, signRequest } from './sign.js';

describe('sha256Hex', () => {
  it('returns lowercase hex digest of input', async () => {
    const input = new TextEncoder().encode('{"project_id":"proj_1","message":"hi"}');
    const hex = await sha256Hex(input);
    expect(hex).toMatch(/^[a-f0-9]{64}$/);
    const expected = createHash('sha256').update(input).digest('hex');
    expect(hex).toBe(expected);
  });
});

describe('signRequest', () => {
  it('produces base64url signature matching Node HMAC-SHA256', async () => {
    const secret = 'psk_test_secret';
    const method = 'POST';
    const path = '/feedback';
    const timestamp = '1700000000';
    const bodyHex = 'a'.repeat(64);

    const sig = await signRequest(secret, method, path, timestamp, bodyHex);
    expect(sig).not.toContain('+');
    expect(sig).not.toContain('/');
    expect(sig).not.toContain('=');

    const canonical = `${method}\n${path}\n${timestamp}\n${bodyHex}`;
    const expected = createHmac('sha256', secret).update(canonical).digest('base64url');
    expect(sig).toBe(expected);
  });
});
