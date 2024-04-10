import { bufferToHashDbValues } from './berkeleydb';
import { bufferToPackageInfo } from './rpm';
import { PackageInfo } from './rpm/types';
import { Response, ParserError } from './types';
import { default as initSqlJs } from 'sql.js';

/**
 * Get a list of packages given a Buffer that contains an RPM database in BerkeleyDB format.
 * The database is inspected as best-effort, returning all valid/readable entries.
 * @param data An RPM database in BerkeleyDB format.
 */
export async function getPackages(data: Buffer): Promise<Response> {
  try {
    const berkeleyDbValues = await bufferToHashDbValues(data);

    let packagesSkipped = 0;
    let packagesProcessed = 0;

    const rpmPackageInfos = new Array<PackageInfo>();
    for (const entry of berkeleyDbValues) {
      try {
        const packageInfo = await bufferToPackageInfo(entry);
        if (packageInfo !== undefined) {
          rpmPackageInfos.push(packageInfo);
          packagesProcessed += 1;
        } else {
          packagesSkipped += 1;
        }
      } catch (error) {
        packagesSkipped += 1;
      }
    }

    return {
      response: rpmPackageInfos,
      rpmMetadata: {
        packagesProcessed,
        packagesSkipped,
      },
    };
  } catch (error) {
    return {
      response: [],
      error: error as ParserError,
    };
  }
}

export function formatRpmPackageVersion(packageInfo: PackageInfo): string {
  if (packageInfo.epoch === undefined || packageInfo.epoch === 0) {
    return `${packageInfo.version}-${packageInfo.release}`;
  }
  return `${packageInfo.epoch}:${packageInfo.version}-${packageInfo.release}`;
}

/**
 * Get a list of packages given a file path to an Sqlite RPM packages DB.
 * The database is inspected as best-effort, returning all valid/readable entries.
 * @param sqliteFilePath A path to an RPM sqlite Packages DB.
 */
export async function getPackagesSqlite(
  sqliteDbBuffer: Buffer,
): Promise<Response> {
  try {
    const packageInfoBlobs =
      await getBlobsFromPackagesTableSqliteDb(sqliteDbBuffer);
    const packages = await Promise.all(
      packageInfoBlobs.map((data: Buffer) => bufferToPackageInfo(data)),
    );
    return { response: packages as PackageInfo[] };
  } catch (error) {
    return { response: [], error: error as ParserError };
  }
}

// TODO: revisit when new version of sql.js is available
// OR we're able to use sqlite3 (Snyk CLI limitation with native modules)
async function getBlobsFromPackagesTableSqliteDb(
  sqliteDbBuffer: Buffer,
): Promise<Buffer[]> {
  const SQL = await initSqlJs();
  const db = new SQL.Database(sqliteDbBuffer);
  const dbContent = db.exec('SELECT blob FROM Packages');
  const packagesInfoBlobs = dbContent[0].values;
  db.close();
  return packagesInfoBlobs.map((data) => Buffer.from(data[0] as Uint8Array));
}
