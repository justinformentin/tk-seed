import type { ApiConfig, SeedSummary } from '../types.js';
import { consoleLogger, silentLogger, type Logger } from './logger.js';
import { seedSubOrganizations, type CreatedSubOrg } from './sub-orgs.js';
import { seedUserTags, type CreatedUserTag } from './user-tags.js';
import { seedUsers, type CreatedUser } from './users.js';
import { seedWallets, type CreatedWallet } from './wallets.js';
import { seedPrivateKeyTags, type CreatedPrivateKeyTag } from './private-key-tags.js';
import { seedPrivateKeys, type CreatedPrivateKey } from './private-keys.js';
import { seedPolicies, type CreatedPolicy } from './policies.js';
import {
  silentProgress,
  totalResources,
  type ProgressReporter,
} from './progress.js';

export interface OrgCounts {
  userTags: number;
  users: number;
  wallets: number;
  accountsPerWallet: number;
  privateKeyTags: number;
  privateKeys: number;
  policies: number;
}

export const DEFAULT_PARENT_COUNTS: OrgCounts = {
  userTags: 5,
  users: 3,
  wallets: 5,
  accountsPerWallet: 2,
  privateKeyTags: 3,
  privateKeys: 3,
  policies: 3,
};

export const DEFAULT_SUB_ORG_COUNTS: OrgCounts = {
  userTags: 3,
  users: 2,
  wallets: 2,
  accountsPerWallet: 2,
  privateKeyTags: 2,
  privateKeys: 2,
  policies: 2,
};

export const DEFAULT_SUB_ORG_COUNT = 12;

export interface SeedOptions extends ApiConfig {
  /**
   * Per-resource logger. Defaults to `consoleLogger` when no progress reporter
   * is active and to silent when one is. Pass `false` to silence regardless.
   */
  logger?: Logger | false;
  /**
   * Progress reporter. Defaults to `false` (no bar). Pass a `ProgressReporter`
   * (e.g. `createCliProgress()`) to enable one — the CLI does this. When a
   * reporter is active the default logger goes silent so log lines don't
   * interleave with the bar.
   */
  progress?: ProgressReporter | false;
  /** Number of sub-orgs to create off the parent. Each one is seeded with `subOrgCounts`. */
  subOrgCount?: number;
  /** Resource counts applied to the parent org. */
  parentCounts?: Partial<OrgCounts>;
  /** Resource counts applied inside each sub-org. */
  subOrgCounts?: Partial<OrgCounts>;
}

export interface SeededOrg {
  organizationId: string;
  userTags: CreatedUserTag[];
  users: CreatedUser[];
  wallets: CreatedWallet[];
  privateKeyTags: CreatedPrivateKeyTag[];
  privateKeys: CreatedPrivateKey[];
  policies: CreatedPolicy[];
}

/**
 * Seed a single org with tags, users, wallets, private keys, and policies.
 * Does NOT create sub-orgs — call `seed()` for the parent+sub-orgs orchestration.
 */
export async function seedOrgResources(
  api: ApiConfig,
  counts: OrgCounts,
  logger: Logger = consoleLogger,
  progress: ProgressReporter = silentProgress,
): Promise<SeededOrg> {
  const userTags = await seedUserTags(api, { count: counts.userTags, logger, progress });
  const users = await seedUsers(api, {
    count: counts.users,
    userTagIds: userTags.map((t) => t.userTagId),
    logger,
    progress,
  });
  const wallets = await seedWallets(api, {
    count: counts.wallets,
    accountsPerWallet: counts.accountsPerWallet,
    logger,
    progress,
  });
  const privateKeyTags = await seedPrivateKeyTags(api, {
    count: counts.privateKeyTags,
    logger,
    progress,
  });
  const privateKeys = await seedPrivateKeys(api, {
    count: counts.privateKeys,
    privateKeyTagIds: privateKeyTags.map((t) => t.privateKeyTagId),
    logger,
    progress,
  });
  const policies = await seedPolicies(api, {
    count: counts.policies,
    userTags,
    logger,
    progress,
  });

  return {
    organizationId: api.organizationId,
    userTags,
    users,
    wallets,
    privateKeyTags,
    privateKeys,
    policies,
  };
}

