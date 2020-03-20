import {
  IndexEntry,
  PackageInfo,
  RpmTag,
  RpmType,
} from './types';

function extractString(data: Buffer) {
  const contentEnd = data.indexOf(0);
  return data.slice(0, contentEnd).toString('utf-8');
}

export function getNEVRA(entries: IndexEntry[]): Partial<PackageInfo> {
  const packageInfo: Partial<PackageInfo> = {};
  for (const entry of entries) {
    switch (entry.info.tag) {
      case RpmTag.NAME:
        if (entry.info.type !== RpmType.STRING) {
          throw new Error('Unexpected type for name tag');
        }
        packageInfo.name = extractString(entry.data);
        break;

      case RpmTag.RELEASE:
        if (entry.info.type !== RpmType.STRING) {
          throw new Error('Unexpected type for name tag');
        }
        packageInfo.release = extractString(entry.data);
        break;

      case RpmTag.ARCH:
        if (entry.info.type !== RpmType.STRING) {
          throw new Error('Unexpected type for name tag');
        }
        packageInfo.arch = extractString(entry.data);
        break;

      case RpmTag.EPOCH:
        if (entry.info.type !== RpmType.INT32) {
          throw new Error('Unexpected type for epoch tag');
        }
        packageInfo.epoch = entry.data.readInt32BE(0);
        break;

      case RpmTag.SIZE:
        if (entry.info.type !== RpmType.INT32) {
          throw new Error('Unexpected type for epoch tag');
        }
        packageInfo.size = entry.data.readInt32BE(0);
        break;

      case RpmTag.VERSION:
        if (entry.info.type !== RpmType.STRING) {
          throw new Error('Unexpected type for name tag');
        }
        packageInfo.version = extractString(entry.data);
        break;

      default:
        continue;
    }
  }

  return packageInfo;
}
