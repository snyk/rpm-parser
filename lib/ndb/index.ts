import { ParserError } from '../types';
import { NdbHeader, NdbSlotEntry, NdbBlobHeader } from './types'; // Import updated types
import * as Debug from 'debug';

const debug = Debug('snyk');

const NDB_HeaderMagic = 0x506d7052; // 'R' | 'p'<<8 | 'm'<<16 | 'P'<<24 -> 0x506d7052 Little Endian -> 52 70 6d 50 ("RpmP")
const NDB_DBVersion = 0;
const NDB_SlotMagic = 0x746f6c53; // 'S' | 'l'<<8 | 'o'<<16 | 't'<<24 -> 0x746f6c53 Little Endian -> 53 6c 6f 74 ("Slot")
const NDB_BlobMagic = 0x53626c42; // 'B' | 'l'<<8 | 'b'<<16 | 'S'<<24 -> 0x53626c42 Little Endian -> 42 6c 62 53 ("BlbS")

const NDB_SlotEntriesPerPage = 256; // 4096 / 16
const NDB_HEADER_SIZE = 32; // Size of NdbHeader (4 * uint32 + 16 bytes padding)
const NDB_SLOT_ENTRY_SIZE = 16; // Size of NdbSlotEntry (4 * uint32)
const NDB_BLOB_HEADER_SIZE = 16; // Size of NdbBlobHeader (4 * uint32)

/**
 * Reads the NDB database header (32 bytes) from the beginning of the buffer.
 * @param data The buffer containing the NDB database.
 * @returns The parsed NdbHeader object.
 * @throws ParserError if the buffer is too small or header validation fails.
 */
function readNdbHeader(data: Buffer): NdbHeader {
  if (data.length < NDB_HEADER_SIZE) {
    throw new ParserError(
      `NDB header requires ${NDB_HEADER_SIZE} bytes, but buffer only has ${data.length} bytes.`,
    );
  }

  let offset = 0;
  const headerMagic = data.readUInt32LE(offset);
  offset += 4;
  const ndbVersion = data.readUInt32LE(offset);
  offset += 4; // Offset 4-7
  const ndbGeneration = data.readUInt32LE(offset);
  offset += 4; // Offset 8-11
  const slotNPagesBytes = data.subarray(offset, offset + 4); // Read raw bytes for slotNPages
  const slotNPages = slotNPagesBytes.readUInt32LE(0);
  offset += 4; // Offset 12-15
  // Skip the remaining 16 bytes of padding
  offset += 16; // Offset 16-31

  if (headerMagic !== NDB_HeaderMagic) {
    throw new ParserError(
      `Invalid NDB header magic number. Expected 0x${NDB_HeaderMagic.toString(16)}, got 0x${headerMagic.toString(16)}`,
    );
  }
  if (ndbVersion !== NDB_DBVersion) {
    throw new ParserError(
      `Unsupported NDB version. Expected ${NDB_DBVersion}, got ${ndbVersion}`,
    );
  }
  if (slotNPages === 0) {
    throw new ParserError(`Invalid NDB header: slotNPages cannot be 0.`);
  }
  if (slotNPages > 2048) {
    throw new ParserError(
      `NDB header slot page limit exceeded: ${slotNPages} > 2048`,
    );
  }

  // Check if parsing consumed exactly NDB_HEADER_SIZE bytes
  if (offset !== NDB_HEADER_SIZE) {
    debug(
      `NDB Header parsing finished at offset ${offset}, expected ${NDB_HEADER_SIZE}`,
    );
  }

  return {
    headerMagic,
    ndbVersion,
    ndbGeneration,
    slotNPages,
  };
}

/**
 * Reads all slot entries (16 bytes each) from the slot directory pages,
 * starting immediately after the NDB header.
 */
function readAllSlotEntries(data: Buffer, header: NdbHeader): NdbSlotEntry[] {
  const totalSlotsToRead = header.slotNPages * NDB_SlotEntriesPerPage;
  const slotDataOffset = NDB_HEADER_SIZE; // Slot entries start immediately after the header
  const expectedSlotDataSize = totalSlotsToRead * NDB_SLOT_ENTRY_SIZE;

  // Check if buffer is large enough to contain the header + all slot entries
  const requiredBufferSize = slotDataOffset + expectedSlotDataSize;

  if (data.length < requiredBufferSize) {
    throw new ParserError(
      `Buffer too small to read all NDB slot entries. Required ${expectedSlotDataSize} bytes starting at offset ${slotDataOffset} (total buffer size needed: ${requiredBufferSize}), available ${data.length}`,
    );
  }

  const slots: NdbSlotEntry[] = [];
  let currentOffset = slotDataOffset;
  for (let i = 0; i < totalSlotsToRead; i++) {
    // Read ALL slots defined by header
    const slotMagic = data.readUInt32LE(currentOffset);
    currentOffset += 4;
    const pkgIndex = data.readUInt32LE(currentOffset);
    currentOffset += 4;
    const blkOffset = data.readUInt32LE(currentOffset);
    currentOffset += 4;
    const blkCount = data.readUInt32LE(currentOffset);
    currentOffset += 4;

    slots.push({ slotMagic, pkgIndex, blkOffset, blkCount });
  }

  return slots;
}

