import { Parser } from 'binary-parser';

import {
  HashKeyDataItem,
  HashOverflowItem,
  HashPageType,
  HASH_KEY_DATA_SIZE,
  HASH_OVERFLOW_SIZE,
  DATABASE_PAGE_HEADER_SIZE,
  nameof,
} from '../types';
import { bufferToDatabasePage } from './database-pages';

export function bufferToKeyDataContent(
  page: Buffer,
  pageStartByte: number,
): Buffer {
  const entry = page.slice(pageStartByte, pageStartByte + HASH_KEY_DATA_SIZE);

  const parser = new Parser()
    .endianess('little')
    .uint8(nameof<HashKeyDataItem>('type'))
    .uint32(nameof<HashKeyDataItem>('data'));
  const keyDataEntry: HashKeyDataItem = parser.parse(entry);

  const result = Buffer.alloc(4);
  result.writeUInt32LE(keyDataEntry.data, 0);
  return result;
}

export function bufferToHashValueContent(
  berkeleydb: Buffer,
  page: Buffer,
  pageStartByte: number,
  pageSize: number,
): Buffer {
  const pageType = page[pageStartByte];
  switch (pageType) {
    case HashPageType.H_KEYDATA:
      return bufferToKeyDataContent(page, pageStartByte);
    case HashPageType.H_OFFPAGE:
      break;
    default:
      throw new Error('Unsupported page type');
  }

  const entry = page.slice(pageStartByte, pageStartByte + HASH_OVERFLOW_SIZE);

  const parser = new Parser()
    .endianess('little')
    .uint8(nameof<HashOverflowItem>('type'))
    .array(nameof<HashOverflowItem>('unused'), { type: 'uint8', length: 3 })
    .uint32(nameof<HashOverflowItem>('pgno'))
    .uint32(nameof<HashOverflowItem>('tlen'));
  const overflowItem: HashOverflowItem = parser.parse(entry);

  return reconstructValue(
    berkeleydb,
    overflowItem.pgno,
    overflowItem.tlen,
    pageSize,
  );
}

function reconstructValue(
  berkeleydb: Buffer,
  startPgno: number,
  dataLengthBytes: number,
  pageSize: number,
): Buffer {
  const result = Buffer.alloc(dataLengthBytes);
  let bytesWritten = 0;

  for (let nextPgno = startPgno; nextPgno !== 0; ) {
    const pageStart = pageSize * nextPgno;
    const pageEnd = pageSize * nextPgno + pageSize;

    const page = berkeleydb.slice(pageStart, pageEnd);
    const pageMetadata = bufferToDatabasePage(page);

    const isLastPage = pageMetadata.next_pgno === 0;
    const bytesToWrite = isLastPage
      ? page.slice(DATABASE_PAGE_HEADER_SIZE, pageMetadata.hf_offset)
      : page.slice(DATABASE_PAGE_HEADER_SIZE, page.length);

    const index = bytesWritten;
    result.set(bytesToWrite, index);
    bytesWritten += bytesToWrite.length;

    nextPgno = pageMetadata.next_pgno;
  }

  return result;
}
