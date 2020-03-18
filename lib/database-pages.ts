import {
  DatabasePage,
  LogSequenceNumber,
  LOG_SEQUENCE_NUMBER_SIZE,
  nameof,
} from './types';
import { Parser } from 'binary-parser';

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
