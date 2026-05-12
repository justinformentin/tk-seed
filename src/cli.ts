#!/usr/bin/env node
import { Command } from 'commander';
import { createCliProgress, seed } from './seed/index.js';

const program = new Command();

program
  .name('tk-seed')
  .description('Seed a Turnkey organization with sub-orgs, users, wallets, policies, and private keys.')
  .version('0.1.0')
  .requiredOption('--org_id <id>', 'Turnkey organization id (env ORGANIZATION_ID)')
  .option('--api_public_key <key>', 'Turnkey API public key (env API_PUBLIC_KEY)')
  .option('--api_private_key <key>', 'Turnkey API private key (env API_PRIVATE_KEY)')
  .option('--base_url <url>', 'Turnkey API base URL (env BASE_URL)', 'http://localhost:8081')
  .option('--sub_orgs <n>', 'Number of sub-organizations to create + seed', (v) => parseInt(v, 10))
  .action(async (opts) => {
    const apiPublicKey = opts.api_public_key ?? process.env.API_PUBLIC_KEY;
    const apiPrivateKey = opts.api_private_key ?? process.env.API_PRIVATE_KEY;
    if (!apiPublicKey || !apiPrivateKey) {
      throw new Error(
        'Missing Turnkey API credentials. Provide --api_public_key and --api_private_key (or API_PUBLIC_KEY / API_PRIVATE_KEY env vars).',
      );
    }

    const progress = createCliProgress();
    const summary = await seed({
      organizationId: opts.org_id,
      apiPublicKey,
      apiPrivateKey,
      baseUrl: opts.base_url ?? process.env.BASE_URL ?? 'http://localhost:8081',
      subOrgCount: opts.sub_orgs,
      progress,
    });
    console.log(`\nDone. ${JSON.stringify(summary)}`);
  });

program.parseAsync(process.argv).catch((err) => {
  console.error('\ntk-seed failed:', err?.message ?? err);
  process.exit(1);
});
