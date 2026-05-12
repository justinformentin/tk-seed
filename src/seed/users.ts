import { generateP256KeyPair } from '@turnkey/crypto';
import type { ApiConfig } from '../types.js';
import { createTurnkeyClient } from '../client.js';
import { consoleLogger, type Logger } from './logger.js';
import { pickRandom, uniqueName } from './names.js';
import { silentProgress, type ProgressReporter } from './progress.js';

export interface CreatedUser {
  userId: string;
  userName: string;
  apiPublicKey: string;
  apiPrivateKey: string;
  userTagIds: string[];
}

export interface SeedUsersOptions {
  count: number;
  /** Tag IDs available for assignment. Each user gets 1–2 random tags. */
  userTagIds?: string[];
  logger?: Logger;
  progress?: ProgressReporter;
}

export async function seedUsers(
  api: ApiConfig,
  opts: SeedUsersOptions,
): Promise<CreatedUser[]> {
  const log = opts.logger ?? consoleLogger;
  const progress = opts.progress ?? silentProgress;
  const client = createTurnkeyClient(api);

  log.info(`Creating ${opts.count} users in ${api.organizationId}`);

  const drafts = Array.from({ length: opts.count }, () => {
    const userName = uniqueName('user');
    const keypair = generateP256KeyPair();
    const userTagIds = opts.userTagIds?.length
      ? pickRandom(opts.userTagIds, 1 + Math.floor(Math.random() * 2))
      : [];
    return { userName, keypair, userTagIds };
  });

  const result = await client.createApiOnlyUsers({
    organizationId: api.organizationId,
    apiOnlyUsers: drafts.map((d) => ({
      userName: d.userName,
      userTags: d.userTagIds,
      apiKeys: [
        {
          apiKeyName: `${d.userName}-api-key`,
          publicKey: d.keypair.publicKey,
          curveType: 'API_KEY_CURVE_P256' as const,
        },
      ],
    })),
  });

  const users: CreatedUser[] =
    result.userIds?.map((userId, i) => ({
      userId,
      userName: drafts[i].userName,
      apiPublicKey: drafts[i].keypair.publicKey,
      apiPrivateKey: drafts[i].keypair.privateKey,
      userTagIds: drafts[i].userTagIds,
    })) ?? [];

  for (const u of users) progress.tick(`user ${u.userName}`);

  return users;
}
