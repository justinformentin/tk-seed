import cliProgress from 'cli-progress';
import type { OrgCounts } from './index.js';

export interface ProgressReporter {
  start(total: number): void;
  tick(label: string): void;
  stop(): void;
}

export const silentProgress: ProgressReporter = {
  start: () => {},
  tick: () => {},
  stop: () => {},
};

/** Build a cli-progress bar that shows total / value and the last-created resource. */
export function createCliProgress(): ProgressReporter {
  const bar = new cliProgress.SingleBar(
    {
      format: '  [{bar}] {percentage}% | {value}/{total} | last: {lastResource}',
      barCompleteChar: '█',
      barIncompleteChar: '░',
      hideCursor: true,
      clearOnComplete: false,
      stopOnComplete: false,
    },
    cliProgress.Presets.shades_classic,
  );
  return {
    start(total) {
      bar.start(total, 0, { lastResource: '...' });
    },
    tick(label) {
      bar.increment(1, { lastResource: label });
    },
    stop() {
      bar.stop();
    },
  };
}

/** Number of tickable resources produced by one pass of `seedOrgResources`. */
export function resourcesPerOrg(counts: OrgCounts): number {
  return (
    counts.userTags +
    counts.users +
    counts.wallets +
    counts.privateKeyTags +
    counts.privateKeys +
    counts.policies
  );
}

/** Total resources across parent + sub-org creations + every sub-org's contents. */
export function totalResources(
  parentCounts: OrgCounts,
  subOrgCount: number,
  subOrgCounts: OrgCounts,
): number {
  return resourcesPerOrg(parentCounts) + subOrgCount + subOrgCount * resourcesPerOrg(subOrgCounts);
}
