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
  --api_private_key=$API_PRIVATE_KEY \
  --base_url=http://localhost:8081
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

Counts are fixed for v0.1 (see `DEFAULT_COUNTS` in [src/seed/index.ts](src/seed/index.ts)). The
next iteration will accept per-resource overrides.

## Scripts

```bash
npm run cli -- --help  # run the CLI from source via tsx
npm run build          # tsc → ./dist
npm run typecheck
```

## Roadmap

- [ ] Publish to npm so `npx tk-seed` works.
- [ ] Count overrides on `seed()` (`{ subOrganizations: 100, wallets: 500, ... }`).
- [ ] User tags and private-key tags.
- [ ] Parent-org users and parent-org wallets.
