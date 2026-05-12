export interface ApiConfig {
  organizationId: string;
  apiPublicKey: string;
  apiPrivateKey: string;
  baseUrl: string;
}

export interface SeedSummary {
  subOrganizations: number;
  userTags: number;
  users: number;
  wallets: number;
  privateKeyTags: number;
  privateKeys: number;
  policies: number;
}
