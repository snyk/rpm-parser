type Uint8 = number;
type Uint32 = number;
type DatabasePageNumber = number;

export const LOG_SEQUENCE_NUMBER_SIZE = 8;
export const DATABASE_METADATA_SIZE = 72;
export const HASH_METADATA_SIZE = 512;

export const DB_IV_BYTES = 16;
export const DB_MAC_KEY_BYTES = 20;

export function nameof<T>(key: keyof T): keyof T {
  return key;
}

export interface LogSequenceNumber {
  file: Uint32;
  offset: Uint32;
}

export interface DatabaseMetadata {
  lsn: LogSequenceNumber;
  pgno: DatabasePageNumber;
  magic: Uint32;
  version: Uint32;
  pagesize: Uint32;
  encrypt_alg: Uint8;
  type: Uint8;
  metaflags: Uint8;
  unused1: Uint8;
  free: Uint32;
  last_pgno: DatabasePageNumber;
  nparts: Uint32;
  key_count: Uint32;
  record_count: Uint32;
  flags: Uint32;
  uid: Uint8[]; // length === 20
}

export interface HashMetadata {
  dbmeta: DatabaseMetadata;
  max_bucket: Uint32;
  high_mask: Uint32;
  low_mask: Uint32;
  ffactor: Uint32;
  nelem: Uint32;
  h_charkey: Uint32;
  spares: Uint32[]; // length === 32
  blob_threshold: Uint32;
  blob_file_lo: Uint32;
  blob_file_hi: Uint32;
  blob_sdb_lo: Uint32;
  blob_sdb_hi: Uint32;
  unused: Uint32[]; // length === 54
  crypto_magic: Uint32;
  trash: Uint32[]; // length === 3
  iv: Uint8[]; // length === 16
  chksum: Uint8[]; // length === 20
}
