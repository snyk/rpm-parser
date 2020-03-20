import { DATABASE_PAGE_HEADER_SIZE, HASH_INDEX_ENTRY_BYTES } from '../types';

export function bufferToHashIndexValues(
  data: Buffer,
  entries: number,
): number[] {
  // Hash table entries are always stored in pairs of 2.
  if (entries % HASH_INDEX_ENTRY_BYTES !== 0) {
    throw new Error('The number of entries must be a multiple of 2');
  }

  const indexSize = entries * HASH_INDEX_ENTRY_BYTES;
  const index = data.slice(
    DATABASE_PAGE_HEADER_SIZE,
    DATABASE_PAGE_HEADER_SIZE + indexSize,
  );

  const values = index.reduce((values, _, byteno) => {
    if ((byteno - 2) % 4 === 0) {
      values[(byteno - 2) / 4] = index.readInt16LE(byteno);
    }
    return values;
  }, new Array<number>(entries));
  return values;
}
