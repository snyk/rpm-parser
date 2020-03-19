import {
  IndexEntry,
  PackageInfo,
  isPackageInfo,
  RpmTag,
  RpmType,
} from './types';

export function getNEVRA(entries: IndexEntry[]): PackageInfo {
  const packageInfo: Partial<PackageInfo> = {};
  for (const entry of entries) {
    switch (entry.info.tag) {
      case RpmTag.NAME:
        if (entry.info.type !== RpmType.STRING) {
          throw new Error('Unexpected type for name tag');
        }
        const nameEnd = entry.data.indexOf(0);
        const name = entry.data.slice(0, nameEnd).toString('utf-8');
        packageInfo.name = name;
        break;

      case RpmTag.RELEASE:
        if (entry.info.type !== RpmType.STRING) {
          throw new Error('Unexpected type for name tag');
        }
        const releaseEnd = entry.data.indexOf(0);
        const release = entry.data.slice(0, releaseEnd).toString('utf-8');
        packageInfo.release = release;
        break;

      case RpmTag.ARCH:
        if (entry.info.type !== RpmType.STRING) {
          throw new Error('Unexpected type for name tag');
        }
        const archEnd = entry.data.indexOf(0);
        const arch = entry.data.slice(0, archEnd).toString();
        packageInfo.arch = arch;
        break;

      case RpmTag.EPOCH:
        if (entry.info.type !== RpmType.INT32) {
          throw new Error('Unexpected type for epoch tag');
        }
        const epoch = entry.data.readInt32BE(0);
        packageInfo.epoch = epoch;
        break;

      case RpmTag.SIZE:
        if (entry.info.type !== RpmType.INT32) {
          throw new Error('Unexpected type for epoch tag');
        }
        const size = entry.data.readInt32BE(0);
        packageInfo.size = size;
        break;

      case RpmTag.VERSION:
        if (entry.info.type !== RpmType.STRING) {
          throw new Error('Unexpected type for name tag');
        }
        const versionEnd = entry.data.indexOf(0);
        const version = entry.data.slice(0, versionEnd).toString('utf-8');
        packageInfo.version = version;
        break;

      default:
        continue;
    }
  }

  if (!isPackageInfo(packageInfo)) {
    throw new Error('Could not construct package info from index entries');
  }

  return packageInfo;
}
