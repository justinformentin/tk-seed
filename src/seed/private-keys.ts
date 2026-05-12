import type { ApiConfig } from '../types.js';
import { createTurnkeyClient } from '../client.js';
import { consoleLogger, type Logger } from './logger.js';
import { pickRandom, uniqueName } from './names.js';
import { silentProgress, type ProgressReporter } from './progress.js';

export interface CreatedPrivateKey {
  privateKeyId: string;
  privateKeyName: string;
  privateKeyTagIds: string[];
}

export interface SeedPrivateKeysOptions {
  count: number;
  /** Tag IDs available for assignment. Each key gets 1–2 random tags. */
  privateKeyTagIds?: string[];
  logger?: Logger;
  progress?: ProgressReporter;
}

const CURVE_FORMATS = [
  { curve: 'CURVE_SECP256K1', addressFormat: 'ADDRESS_FORMAT_ETHEREUM' },
  { curve: 'CURVE_ED25519', addressFormat: 'ADDRESS_FORMAT_SOLANA' },
] as const;

export async function seedPrivateKeys(
  api: ApiConfig,
  opts: SeedPrivateKeysOptions,
): Promise<CreatedPrivateKey[]> {
  const log = opts.logger ?? consoleLogger;
  const progress = opts.progress ?? silentProgress;
  const client = createTurnkeyClient(api);

  log.info(`Creating ${opts.count} private keys in ${api.organizationId}`);

  const privateKeysToCreate = Array.from({ length: opts.count }, (_, i) => {
    const { curve, addressFormat } = CURVE_FORMATS[i % CURVE_FORMATS.length];
    return {
      privateKeyName: uniqueName('privateKey'),
      curve,
      addressFormats: [addressFormat],
      privateKeyTags: opts.privateKeyTagIds?.length
        ? pickRandom(opts.privateKeyTagIds, 1 + Math.floor(Math.random() * 2))
        : [],
    };
  });

  const result = await client.createPrivateKeys({
    organizationId: api.organizationId,
    privateKeys: privateKeysToCreate,
  });

  const created: CreatedPrivateKey[] =
    result.privateKeys?.map((key, i) => ({
      privateKeyId: key.privateKeyId ?? '',
      privateKeyName: privateKeysToCreate[i].privateKeyName,
      privateKeyTagIds: privateKeysToCreate[i].privateKeyTags,
    })) ?? [];

  for (const p of created) progress.tick(`private key ${p.privateKeyName}`);

  return created;
}
