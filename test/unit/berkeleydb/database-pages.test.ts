import { bufferToHashIndexValues } from '../../../lib/berkeleydb/database-pages';
import { DATABASE_PAGE_HEADER_SIZE } from '../../../lib/berkeleydb/types';

describe('database-pages.test.ts', () => {
  describe('bufferToHashIndexValues()', () => {
    it('throws on uneven number of entries', () => {
      const pageIncludingPgnoField = Buffer.alloc(12);
      const unevenEntries = 3;
      expect(() => {
        bufferToHashIndexValues(pageIncludingPgnoField, unevenEntries);
      }).toThrowError('The number of entries must be a multiple of 2');
    });

    it('processes a simple index with 1 key/value pair', () => {
      const headerSize = DATABASE_PAGE_HEADER_SIZE;
      const arraySize = 400;

      const pageWithLargeButMostlyEmptyIndex = new Uint16Array(
        headerSize + arraySize,
      );

      // Put a marker value at the position where the hash value should be
      pageWithLargeButMostlyEmptyIndex.set(
        [0x01, 0x01],
        DATABASE_PAGE_HEADER_SIZE + 2,
      );

      const buffer = Buffer.from(pageWithLargeButMostlyEmptyIndex);

      const entriesInIndex = 2; // entries are always in pairs
      const result = bufferToHashIndexValues(buffer, entriesInIndex);

      expect(result).toEqual([0x0101]);
    });

    it('processes an index with many key/value pairs', () => {
      const keyValuePairs = 1024;
      const headerSize = DATABASE_PAGE_HEADER_SIZE;

      const pageWithLargeIndex = new Uint16Array(headerSize + keyValuePairs);

      const arraySize = pageWithLargeIndex.length;
      // Fill in only the values of the hash index with a marker.
      for (
        let offset = DATABASE_PAGE_HEADER_SIZE + 2;
        offset < arraySize;
        offset += 4
      ) {
        pageWithLargeIndex.set([0x01, 0x01], offset);
      }

      const result = bufferToHashIndexValues(
        Buffer.from(pageWithLargeIndex),
        keyValuePairs,
      );

      const entryLength = 2;
      const expectedHashes = keyValuePairs / 2;
      const expectedLength = expectedHashes / entryLength;
      expect(result).toHaveLength(expectedLength);
      expect(result.every((entry) => entry === 0x0101)).toBeTruthy();
    });
  });
});
