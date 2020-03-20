import { Parser } from 'binary-parser';

import {
  DatabasePage,
  LogSequenceNumber,
  HashIndex,
  LOG_SEQUENCE_NUMBER_SIZE,
  DATABASE_PAGE_HEADER_SIZE,
  HASH_INDEX_ENTRY_BYTES,
  nameof,
} from '../types';

export function bufferToDatabasePage(data: Buffer): DatabasePage {
  const logSequenceNumber = data.slice(0, LOG_SEQUENCE_NUMBER_SIZE);
  const pageMetadata = data.slice(LOG_SEQUENCE_NUMBER_SIZE, data.length);

  // TODO: maybe extract into individual functions?
  const lsnParser = new Parser()
    .endianess('little')
    .uint32(nameof<LogSequenceNumber>('file'))
    .uint32(nameof<LogSequenceNumber>('offset'));
  const lsnResult = lsnParser.parse(logSequenceNumber);

  const pageParser = new Parser()
    .endianess('little')
    .uint32(nameof<DatabasePage>('pgno'))
    .uint32(nameof<DatabasePage>('prev_pgno'))
    .uint32(nameof<DatabasePage>('next_pgno'))
    .uint16(nameof<DatabasePage>('entries'))
    .uint16(nameof<DatabasePage>('hf_offset'))
    .uint8(nameof<DatabasePage>('level'))
    .uint8(nameof<DatabasePage>('type'));

  const pageResultWithoutLsn: Omit<DatabasePage, 'lsn'> = pageParser.parse(
    pageMetadata,
  );

  const pageResult: DatabasePage = Object.assign(pageResultWithoutLsn, {
    lsn: lsnResult,
  });

  return pageResult;
}

export function bufferToHashIndex(data: Buffer, entries: number): HashIndex {
  // Hash table entries are always stored in pairs of 2.
  if (entries % HASH_INDEX_ENTRY_BYTES !== 0) {
    throw new Error('The number of entries must be a multiple of 2');
  }

  const indexSize = entries * HASH_INDEX_ENTRY_BYTES;
  const index = data.slice(DATABASE_PAGE_HEADER_SIZE, indexSize);

  const hashIndex: HashIndex = { entries: [] };

  // We process entries in pairs
  for (let i = 0; i < indexSize; i += HASH_INDEX_ENTRY_BYTES * 2) {
    const key = index.slice(i, i + 2);
    const value = index.slice(i + 2, i + 4);

    if (key.length !== 0 && value.length !== 0) {
      hashIndex.entries.push({
        key: key.readUInt16LE(0),
        value: value.readUInt16LE(0),
      });
    }
  }

  return hashIndex;
}
