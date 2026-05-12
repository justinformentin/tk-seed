import type { ApiConfig } from '../types.js';
import { createTurnkeyClient } from '../client.js';
import { consoleLogger, type Logger } from './logger.js';
import { uniqueName } from './names.js';
import { silentProgress, type ProgressReporter } from './progress.js';

export interface CreatedSubOrg {
  subOrganizationId: string;
  name: string;
}

export interface SeedSubOrgsOptions {
  count: number;
  /** Public key registered as the new sub-org's root user API key. Defaults to `api.apiPublicKey`. */
  rootUserPublicKey?: string;
  logger?: Logger;
  progress?: ProgressReporter;
}

export async function seedSubOrganizations(
  api: ApiConfig,
  opts: SeedSubOrgsOptions,
): Promise<CreatedSubOrg[]> {
  const log = opts.logger ?? consoleLogger;
  const progress = opts.progress ?? silentProgress;
  const client = createTurnkeyClient(api);
  const rootKey = opts.rootUserPublicKey ?? api.apiPublicKey;

  log.info(`Creating ${opts.count} sub-organizations under ${api.organizationId}`);

  const created: CreatedSubOrg[] = [];
  for (let i = 0; i < opts.count; i++) {
    const name = uniqueName('subOrg');
    const result = await client.createSubOrganization({
      organizationId: api.organizationId,
      subOrganizationName: name,
      rootUsers: [
        {
          userName: 'Admin User',
          apiKeys: [
            {
              apiKeyName: `${name}-admin-key`,
              publicKey: rootKey,
              curveType: 'API_KEY_CURVE_P256',
            },
          ],
          authenticators: [],
          oauthProviders: [],
        },
      ],
      rootQuorumThreshold: 1,
    });
    created.push({ subOrganizationId: result.subOrganizationId ?? '', name });
    progress.tick(`sub-org ${name}`);
  }

  return created;
}
