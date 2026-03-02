const encoder = new TextEncoder();

/**
 * Concatenates two or more Uint8Arrays into a single Uint8Array.
 */
function concatBytes(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}

/**
 * Decodes a lowercase hex string into a Uint8Array.
 * Returns null if the string is not valid hex.
 */
function hexToBytes(hex: string): Uint8Array | null {
  if (hex.length % 2 !== 0) return null;
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    const byte = parseInt(hex.slice(i, i + 2), 16);
    if (Number.isNaN(byte)) return null;
    out[i / 2] = byte;
  }
  return out;
}

/**
 * Verifies that a webhook payload was signed by LoopEngine.
 *
 * Pass the raw request body **before** any JSON parsing — the signature is computed
 * over the exact bytes as received. Re-serialising the parsed object will break verification.
 *
 * Uses `crypto.subtle.verify` for the final comparison, which is constant-time by spec
 * and works in Node 18+, browsers, and edge runtimes (Deno, Cloudflare Workers, etc.).
 *
 * @param secret - Signing secret from the dashboard (`whsec_live_...`)
 * @param rawBody - Raw request body as received (string or Uint8Array)
 * @param signatureHeader - Full value of the `X-LoopEngine-Signature` header (e.g. `v1=abc123…`)
 * @param timestampHeader - Value of the `X-LoopEngine-Timestamp` header (Unix seconds as a string)
 * @param maxAgeSec - Max age of the timestamp in seconds; default 300. Pass 0 to skip the check.
 * @returns `true` if the signature is valid and the timestamp is within the allowed window.
 *
 * @example
 * // Express — requires raw body middleware (e.g. express.raw() or bodyParser.raw())
 * app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
 *   const valid = await verifyWebhook(
 *     process.env.LOOPENGINE_WEBHOOK_SECRET,
 *     req.body,
 *     req.headers['x-loopengine-signature'],
 *     req.headers['x-loopengine-timestamp'],
 *   );
 *   if (!valid) return res.status(401).send('Invalid signature');
 *   const event = JSON.parse(req.body);
 *   // handle event …
 * });
 */
export async function verifyWebhook(
  secret: string,
  rawBody: Uint8Array | string,
  signatureHeader: string,
  timestampHeader: string,
  maxAgeSec = 300
): Promise<boolean> {
  if (!signatureHeader?.startsWith('v1=') || !timestampHeader) return false;

  if (maxAgeSec > 0) {
    const ts = parseInt(timestampHeader, 10);
    if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > maxAgeSec) return false;
  }

  // Decode the raw signature bytes from the "v1=<hex>" header.
  const sigBytes = hexToBytes(signatureHeader.slice(3));
  if (sigBytes === null || sigBytes.length === 0) return false;

  // Import the secret as an HMAC-SHA-256 key for verification.
  let key: CryptoKey;
  try {
    key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
  } catch {
    return false;
  }

  // Signed content: timestamp + "." + rawBody (matches server computeSignature).
  const body = typeof rawBody === 'string' ? encoder.encode(rawBody) : rawBody;
  const signed = concatBytes(encoder.encode(timestampHeader), encoder.encode('.'), body);

  // crypto.subtle.verify is constant-time: no timing oracle on the comparison.
  return crypto.subtle.verify('HMAC', key, sigBytes, signed);
}
