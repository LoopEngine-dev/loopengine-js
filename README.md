# @loopengine/sdk

Official LoopEngine SDK for sending feedback to the Ingest API. Two-line usage: create a client with your credentials, then call `send` with your payload.

- **Zero runtime dependencies** — uses Node.js 18+ built-ins (`crypto.subtle`, `fetch`)
- **ESM and CJS** — dual build with TypeScript types
- **Small surface** — one class, one method

## Install

```bash
npm install @loopengine/sdk
```

## Usage

### ESM

```ts
import { LoopEngine } from '@loopengine/sdk';

const client = new LoopEngine({
  projectKey: 'pk_live_...',
  projectSecret: 'psk_live_...',
  projectId: 'proj_...',
});

const result = await client.send({ message: 'User reported a bug' });
if (result.ok) {
  console.log(result.body); // { id: 'fb_...', analysis_status: 'pending' }
}
```

### CJS

```js
const { LoopEngine } = require('@loopengine/sdk');

const client = new LoopEngine({
  projectKey: 'pk_live_...',
  projectSecret: 'psk_live_...',
  projectId: 'proj_...',
});

// The payload you send must match the schema defined for your project.
const result = await client.send({ message: 'User reported a bug' });
```

## Config

Obtain `projectKey`, `projectSecret`, and `projectId` from your [LoopEngine dashboard](https://loopengine.dev). Pass them in an object (e.g. from env):

```ts
const client = new LoopEngine({
  projectKey: process.env.LOOPENGINE_PROJECT_KEY!,
  projectSecret: process.env.LOOPENGINE_PROJECT_SECRET!,
  projectId: process.env.LOOPENGINE_PROJECT_ID!,
});
```

## Payload

The payload object must match the fields and constraints you defined when creating your project in the LoopEngine dashboard. At a minimum, it should include all the required fields according to your project's schema. `project_id` is automatically appended to each payload by the SDK.

## Geolocation

You can send device location so feedback is associated with coordinates instead of IP-based geo. Pass an optional second argument to `send()` with `geoLat` and `geoLon`. When **both** are provided and finite, the SDK adds `geo_lat` and `geo_lon` to the request body; they are included in the HMAC signature. Omit the second argument (or omit geo fields) to use IP-based geolocation. The API expects valid ranges: latitude -90 to 90, longitude -180 to 180.

```ts
// Without geo (IP-based location is used)
const result = await client.send({ message: 'Feedback' });

// With device coordinates (e.g. from navigator.geolocation)
const { coords } = await new Promise<GeolocationPosition>((res, rej) =>
  navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
);
const result = await client.send(
  { message: 'Bug at my location' },
  { geoLat: coords.latitude, geoLon: coords.longitude }
);
```

## Verifying webhook payloads

When LoopEngine delivers a webhook to your endpoint, it signs the request with HMAC-SHA256 using a **signing secret** that only you and LoopEngine know. Verifying that signature before processing the event confirms the request came from LoopEngine, was not tampered with, and — by also checking the timestamp — limits replay attacks.

**Get the secret:** In your dashboard, open your project → Webhooks. The signing secret (`whsec_live_...`) is shown when you create or rotate the webhook. Store it as an environment variable and never commit it.

**Critical:** call `verifyWebhook` with the raw request body bytes **before** any JSON parsing. The signature is computed over the exact bytes received; re-serialising the parsed payload will produce a different result and fail verification.

```ts
import { verifyWebhook } from '@loopengine/sdk';
```

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `secret` | `string` | Signing secret from the dashboard (`whsec_live_...`) |
| `rawBody` | `Uint8Array \| string` | Raw HTTP body as received, before any JSON parsing |
| `signatureHeader` | `string` | Full value of the `X-LoopEngine-Signature` header |
| `timestampHeader` | `string` | Value of the `X-LoopEngine-Timestamp` header (Unix seconds) |
| `maxAgeSec` | `number` (optional) | Max timestamp age in seconds; default `300`. Pass `0` to skip. |

**Returns:** `Promise<boolean>` — `true` if valid, `false` if the signature does not match or the timestamp is outside the allowed window.

### Express example

Install a raw-body middleware so you have access to the unmodified bytes:

```bash
npm install body-parser
```

```ts
import express from 'express';
import { verifyWebhook } from '@loopengine/sdk';

const app = express();

// Use express.raw() (or body-parser's equivalent) on the webhook route
// so req.body is a Buffer — do NOT use express.json() before verifyWebhook.
app.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const valid = await verifyWebhook(
      process.env.LOOPENGINE_WEBHOOK_SECRET!,
      req.body,                                           // raw Buffer, not parsed
      req.headers['x-loopengine-signature'] as string,
      req.headers['x-loopengine-timestamp'] as string,
    );

    if (!valid) {
      return res.status(401).send('Invalid signature');
    }

    const event = JSON.parse(req.body.toString('utf8')); // parse AFTER verifying
    console.log(event.type);
    res.sendStatus(200);
  }
);
```

### Edge / serverless example (Cloudflare Workers, Deno, etc.)

```ts
import { verifyWebhook } from '@loopengine/sdk';

export default {
  async fetch(request: Request): Promise<Response> {
    const rawBody = new Uint8Array(await request.arrayBuffer());

    const valid = await verifyWebhook(
      SECRET,
      rawBody,
      request.headers.get('x-loopengine-signature') ?? '',
      request.headers.get('x-loopengine-timestamp') ?? '',
    );

    if (!valid) return new Response('Invalid signature', { status: 401 });

    const event = JSON.parse(new TextDecoder().decode(rawBody));
    // handle event …
    return new Response('OK');
  },
};
```

## Requirements

- Node.js **>= 18.0.0**

## License

MIT
