import type { ApiConfig } from '../types.js';
import { createTurnkeyClient } from '../client.js';
import { consoleLogger, type Logger } from './logger.js';
import { uniqueName } from './names.js';
import { silentProgress, type ProgressReporter } from './progress.js';
import type { CreatedUserTag, UserTagBase } from './user-tags.js';

export interface CreatedPolicy {
  policyId: string;
  policyName: string;
}

export interface SeedPoliciesOptions {
  count: number;
  /** User tags created earlier; their generated names are substituted into the consensus expressions. */
  userTags?: CreatedUserTag[];
  logger?: Logger;
  progress?: ProgressReporter;
}

interface PolicyTemplate {
  effect: 'EFFECT_ALLOW' | 'EFFECT_DENY';
  /** CEL expression: when does this policy apply (typically the activity filter). */
  condition: string;
  /** CEL expression: who must approve. Empty string for DENY policies. */
  consensus: string;
}

function buildTemplates(tagFor: (base: UserTagBase) => string): PolicyTemplate[] {
  const has = (base: UserTagBase) => `approvers.any(user, user.tags.contains('${tagFor(base)}'))`;
  const countOf = (base: UserTagBase) =>
    `approvers.filter(user, user.tags.contains('${tagFor(base)}')).count()`;
  const activityIs = (t: string) => `activity.type == '${t}'`;

  return [
    {
      effect: 'EFFECT_ALLOW',
      condition: activityIs('ACTIVITY_TYPE_CREATE_WALLET'),
      consensus: has('admin'),
    },
    {
      effect: 'EFFECT_ALLOW',
      condition: activityIs('ACTIVITY_TYPE_SIGN_TRANSACTION_V2'),
      consensus: has('developer'),
    },
    {
      effect: 'EFFECT_DENY',
      condition: activityIs('ACTIVITY_TYPE_EXPORT_WALLET'),
      consensus: '',
    },
    {
      effect: 'EFFECT_ALLOW',
      condition: activityIs('ACTIVITY_TYPE_CREATE_USERS_V3'),
      consensus: has('admin'),
    },
    {
      effect: 'EFFECT_ALLOW',
      condition: activityIs('ACTIVITY_TYPE_SIGN_TRANSACTION_V2'),
      consensus: `${countOf('production')} >= 2`,
    },
    {
      effect: 'EFFECT_DENY',
      condition: activityIs('ACTIVITY_TYPE_DELETE_API_KEYS'),
      consensus: '',
    },
    {
      effect: 'EFFECT_ALLOW',
      condition: activityIs('ACTIVITY_TYPE_CREATE_WALLET_ACCOUNTS'),
      consensus: `${has('developer')} || ${has('admin')}`,
    },
    {
      effect: 'EFFECT_ALLOW',
      condition: activityIs('ACTIVITY_TYPE_CREATE_POLICY_V3'),
      consensus: `${countOf('admin')} >= 2`,
    },
    {
      effect: 'EFFECT_ALLOW',
      condition: activityIs('ACTIVITY_TYPE_CREATE_PRIVATE_KEYS_V2'),
      consensus: has('admin'),
    },
    {
      effect: 'EFFECT_DENY',
      condition: activityIs('ACTIVITY_TYPE_EXPORT_PRIVATE_KEY'),
      consensus: '',
    },
  ];
}

export async function seedPolicies(
  api: ApiConfig,
  opts: SeedPoliciesOptions,
): Promise<CreatedPolicy[]> {
  const log = opts.logger ?? consoleLogger;
  const progress = opts.progress ?? silentProgress;
  const client = createTurnkeyClient(api);

  const tagFor = (base: UserTagBase): string =>
    opts.userTags?.find((t) => t.base === base)?.userTagName ?? base;
  const templates = buildTemplates(tagFor);

  log.info(`Creating ${opts.count} policies in ${api.organizationId}`);

  const policiesToCreate = Array.from({ length: opts.count }, (_, i) => {
    const t = templates[i % templates.length];
    return {
      policyName: uniqueName('policy'),
      effect: t.effect,
      condition: t.condition,
      consensus: t.consensus,
      notes: '',
    };
  });

  const result = await client.createPolicies({
    organizationId: api.organizationId,
    policies: policiesToCreate,
  });

  const policies: CreatedPolicy[] =
    result.policyIds?.map((policyId, i) => ({
      policyId,
      policyName: policiesToCreate[i].policyName,
    })) ?? [];

  for (const p of policies) progress.tick(`policy ${p.policyName}`);

  return policies;
}
