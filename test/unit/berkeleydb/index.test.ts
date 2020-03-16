import {
  validateBerkeleyDbMetadata,
  validatePageSize,
} from '../../../lib/berkeleydb';
import { DatabasePageType } from '../../../lib/berkeleydb/types';

describe('Check validation on bufferToHashDbValues()', () => {
  it('throws on wrong magic number', () => {
    const dbMetadataIncludingSizeField = Buffer.alloc(16);
    const badMagicBytes = [0x12, 0x13, 0x14, 0x15];
    const startOfSizeField = 12;
    dbMetadataIncludingSizeField.set(badMagicBytes, startOfSizeField);

    expect(() => {
      validateBerkeleyDbMetadata(dbMetadataIncludingSizeField);
    }).toThrowError(/Unexpected database magic number/);
  });

  it('throws on wrong page type', () => {
    const dbMetadataIncludingTypeField = Buffer.alloc(26);
    const magicNumber = [0x61, 0x15, 0x06, 0x00];
    const startOfSizeField = 12;
    dbMetadataIncludingTypeField.set(magicNumber, startOfSizeField);

    const badDatabaseType = [0xff];
    const startOfTypeField = 25;
    dbMetadataIncludingTypeField.set(badDatabaseType, startOfTypeField);

    expect(() => {
      validateBerkeleyDbMetadata(dbMetadataIncludingTypeField);
    }).toThrowError(/Unexpected page type/);
  });

  it('throws on encryption algorithm present', () => {
    const dbMetadataIncludingEncryptionAlgorithmField = Buffer.alloc(26);
    const magicNumber = [0x61, 0x15, 0x06, 0x00];
    const startOfSizeField = 12;
    dbMetadataIncludingEncryptionAlgorithmField.set(
      magicNumber,
      startOfSizeField,
    );

    const databaseType = [DatabasePageType.P_HASHMETA];
    const startOfTypeField = 25;
    dbMetadataIncludingEncryptionAlgorithmField.set(
      databaseType,
      startOfTypeField,
    );

    const startOfEncryptionAlgorithmField = 24;
    const badEncryptionAlgorithm = [0x01];
    dbMetadataIncludingEncryptionAlgorithmField.set(
      badEncryptionAlgorithm,
      startOfEncryptionAlgorithmField,
    );

    expect(() => {
      validateBerkeleyDbMetadata(dbMetadataIncludingEncryptionAlgorithmField);
    }).toThrowError(/Encrypted databases are not supported/);
  });

  it('throws on negative number of entries', () => {
    const dbMetadataIncludingEntriesField = Buffer.alloc(92);
    const magicNumber = [0x61, 0x15, 0x06, 0x00];
    const startOfSizeField = 12;
    dbMetadataIncludingEntriesField.set(magicNumber, startOfSizeField);

    const databaseType = [DatabasePageType.P_HASHMETA];
    const startOfTypeField = 25;
    dbMetadataIncludingEntriesField.set(databaseType, startOfTypeField);

    const startOfEntriesField = 88;
    const badEntries = [0x00, 0x00, 0x00, 0x80]; // negative number
    dbMetadataIncludingEntriesField.set(badEntries, startOfEntriesField);

    expect(() => {
      validateBerkeleyDbMetadata(dbMetadataIncludingEntriesField);
    }).toThrowError(/Invalid number of entries in the database/);
  });

  it('throws on large number of entries', () => {
    const dbMetadataIncludingEntriesField = Buffer.alloc(92);
    const magicNumber = [0x61, 0x15, 0x06, 0x00];
    const startOfSizeField = 12;
    dbMetadataIncludingEntriesField.set(magicNumber, startOfSizeField);

    const databaseType = [DatabasePageType.P_HASHMETA];
    const startOfTypeField = 25;
    dbMetadataIncludingEntriesField.set(databaseType, startOfTypeField);

    const startOfEntriesField = 88;
    const badEntries = [0x51, 0xc3, 0x00, 0x00]; // 50001
    dbMetadataIncludingEntriesField.set(badEntries, startOfEntriesField);

    expect(() => {
      validateBerkeleyDbMetadata(dbMetadataIncludingEntriesField);
    }).toThrowError(/Invalid number of entries in the database/);
  });
});

describe('Check validation on validatePageSize()', () => {
  test('happy path with supported page sizes', () => {
    for (const pageSize of [512, 1024, 2048, 4096, 8192, 16384, 32768, 65536]) {
      expect(() => {
        validatePageSize(pageSize);
      }).not.toThrowError(/Invalid page size/);
    }
  });

  it('throws on invalid page size', () => {
    for (const pageSize of [
      Number.NEGATIVE_INFINITY,
      Number.MIN_VALUE,
      -1,
      0,
      1,
      2,
      3,
      511,
      1000,
      4000,
      Number.MAX_VALUE,
      Number.POSITIVE_INFINITY,
    ]) {
      expect(() => {
        validatePageSize(pageSize);
      }).toThrowError(/Invalid page size/);
    }
  });
});
