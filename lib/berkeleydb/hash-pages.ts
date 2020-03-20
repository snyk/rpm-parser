import {
  HashPageType,
  HASH_OVERFLOW_SIZE,
  DATABASE_PAGE_HEADER_SIZE,
} from '../types';

export function bufferToHashValueContent(
  berkeleydb: Buffer,
  page: Buffer,
  pageStartByte: number,
  pageSize: number,
): Buffer {
  const pageType = page[pageStartByte];
  switch (pageType) {
    case HashPageType.H_OFFPAGE:
      break;
    default:
      throw new Error('Unsupported page type');
  }

  const entry = page.slice(pageStartByte, pageStartByte + HASH_OVERFLOW_SIZE);
  const pgno = entry.readUInt32LE(4);
  const tlen = entry.readUInt32LE(8);

  return reconstructValue(berkeleydb, pgno, tlen, pageSize);
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
    const next_pgno = page.readUInt32LE(16);
    const hf_offset = page.readUInt16LE(22);

    const isLastPage = next_pgno === 0;
    const bytesToWrite = isLastPage
      ? page.slice(DATABASE_PAGE_HEADER_SIZE, hf_offset)
      : page.slice(DATABASE_PAGE_HEADER_SIZE, page.length);

    const index = bytesWritten;
    result.set(bytesToWrite, index);
    bytesWritten += bytesToWrite.length;

    nextPgno = next_pgno;
  }

  return result;
}