/**
 * Reads the NDB Blob Header (16 bytes) from the buffer at the specified offset.
 */
function readNdbBlobHeader(data: Buffer, offset: number): NdbBlobHeader {
  if (offset + NDB_BLOB_HEADER_SIZE > data.length) {
    throw new ParserError(
      `Buffer too small to read NDB blob header at offset ${offset}. Required ${NDB_BLOB_HEADER_SIZE}, available ${data.length - offset}`,
    );
  }
  let currentOffset = offset;
  const blobMagic = data.readUInt32LE(currentOffset);
  currentOffset += 4;
  const pkgIndex = data.readUInt32LE(currentOffset);
  currentOffset += 4;
  const blobCkSum = data.readUInt32LE(currentOffset);
  currentOffset += 4;
  const blobLen = data.readUInt32LE(currentOffset);
  currentOffset += 4;

  return { blobMagic, pkgIndex, blobCkSum, blobLen };
}

/**
 * Parses an NDB format RPM database buffer and extracts the raw package data entries (blobs).
 * @param data Buffer containing the NDB database.
 * @returns An array of Buffers, each containing a raw RPM package entry blob.
 */
export async function bufferToNdbValues(data: Buffer): Promise<Buffer[]> {
  const header = readNdbHeader(data);
  const slots = readAllSlotEntries(data, header);

  const packageBlobs: Buffer[] = [];

  // Iterate through the slots read (which already excludes the first two positions).
  for (let i = 0; i < slots.length; i++) {
    // Start from index 0 now
    const slot = slots[i];

    // Validate slot magic
    if (slot.slotMagic !== NDB_SlotMagic) {
      debug(
        `Bad slot magic 0x${slot.slotMagic.toString(16)} at slot index ${i}. Expected 0x${NDB_SlotMagic.toString(16)}. Skipping.`,
      );
      continue;
    }

    // Skip empty slots
    if (slot.pkgIndex === 0) {
      continue;
    }

    // Calculate offset to the Blob Header
    const blobHeaderOffset = slot.blkOffset * NDB_BLOB_HEADER_SIZE;

    if (blobHeaderOffset >= data.length) {
      debug(
        `Calculated blob header offset ${blobHeaderOffset} (slot ${i}, blkOffset ${slot.blkOffset}) is out of bounds (${data.length}). Skipping package index ${slot.pkgIndex}.`,
      );
      continue;
    }

    try {
      // Read Blob Header
      const blobHeader = readNdbBlobHeader(data, blobHeaderOffset);

      // Validate Blob Header Magic
      if (blobHeader.blobMagic !== NDB_BlobMagic) {
        debug(
          `Unexpected NDB blob magic 0x${blobHeader.blobMagic.toString(16)} for pkg index ${slot.pkgIndex} (slot ${i}). Expected 0x${NDB_BlobMagic.toString(16)}. Skipping.`,
        );
        continue;
      }

      // Validate PkgIndex match
      if (blobHeader.pkgIndex !== slot.pkgIndex) {
        debug(
          `NDB blob header pkg index mismatch for slot ${i}. Slot index: ${slot.pkgIndex}, Blob header index: ${blobHeader.pkgIndex}. Skipping.`,
        );
        continue;
      }

      // Calculate Blob Data offset and check bounds
      const blobDataOffset = blobHeaderOffset + NDB_BLOB_HEADER_SIZE;
      const blobDataEndOffset = blobDataOffset + blobHeader.blobLen;

      if (blobDataOffset > data.length || blobDataEndOffset > data.length) {
        debug(
          `NDB blob data range [${blobDataOffset}-${blobDataEndOffset}) is out of bounds (${data.length}) for pkg index ${slot.pkgIndex} (slot ${i}, blobLen ${blobHeader.blobLen}). Skipping.`,
        );
        continue;
      }

      // Read Blob Content
      const blobEntry = data.subarray(blobDataOffset, blobDataEndOffset);
      packageBlobs.push(blobEntry);

      // TODO: Implement Adler32 checksum validation using blobHeader.blobCkSum if needed.
    } catch (error) {
      debug(
        `Error processing NDB blob for pkg index ${slot.pkgIndex} (slot ${i}): ${error instanceof Error ? error.message : String(error)}`,
      );
      continue;
    }
  }

  return packageBlobs;
}