/**
 * Seed the parent org, create N sub-orgs, then seed each sub-org with the
 * same resource types. Sub-orgs are seeded with the parent's credentials —
 * `seedSubOrganizations` registers the parent's API public key as each
 * sub-org's root admin, so the same private key signs for both layers.
 */
export async function seed(opts: SeedOptions): Promise<SeedSummary> {
  const parentApi: ApiConfig = {
    organizationId: opts.organizationId,
    apiPublicKey: opts.apiPublicKey,
    apiPrivateKey: opts.apiPrivateKey,
    baseUrl: opts.baseUrl,
  };
  // Progress defaults to off. Pass a reporter (e.g. `createCliProgress()`) to enable.
  const progressActive = opts.progress !== false && opts.progress != null;
  const progress: ProgressReporter = progressActive
    ? (opts.progress as ProgressReporter)
    : silentProgress;
  // Logger silences while a progress reporter is active so per-resource lines
  // don't interleave with the bar. `logger: false` silences regardless.
  const logger: Logger =
    opts.logger === false
      ? silentLogger
      : (opts.logger ?? (progressActive ? silentLogger : consoleLogger));
  const parentCounts: OrgCounts = { ...DEFAULT_PARENT_COUNTS, ...opts.parentCounts };
  const subOrgCounts: OrgCounts = { ...DEFAULT_SUB_ORG_COUNTS, ...opts.subOrgCounts };
  const subOrgCount = opts.subOrgCount ?? DEFAULT_SUB_ORG_COUNT;

  const total = totalResources(parentCounts, subOrgCount, subOrgCounts);
  progress.start(total);

  try {
    const parent = await seedOrgResources(parentApi, parentCounts, logger, progress);

    let subOrgs: CreatedSubOrg[] = [];
    const seededSubOrgs: SeededOrg[] = [];
    if (subOrgCount > 0) {
      subOrgs = await seedSubOrganizations(parentApi, {
        count: subOrgCount,
        logger,
        progress,
      });
      for (const sub of subOrgs) {
        const subApi: ApiConfig = { ...parentApi, organizationId: sub.subOrganizationId };
        seededSubOrgs.push(await seedOrgResources(subApi, subOrgCounts, logger, progress));
      }
    }

    return {
      subOrganizations: subOrgs.length,
      userTags: parent.userTags.length + sum(seededSubOrgs, (o) => o.userTags.length),
      users: parent.users.length + sum(seededSubOrgs, (o) => o.users.length),
      wallets: parent.wallets.length + sum(seededSubOrgs, (o) => o.wallets.length),
      privateKeyTags:
        parent.privateKeyTags.length + sum(seededSubOrgs, (o) => o.privateKeyTags.length),
      privateKeys: parent.privateKeys.length + sum(seededSubOrgs, (o) => o.privateKeys.length),
      policies: parent.policies.length + sum(seededSubOrgs, (o) => o.policies.length),
    };
  } finally {
    progress.stop();
  }
}

function sum<T>(arr: T[], pick: (t: T) => number): number {
  return arr.reduce((acc, x) => acc + pick(x), 0);
}

export {
  seedSubOrganizations,
  seedUserTags,
  seedUsers,
  seedWallets,
  seedPrivateKeyTags,
  seedPrivateKeys,
  seedPolicies,
};
export {
  createCliProgress,
  silentProgress,
  resourcesPerOrg,
  totalResources,
} from './progress.js';
export type { ProgressReporter } from './progress.js';
export type { CreatedSubOrg } from './sub-orgs.js';
export type { CreatedUserTag } from './user-tags.js';
export type { CreatedUser } from './users.js';
export type { CreatedWallet } from './wallets.js';
export type { CreatedPrivateKeyTag } from './private-key-tags.js';
export type { CreatedPrivateKey } from './private-keys.js';
export type { CreatedPolicy } from './policies.js';
