import type { ApiConfig } from '../types.js';
import { createTurnkeyClient } from '../client.js';
import { consoleLogger, type Logger } from './logger.js';
import { uniqueName } from './names.js';
import { silentProgress, type ProgressReporter } from './progress.js';

export interface CreatedWallet {
  walletId: string;
  walletName: string;
}

export interface SeedWalletsOptions {
  count: number;
  /** Accounts to create alongside each wallet. Defaults to 2. */
  accountsPerWallet?: number;
  logger?: Logger;
  progress?: ProgressReporter;
}

const ACCOUNT_VARIANTS = [
  {
    curve: 'CURVE_SECP256K1',
    addressFormat: 'ADDRESS_FORMAT_ETHEREUM',
    path: (i: number) => `m/44'/60'/0'/0/${i}`,
  },
  {
    curve: 'CURVE_ED25519',
    addressFormat: 'ADDRESS_FORMAT_SOLANA',
    path: (i: number) => `m/44'/501'/${i}'/0'`,
  },
] as const;

export async function seedWallets(
  api: ApiConfig,
  opts: SeedWalletsOptions,
): Promise<CreatedWallet[]> {
  const log = opts.logger ?? consoleLogger;
  const progress = opts.progress ?? silentProgress;
  const client = createTurnkeyClient(api);
  const accountsPerWallet = opts.accountsPerWallet ?? 2;

  log.info(`Creating ${opts.count} wallets in ${api.organizationId}`);

  const wallets: CreatedWallet[] = [];
  for (let i = 0; i < opts.count; i++) {
    const walletName = uniqueName('wallet');
    const accounts = Array.from({ length: accountsPerWallet }, (_, j) => {
      const variant = ACCOUNT_VARIANTS[j % ACCOUNT_VARIANTS.length];
      const variantIndex = Math.floor(j / ACCOUNT_VARIANTS.length);
      return {
        curve: variant.curve,
        pathFormat: 'PATH_FORMAT_BIP32' as const,
        path: variant.path(variantIndex),
        addressFormat: variant.addressFormat,
      };
    });
    const result = await client.createWallet({
      organizationId: api.organizationId,
      walletName,
      accounts,
    });
    wallets.push({ walletId: result.walletId ?? '', walletName });
    progress.tick(`wallet ${walletName} (+${accountsPerWallet} accounts)`);
  }

  return wallets;
}
