export const MINIMUM_SUPPORTED_DB_VERSION = 7;

export const DB_IV_BYTES = 16;
export const DB_MAC_KEY_BYTES = 20;
export const HASH_INDEX_ENTRY_BYTES = 2;
export const DATABASE_PAGE_HEADER_SIZE = 26;

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

export enum HashPageType {
  H_KEYDATA = 1, // Key/data item
  H_DUPLICATE = 2, // Duplicate key/data item
  H_OFFPAGE = 3, // Overflow key/data item
  H_OFFDUP = 4, // Overflow page of duplicates
  H_BLOB = 5, // Blob file data item
}

export const HASH_OVERFLOW_SIZE = 12;
