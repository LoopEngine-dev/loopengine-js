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


## Requirements

- Node.js **>= 18.0.0**

## License

MIT
