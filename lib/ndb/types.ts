/**
 * NDB Header (32 bytes)
 */
export interface NdbHeader {
  headerMagic: number; // NDB_HeaderMagic ('RpmP') - uint32
  ndbVersion: number; // NDB_DBVersion (should be 0) - uint32
  ndbGeneration: number; // uint32 - Seems unused in validation but present in struct
  slotNPages: number; // number of pages in slot directory - uint32
  // The remaining 16 bytes are unused padding ([4]uint32)
}

/**
 * Slot Entry (16 bytes) within a Slot Page.
 */
export interface NdbSlotEntry {
  slotMagic: number; // Should match NDB_SLOT_MAGIC_NUMBER (0x746f6c53, 'Slot') - uint32
  pkgIndex: number; // Package index (0 if free) - uint32
  blkOffset: number; // Block offset (used to calculate blob header offset) - uint32
  blkCount: number; // Block count - uint32
}

/**
 * Blob Header (16 bytes), preceding the Blob data.
 */
export interface NdbBlobHeader {
  blobMagic: number; // Should match NDB_BLOB_MAGIC_NUMBER (0x53626c42, 'BlbS') - uint32
  pkgIndex: number; // Package index (should match slot's pkgIndex) - uint32
  blobCkSum: number; // Adler32 checksum (validation not implemented) - uint32
  blobLen: number; // Length of the blob data following this header - uint32
}
