const encoder = new TextEncoder();

/**
 * Returns the SHA-256 hash of the given bytes as a lowercase hex string.
 * @param body - Raw request body bytes
 * @returns Hex-encoded digest
 */
export async function sha256Hex(body: Uint8Array): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', body as BufferSource);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Signs the canonical request string with HMAC-SHA256 and returns base64url (no padding).
 * @param secret - Project secret
 * @param method - HTTP method (e.g. POST)
 * @param path - Request path (e.g. /feedback)
 * @param timestamp - Unix timestamp string
 * @param bodyHex - SHA-256 hex digest of the request body
 * @returns Base64url-encoded signature
 */
export async function signRequest(
  secret: string,
  method: string,
  path: string,
  timestamp: string,
  bodyHex: string
): Promise<string> {
  const canonical = `${method}\n${path}\n${timestamp}\n${bodyHex}`;
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBuf = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(canonical)
  );
  const b64 = btoa(String.fromCharCode(...new Uint8Array(sigBuf)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
