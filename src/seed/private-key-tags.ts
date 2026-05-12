import type { ApiConfig } from '../types.js';
import { createTurnkeyClient } from '../client.js';
import { consoleLogger, type Logger } from './logger.js';
import { uniqueFromBase } from './names.js';
import { silentProgress, type ProgressReporter } from './progress.js';

export const PRIVATE_KEY_TAG_BASES = ['signing-key', 'encryption-key', 'backup'] as const;
export type PrivateKeyTagBase = (typeof PRIVATE_KEY_TAG_BASES)[number];

export interface CreatedPrivateKeyTag {
  privateKeyTagId: string;
  privateKeyTagName: string;
  base: PrivateKeyTagBase;
}

export interface SeedPrivateKeyTagsOptions {
  /** Number of tags to create. Capped at the number of available bases. */
  count?: number;
  logger?: Logger;
  progress?: ProgressReporter;
}

export async function seedPrivateKeyTags(
  api: ApiConfig,
  opts: SeedPrivateKeyTagsOptions = {},
): Promise<CreatedPrivateKeyTag[]> {
  const log = opts.logger ?? consoleLogger;
  const progress = opts.progress ?? silentProgress;
  const client = createTurnkeyClient(api);
  const bases = PRIVATE_KEY_TAG_BASES.slice(0, opts.count ?? PRIVATE_KEY_TAG_BASES.length);

  log.info(`Creating ${bases.length} private key tags in ${api.organizationId}`);

  const created: CreatedPrivateKeyTag[] = [];
  for (const base of bases) {
    const privateKeyTagName = uniqueFromBase(base);
    const result = await client.createPrivateKeyTag({
      organizationId: api.organizationId,
      privateKeyTagName,
      privateKeyIds: [],
    });
    created.push({
      privateKeyTagId: result.privateKeyTagId ?? '',
      privateKeyTagName,
      base,
    });
    progress.tick(`private key tag ${privateKeyTagName}`);
  }

  return created;
}
