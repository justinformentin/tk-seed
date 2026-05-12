# tk-seed

Seed a Turnkey organization with sub-orgs, users, wallets, policies, and
private keys in one shot. Ships as both a CLI and a programmatic library.

## Install

```bash
npm install tk-seed
```

## CLI

```bash
npx tk-seed --org_id=xxxxxx \
  --api_public_key=$API_PUBLIC_KEY \
  --api_private_key=$API_PRIVATE_KEY \
  --base_url=http://localhost:8081
```

Flags fall back to env vars:

| Flag | Env var | Default |
| --- | --- | --- |
| `--org_id` (required) | `ORGANIZATION_ID` | — |
| `--api_public_key` | `API_PUBLIC_KEY` | — |
| `--api_private_key` | `API_PRIVATE_KEY` | — |
| `--base_url` | `BASE_URL` | `http://localhost:8081` |

## Library

```ts
import { seed } from 'tk-seed';

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
  subOrganizations: 2,
  users: 3,
  wallets: 5,
  policies: 3,
  privateKeys: 3,
}
```

Counts are fixed for v0.1 (see `DEFAULT_COUNTS` in `src/seed/index.ts`). The
next iteration will accept per-resource overrides.

## Roadmap

- [ ] Count overrides on `seed()` (`{ subOrganizations: 100, wallets: 500, ... }`).
- [ ] User tags and private-key tags.
- [ ] Parent-org users and parent-org wallets.

## Development

```bash
npm install
npm run build          # tsc → ./dist
npm run cli -- --help  # run the CLI from source via tsx
npm run typecheck
```
