type Uint8 = number;
type Uint16 = number;
type Uint32 = number;
type Uint64 = number;
type DatabasePageNumber = Uint32;

export const MINIMUM_SUPPORTED_DB_VERSION = 7;

export const DB_IV_BYTES = 16;
export const DB_MAC_KEY_BYTES = 20;
export const HASH_INDEX_ENTRY_BYTES = 2;

export enum DatabaseMagicNumber {
  DB_BTREEE = 0x053162,
  DB_HASH = 0x061561,
  DB_HEAP = 0x074582,
  DB_QAM = 0x042253,
}

export enum DatabasePageType {
  P_INVALID = 0,
  P_OVERFLOW = 7,
  P_HASHMETA = 8,
  P_HASH = 13,
}

export function nameof<T>(key: keyof T): keyof T {
  return key;
}

export const LOG_SEQUENCE_NUMBER_SIZE = 8;

export interface LogSequenceNumber {
  file: Uint32;
  offset: Uint32;
}

export const DATABASE_METADATA_SIZE = 72;

export interface DatabaseMetadata {
  lsn: LogSequenceNumber;
  pgno: DatabasePageNumber;
  magic: Uint32 | DatabaseMagicNumber;
  version: Uint32;
  pagesize: Uint32;
  encrypt_alg: Uint8;
  type: Uint8 | DatabasePageType;
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

export const HASH_METADATA_SIZE = 512;

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

/**
 * + 8 for the LogSequenceNumber
 * + 20 for the metadata
 */
export const DATABASE_PAGE_HEADER_SIZE = 26;

export interface DatabasePage {
  lsn: LogSequenceNumber;
  pgno: DatabasePageNumber;
  prev_pgno: Uint32;
  next_pgno: Uint32;
  entries: Uint16;
  hf_offset: Uint16;
  level: Uint8;
  type: Uint8 | DatabasePageType;
}

export interface HashIndexEntry {
  key: Uint16;
  value: Uint16;
}

export interface HashIndex {
  entries: HashIndexEntry[];
}

export interface PageCryptography {
  unused: Uint8[]; // length === 2
  chksum: Uint8[]; // length === DB_MAC_KEY_BYTES
  iv: Uint8[]; // length === DB_IV_BYTES
  unused_padding: Uint8[]; // length === 10, this aligns the type on 16-byte boundaries
}

export interface PageChecksum {
  unused: Uint8[]; // length === 2
  chksum: Uint8[]; // length === 4
}

export enum HashPageType {
  H_KEYDATA = 1, // Key/data item
  H_DUPLICATE = 2, // Duplicate key/data item
  H_OFFPAGE = 3, // Overflow key/data item
  H_OFFDUP = 4, // Overflow page of duplicates
  H_BLOB = 5, // Blob file data item
}

/*
 * The first and second types are H_KEYDATA and H_DUPLICATE, represented
 * by the HKEYDATA structure:
 *
 *	+-----------------------------------+
 *	|    type   | key/data ...          |
 *	+-----------------------------------+
 *
 * For duplicates, the data field encodes duplicate elements in the data
 * field:
 *	+---------------------------------------------------------------+
 *	|    type   | len1 | element1 | len1 | len2 | element2 | len2   |
 *	+---------------------------------------------------------------+
 * Thus, by keeping track of the offset in the element, we can do both
 * backward and forward traversal.
 */

export const HASH_KEY_DATA_SIZE = 5;

export interface HashKeyDataItem {
  type: Uint8 | HashPageType;
  // data: Uint8[]; // Variable length key/data item.
  data: Uint32; // This is actually 4 bytes, not variable!
}

export interface HashKeyDuplicateItem {
  type: Uint8 | HashPageType;
  // TODO: verify that len_hi and len_lo are of the right type!
  data: Array<{
    len_hi: number;
    data: Uint8[];
    len_lo: number;
  }>;
}

/*
 * The fourth type is H_OFFDUP represented by the HOFFDUP structure:
 */
export interface HashOverflowDuplicateItem {
  type: Uint8 | HashPageType; // Page type and delete flag
  unused: Uint8[]; // length === 3
  pgno: DatabasePageNumber; // Offpage page number, the first page of the overflow item
}

/*
 * The third type is the H_OFFPAGE, represented by the HOFFPAGE structure.
 * The overflow item consists of some number of overflow pages, linked by
 * the next_pgno field of the page.
 * A next_pgno field of PGNO_INVALID flags the end of the overflow item.
 *
 * Overflow page overloads:
 *	The amount of overflow data stored on each page is stored in the
 *	hf_offset field.
 */
export const HASH_OVERFLOW_SIZE = 12;

export interface HashOverflowItem extends HashOverflowDuplicateItem {
  tlen: Uint32; // Total length of the overflow item
}

/*
 * The fifth type is the H_BLOB, represented by the HBLOB structure.
 * Saving bytes is not a concern for the blob record type - if too many
 * fit onto a single page, then we're likely to introduce unnecessary
 * contention for blobs. Using blobs implies storing large items, thus slightly
 * more per-item overhead is acceptable.
 * If this proves untrue, the crypto section of the record could be optional.
 * encoding, encryption, and checksum fields are unused at the moment, but
 * included to make adding those features easier.
 */
export interface HashBlobItem {
  type: Uint8 | HashPageType; // Page type and delete flag
  encoding: Uint8; // Encoding of blob file
  unused: Uint8[]; // length === 10
  chksum: Uint8[]; // length === DB_MAC_KEY_BYTES
  iv: Uint8[]; // length == DB_IV_BYTES
  id: Uint64; // Blob file identifier
  size: Uint64; // Blob file size
  file_id: Uint64; // File directory
  sdb_id: Uint64; // Subdb that owns this blob
}

export enum KeyDataFlags {
  DB_DBT_APPMALLOC = 0x0001 /* Callback allocated memory. */,
  DB_DBT_BULK = 0x0002 /* Internal: Insert if duplicate. */,
  DB_DBT_DUPOK = 0x0004 /* Internal: Insert if duplicate. */,
  DB_DBT_ISSET = 0x0008 /* Lower level calls set value. */,
  DB_DBT_MALLOC = 0x0010 /* Return in malloc'd memory. */,
  DB_DBT_MULTIPLE = 0x0020 /* References multiple records. */,
  DB_DBT_PARTIAL = 0x0040 /* Partial put/get. */,
  DB_DBT_REALLOC = 0x0080 /* Return in realloc'd memory. */,
  DB_DBT_READONLY = 0x0100 /* Readonly, don't update. */,
  DB_DBT_STREAMING = 0x0200 /* Internal: DBT is being streamed. */,
  DB_DBT_USERCOPY = 0x0400 /* Use the user-supplied callback. */,
  DB_DBT_USERMEM = 0x0800 /* Return in user's memory. */,
  DB_DBT_BLOB = 0x1000 /* Alias DB_DBT_EXT_FILE. */,
  DB_DBT_EXT_FILE = 0x1000 /* Data item is an external file. */,
  DB_DBT_BLOB_REC = 0x2000 /* Internal: Blob database record. */,
}

export interface KeyDataItem {
  data: void;
  size: Uint32;
  ulen: Uint32;
  dlen: Uint32;
  doff: Uint32;
  app_data: void;
  flags: Uint32;
}
