import { DepGraphBuilder, PkgManager, PkgInfo } from '@snyk/dep-graph';

import { bufferToHashDbValues } from './berkeleydb';
import { bufferToPackageInfo } from './rpm';
import { IParserResponse } from './types';

/**
 * Get a list of packages given a Buffer that contains an RPM database in BerkeleyDB format.
 * The database is inspected as best-effort, returning all valid/readable entries.
 * @param data An RPM database in BerkeleyDB format.
 * @deprecated Should use snyk/dep-graph. The response format is kept for backwards compatibility with snyk/kubernetes-monitor.
 */
export async function getPackages(data: Buffer): Promise<IParserResponse> {
  const packageManager: PkgManager = { name: 'rpm' };
  const rootPackage: PkgInfo = { name: '/var/lib/rpm/Packages' };
  const graphBuilder = new DepGraphBuilder(packageManager, rootPackage);

  try {
    const berkeleyDbValues = await bufferToHashDbValues(data);

    let packagesSkipped = 0;
    let packagesProcessed = 0;

    for (const entry of berkeleyDbValues) {
      try {
        const packageInfo = await bufferToPackageInfo(entry);
        if (packageInfo !== undefined) {
          const uniqueNodeId = `${packageInfo.name}-${
            packageInfo.epoch || '0'
          }:${packageInfo.version}-${packageInfo.release}-${packageInfo.size}-${
            packageInfo.arch || 'noarch'
          }`;

          graphBuilder.addPkgNode(
            { name: packageInfo.name, version: packageInfo.version },
            uniqueNodeId,
          );
          graphBuilder.connectDep(graphBuilder.rootNodeId, uniqueNodeId);

          packagesProcessed += 1;
        } else {
          packagesSkipped += 1;
        }
      } catch (error) {
        packagesSkipped += 1;
      }
    }

    return {
      dependencies: graphBuilder.build(),
      rpmMetadata: {
        packagesProcessed,
        packagesSkipped,
      },
    };
  } catch (error) {
    return {
      dependencies: graphBuilder.build(),
      error,
    };
  }
}
