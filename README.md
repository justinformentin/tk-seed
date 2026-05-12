# tk-seed

Seed a Turnkey organization with sub-orgs, users, wallets, policies, and
private keys in one shot. Ships as both a CLI and a programmatic library.

> Not yet published to npm. Clone this repo and run it locally — instructions below.

## Setup

```bash
git clone <repo-url>
cd seed-app
npm install
```

## CLI

Run the CLI directly from source with `npm run cli`:

```bash
npm run cli -- \
  --org_id=xxxxxx \
  --api_public_key=$API_PUBLIC_KEY \
  --api_private_key=$API_PRIVATE_KEY
```

Or build first and run the compiled output:

```bash
npm run build
node dist/cli.js --org_id=xxxxxx --api_public_key=... --api_private_key=...
```

Flags fall back to env vars:

| Flag | Env var | Default |
| --- | --- | --- |
| `--org_id` (required) | `ORGANIZATION_ID` | — |
| `--api_public_key` | `API_PUBLIC_KEY` | — |
| `--api_private_key` | `API_PRIVATE_KEY` | — |
| `--base_url` | `BASE_URL` | `http://localhost:8081` |
| `--sub_orgs` | — | `12` |

## Library

Import `seed()` from the source (or from `dist/` after `npm run build`):

```ts
import { seed } from './src/seed/index.js';

await seed({
  organizationId: 'xxxxx',
  apiPublicKey: '...',
  apiPrivateKey: '...',
  baseUrl: 'http://localhost:8081',
});
```

`seed()` runs every seeder in series and returns a summary:

```ts
{
  subOrganizations: 12,
  userTags: 41,
  users: 27,
  wallets: 29,
  policies: 27,
  privateKeyTags: 27,
  privateKeys: 27,
}
```

### Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `organizationId` | `string` | — | Parent organization id. |
| `apiPublicKey` | `string` | — | Turnkey API public key. |
| `apiPrivateKey` | `string` | — | Turnkey API private key. |
| `baseUrl` | `string` | `http://localhost:8081` | Turnkey API base URL. |
| `subOrgCount` | `number` | `12` | Number of sub-orgs to create off the parent. Set to `0` to seed only the parent. |
| `parentCounts` | `Partial<OrgCounts>` | see [src/seed/index.ts](src/seed/index.ts) | Per-resource counts for the parent org. |
| `subOrgCounts` | `Partial<OrgCounts>` | see [src/seed/index.ts](src/seed/index.ts) | Per-resource counts applied inside each sub-org. |
| `progress` | `ProgressReporter \| false` | `false` (no bar) | Pass a reporter (e.g. `createCliProgress()`) to enable a bar. The CLI does this. |
| `logger` | `Logger \| false` | `consoleLogger` by default; silent when a `progress` reporter is active; pass `false` to silence regardless | Receives `info`/`warn`/`error` per resource. |

Output combinations:

| `progress` | `logger` | Result |
| --- | --- | --- |
| default (`false`) | default | No bar, per-resource lines via `console`. |
| reporter | default | Progress bar, no per-resource log lines. |
| reporter | `false` | Progress bar only. |
| default (`false`) | `false` | Silent. |

`OrgCounts` fields: `userTags`, `users`, `wallets`, `accountsPerWallet`, `privateKeyTags`, `privateKeys`, `policies`.

Example with overrides:

```ts
import { seed } from './src/seed/index.js';

await seed({
  organizationId: 'xxxxx',
  apiPublicKey: '...',
  apiPrivateKey: '...',
  // optional
  subOrgCount: 50,
  parentCounts: { users: 10, wallets: 20 },
  subOrgCounts: { users: 2, wallets: 1 },
});
```

## Scripts

```bash
npm run cli -- --help  # run the CLI from source via tsx
npm run build          # tsc → ./dist
npm run typecheck
```

## Roadmap

- [ ] Publish to npm so `npx tk-seed` works.
- [ ] Count overrides on `seed()` (`{ subOrganizations: 100, wallets: 500, ... }`).
