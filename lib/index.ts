import {
  bufferToHashDbValues,
  validateBerkeleyDbMetadata,
  validatePageSize,
} from './berkeleydb';
import { bufferToPackageInfo } from './rpm';
import { PackageInfo } from './rpm/types';
import { RpmParserResponse } from './types';

/**
 * Get a list of packages given a Buffer that contains an RPM database in BerkeleyDB format.
 * The database is inspected as best-effort, returning all valid/readable entries.
 * @param data An RPM database in BerkeleyDB format.
 */
export async function getPackages(data: Buffer): Promise<RpmParserResponse> {
  validateBerkeleyDbMetadata(data);

  const pageSize = data.readUInt32LE(20);
  validatePageSize(pageSize);

  const berkeleyDbValues = await bufferToHashDbValues(data);

  let packagesSkipped = 0;

  const rpmPackageInfos = new Array<PackageInfo>();
  for (const entry of berkeleyDbValues) {
    const packageInfo = await bufferToPackageInfo(entry);
    if (packageInfo !== undefined) {
      rpmPackageInfos.push(packageInfo);
    } else {
      packagesSkipped += 1;
    }
  }

  const formattedPackages = formatRpmPackages(rpmPackageInfos);
  const response = formattedPackages.join('\n');

  return {
    response,
    packagesSkipped,
    packages: rpmPackageInfos,
  };
}

function formatRpmPackages(packages: PackageInfo[]): string[] {
  return packages.map((packageInfo) => {
    if (packageInfo.epoch === undefined || packageInfo.epoch === 0) {
      return `${packageInfo.name}\t${packageInfo.version}-${packageInfo.release}\t${packageInfo.size}`;
    } else {
      return `${packageInfo.name}\t${packageInfo.epoch}:${packageInfo.version}-${packageInfo.release}\t${packageInfo.size}`;
    }
  });
}
