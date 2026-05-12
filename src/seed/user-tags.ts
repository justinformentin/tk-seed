import type { ApiConfig } from '../types.js';
import { createTurnkeyClient } from '../client.js';
import { consoleLogger, type Logger } from './logger.js';
import { uniqueFromBase } from './names.js';
import { silentProgress, type ProgressReporter } from './progress.js';

export const USER_TAG_BASES = ['admin', 'developer', 'production', 'security', 'qa'] as const;
export type UserTagBase = (typeof USER_TAG_BASES)[number];

export interface CreatedUserTag {
  userTagId: string;
  userTagName: string;
  /** Semantic base used to generate the name (e.g. "admin"). Useful for policy references. */
  base: UserTagBase;
}

export interface SeedUserTagsOptions {
  /** Number of tags to create. Capped at the number of available bases. */
  count?: number;
  logger?: Logger;
  progress?: ProgressReporter;
}

export async function seedUserTags(
  api: ApiConfig,
  opts: SeedUserTagsOptions = {},
): Promise<CreatedUserTag[]> {
  const log = opts.logger ?? consoleLogger;
  const progress = opts.progress ?? silentProgress;
  const client = createTurnkeyClient(api);
  const bases = USER_TAG_BASES.slice(0, opts.count ?? USER_TAG_BASES.length);

  log.info(`Creating ${bases.length} user tags in ${api.organizationId}`);

  const created: CreatedUserTag[] = [];
  for (const base of bases) {
    const userTagName = uniqueFromBase(base);
    const result = await client.createUserTag({
      organizationId: api.organizationId,
      userTagName,
      userIds: [],
    });
    created.push({
      userTagId: result.userTagId ?? '',
      userTagName,
      base,
    });
    progress.tick(`user tag ${userTagName}`);
  }

  return created;
}
