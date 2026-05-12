const NAMES = {
  user: [
    'aurora', 'blitz', 'cipher', 'delta', 'echo', 'falcon', 'glacier', 'horizon',
    'ion', 'jet', 'krypto', 'lumen', 'mirage', 'nova', 'onyx', 'phoenix',
    'quark', 'raven', 'sable', 'titan',
  ],
  wallet: [
    'vault', 'treasury', 'reserve', 'strongbox', 'coffer', 'cache', 'stronghold',
    'bastion', 'citadel', 'keep', 'repository', 'depot', 'stash', 'trove', 'holding',
  ],
  privateKey: [
    'aegis', 'bulwark', 'dagger', 'eclipse', 'forge', 'glyph', 'hex', 'ironclad',
    'keystone', 'lance', 'mantle', 'nexus', 'obsidian', 'sentinel', 'talon',
  ],
  subOrg: [
    'apex', 'crescent', 'endeavor', 'frontier', 'genesis', 'helix', 'ingenium',
    'junction', 'kepler', 'lyra',
  ],
  policy: [
    'sentinel-policy', 'guardian-policy', 'warden-policy', 'override-policy',
    'compass-policy', 'pillar-policy', 'watcher-policy',
  ],
} as const;

export type NameCategory = keyof typeof NAMES;

let counter = 0;
function suffix(): string {
  counter += 1;
  return `${Date.now().toString(36).slice(-5)}${counter.toString(36)}`;
}

/** Pick a random base name from `category`'s pool and append a unique suffix. */
export function uniqueName(category: NameCategory): string {
  const pool = NAMES[category];
  const base = pool[Math.floor(Math.random() * pool.length)];
  return `${base}-${suffix()}`;
}

/** Append a unique suffix to an explicit base — useful for tag names where the base is semantic (e.g. "admin"). */
export function uniqueFromBase(base: string): string {
  return `${base}-${suffix()}`;
}

/** Return a shuffled copy of `arr` and take the first `n` elements (capped at arr.length). */
export function pickRandom<T>(arr: readonly T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, arr.length));
}
