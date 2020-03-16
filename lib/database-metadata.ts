import { Parser } from 'binary-parser';

import {
  DatabaseMetadata,
  HashMetadata,
  LogSequenceNumber,
  DATABASE_METADATA_SIZE,
  LOG_SEQUENCE_NUMBER_SIZE,
  DB_IV_BYTES,
  DB_MAC_KEY_BYTES,
  nameof,
} from './types';

export function bufferToHashMetadata(data: Buffer): HashMetadata {
  const logSequenceNumber = data.slice(0, LOG_SEQUENCE_NUMBER_SIZE);
  const databaseMetadata = data.slice(
    LOG_SEQUENCE_NUMBER_SIZE,
    DATABASE_METADATA_SIZE,
  );
  const hashMetadata = data.slice(DATABASE_METADATA_SIZE, data.length);

  // TODO: maybe extract into individual functions?
  const lsnParser = new Parser()
    .endianess('little')
    .uint32(nameof<LogSequenceNumber>('file'))
    .uint32(nameof<LogSequenceNumber>('offset'));
  const lsnResult = lsnParser.parse(logSequenceNumber);

  const dbParser = new Parser()
    .endianess('little')
    .uint32(nameof<DatabaseMetadata>('pgno'))
    .uint32(nameof<DatabaseMetadata>('magic'))
    .uint32(nameof<DatabaseMetadata>('version'))
    .uint32(nameof<DatabaseMetadata>('pagesize'))
    .uint8(nameof<DatabaseMetadata>('encrypt_alg'))
    .uint8(nameof<DatabaseMetadata>('type'))
    .uint8(nameof<DatabaseMetadata>('metaflags'))
    .uint8(nameof<DatabaseMetadata>('unused1'))
    .uint32(nameof<DatabaseMetadata>('free'))
    .uint32(nameof<DatabaseMetadata>('last_pgno'))
    .uint32(nameof<DatabaseMetadata>('nparts'))
    .uint32(nameof<DatabaseMetadata>('key_count'))
    .uint32(nameof<DatabaseMetadata>('record_count'))
    .uint32(nameof<DatabaseMetadata>('flags'))
    .array(nameof<DatabaseMetadata>('uid'), { type: 'uint8', length: 20 });

  const dbResultWithoutLsn: Omit<DatabaseMetadata, 'lsn'> = dbParser.parse(
    databaseMetadata,
  );

  const dbResult: DatabaseMetadata = Object.assign(dbResultWithoutLsn, {
    lsn: lsnResult,
  });

  const hashParser = new Parser()
    .endianess('little')
    .uint32(nameof<HashMetadata>('max_bucket'))
    .uint32(nameof<HashMetadata>('high_mask'))
    .uint32(nameof<HashMetadata>('low_mask'))
    .uint32(nameof<HashMetadata>('ffactor'))
    .uint32(nameof<HashMetadata>('nelem'))
    .uint32(nameof<HashMetadata>('h_charkey'))
    .array(nameof<HashMetadata>('spares'), { type: 'uint32le', length: 32 })
    .uint32(nameof<HashMetadata>('blob_threshold'))
    .uint32(nameof<HashMetadata>('blob_file_lo'))
    .uint32(nameof<HashMetadata>('blob_file_hi'))
    .uint32(nameof<HashMetadata>('blob_sdb_lo'))
    .uint32(nameof<HashMetadata>('blob_sdb_hi'))
    .array(nameof<HashMetadata>('unused'), { type: 'uint32le', length: 54 })
    .uint32(nameof<HashMetadata>('crypto_magic'))
    .array(nameof<HashMetadata>('trash'), { type: 'uint32le', length: 3 })
    .array(nameof<HashMetadata>('iv'), { type: 'uint8', length: DB_IV_BYTES })
    .array(nameof<HashMetadata>('chksum'), {
      type: 'uint8',
      length: DB_MAC_KEY_BYTES,
    });

  const hashResultWithoutDbMeta: Omit<
    HashMetadata,
    'dbmeta'
  > = hashParser.parse(hashMetadata);

  const hashResult: HashMetadata = Object.assign(hashResultWithoutDbMeta, {
    dbmeta: dbResult,
  });

  return hashResult;
}
