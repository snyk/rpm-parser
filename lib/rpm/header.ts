import { IndexEntry, ENTRY_INFO_SIZE, EntryInfo } from './types';
import { Parser } from 'binary-parser';
import { nameof } from '../types';

export function headerImport(data: Buffer): IndexEntry[] {
  const indexLength = data.readInt32BE(0);
  const dataLength = data.readInt32BE(4);

  if (indexLength <= 0 || indexLength > 1_000_000) {
    // Ensure we don't allocate something crazy...
    throw new Error('Invalid index length');
  }

  const entryInfos = new Array<EntryInfo>();

  // Skip the first 2 items (index and data lengths)
  const dataStart = 8 + indexLength * ENTRY_INFO_SIZE;

  const index = data.slice(8, indexLength * ENTRY_INFO_SIZE);

  const entryInfoParser = new Parser()
    .endianess('big')
    .int32(nameof<EntryInfo>('tag'))
    .uint32(nameof<EntryInfo>('type'))
    .int32(nameof<EntryInfo>('offset'))
    .uint32(nameof<EntryInfo>('count'));

  for (let i = 0; i < indexLength; i++) {
    const bytes = index.slice(
      i * ENTRY_INFO_SIZE,
      i * ENTRY_INFO_SIZE + ENTRY_INFO_SIZE,
    );

    if (bytes.length < ENTRY_INFO_SIZE) {
      continue;
    }

    const entryInfo: EntryInfo = entryInfoParser.parse(bytes);
    entryInfos.push(entryInfo);
  }

  return regionSwab(data, entryInfos.slice(1), dataStart, dataLength);
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
      ridlen: 0,
    };

    indexEntries[i] = indexEntry;
  }

  return indexEntries;
}
