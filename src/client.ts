import { Turnkey, type TurnkeyApiClient } from '@turnkey/sdk-server';
import type { ApiConfig } from './types.js';

export function createTurnkeyClient(api: ApiConfig): TurnkeyApiClient {
  const turnkey = new Turnkey({
    apiBaseUrl: api.baseUrl,
    apiPrivateKey: api.apiPrivateKey,
    apiPublicKey: api.apiPublicKey,
    defaultOrganizationId: api.organizationId,
  });
  return turnkey.apiClient();
}
