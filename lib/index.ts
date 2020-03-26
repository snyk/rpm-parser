import { bufferToHashDbValues } from './berkeleydb';
import { bufferToPackageInfo } from './rpm';
import { PackageInfo } from './rpm/types';

/**
 * Get a list of packages given a Buffer that contains an RPM database in BerkeleyDB format.
 * The database is inspected as best-effort, returning all valid/readable entries.
 * @param data An RPM database in BerkeleyDB format.
 * @deprecated Should use snyk/dep-graph. This format is kept for backwards compatibility with snyk/kubernetes-monitor.
 */
export async function getPackages(data: Buffer): Promise<string> {
  const berkeleyDbValues = await bufferToHashDbValues(data);

  const rpmPackageInfos = await Promise.all(
    berkeleyDbValues.map((entry) => {
      return bufferToPackageInfo(entry);
    }),
  );

  const healthyPackages = rpmPackageInfos.filter(
    (pkg) => pkg !== undefined,
  ) as PackageInfo[];

  const stringEntries = healthyPackages.map((packageInfo) => {
    const hasEpoch = packageInfo.epoch !== undefined && packageInfo.epoch !== 0;
    if (!hasEpoch) {
      return `${packageInfo.name}\t${packageInfo.version}-${packageInfo.release}\t${packageInfo.size}`;
    } else {
      return `${packageInfo.name}\t${packageInfo.epoch}:${packageInfo.version}-${packageInfo.release}\t${packageInfo.size}`;
    }
  });

  return stringEntries.join('\n');
}
