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

## Requirements

- Node.js **>= 18.0.0**

## License

MIT
