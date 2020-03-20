import { IndexEntry, ENTRY_INFO_SIZE, EntryInfo } from './types';

export function headerImport(data: Buffer): IndexEntry[] {
  const indexLength = data.readInt32BE(0);
  const dataLength = data.readInt32BE(4);

  if (indexLength <= 0 || indexLength > 50_000) {
    // Ensure we don't allocate something crazy...
    throw new Error('Invalid index length');
  }

  const entryInfos = new Array<EntryInfo>(indexLength);

  // Skip the first 2 items (index and data lengths)
  const dataStart = 8 + indexLength * ENTRY_INFO_SIZE;

  const index = data.slice(8, indexLength * ENTRY_INFO_SIZE);

  // Skip the first entry
  for (let i = 1; i < indexLength; i++) {
    const bytes = index.slice(
      i * ENTRY_INFO_SIZE,
      i * ENTRY_INFO_SIZE + ENTRY_INFO_SIZE,
    );

    if (bytes.length < ENTRY_INFO_SIZE) {
      continue;
    }

    const entryInfo: EntryInfo = {
      tag: bytes.readInt32BE(0),
      type: bytes.readUInt32BE(4),
      offset: bytes.readInt32BE(8),
      count: bytes.readUInt32BE(12),
    };

    entryInfos[i - 1] = entryInfo;
  }

  return regionSwab(
    data,
    entryInfos.filter((entry) => entry !== undefined),
    dataStart,
    dataLength,
  );
}

function regionSwab(
  data: Buffer,
  entryInfos: EntryInfo[],
  dataStart: number,
  dataLength: number,
): IndexEntry[] {
  const indexEntries = new Array<IndexEntry>(entryInfos.length);

  for (let i = 0; i < entryInfos.length; i++) {
    const entryInfo = entryInfos[i];

    const entryLength =
      i < entryInfos.length - 1
        ? entryInfos[i + 1].offset - entryInfo.offset
        : dataLength - entryInfo.offset;

    const entryStart = dataStart + entryInfo.offset;
    const entryEnd = entryStart + entryLength;

    const indexEntry: IndexEntry = {
      info: entryInfo,
      data: data.slice(entryStart, entryEnd),
      length: entryLength,
    };

    indexEntries[i] = indexEntry;
  }

  return indexEntries;
}
