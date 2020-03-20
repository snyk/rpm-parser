import {
  DatabasePageType,
  HashPageType,
  DATABASE_PAGE_HEADER_SIZE,
} from './types';
import { bufferToHashIndexValues } from './berkeleydb/database-pages';
import { bufferToHashValueContent } from './berkeleydb/hash-pages';

import { headerImport } from './rpm/header';
import { getNEVRA } from './rpm/extensions';

export function getPackages(data: Buffer): string {
  const pagesize = data.readUInt32LE(20);
  const last_pgno = data.readUInt32LE(32);

  const output: string[] = [];

  for (let pgno = 1; pgno < last_pgno; pgno++) {
    const pageStart = pgno * pagesize;
    const pageEnd = pgno * pagesize + pagesize;

    const pageType = data[pageStart + DATABASE_PAGE_HEADER_SIZE - 1];
    // Look only for HASH pages, we will traverse them in subsequent steps
    if (pageType !== DatabasePageType.P_HASH) {
      continue;
    }

    const page = data.slice(pageStart, pageEnd);
    const entries = page.readUInt16LE(20);
    const hashIndex = bufferToHashIndexValues(page, entries);

    for (const hashPage of hashIndex) {
      const valuePageType = page[hashPage];
      if (valuePageType !== HashPageType.H_OFFPAGE) {
        // The first page will have a key and value of type H_KEYDATA,
        // the value means nothing to us, so we can just skip it.
        continue;
      }

      const valueContent = bufferToHashValueContent(
        data,
        page,
        hashPage,
        pagesize,
      );

      const entries = headerImport(valueContent);
      const packageInfo = getNEVRA(entries);

      const entry =
        packageInfo.epoch === undefined || packageInfo.epoch === 0
          ? `${packageInfo.name}\t${packageInfo.version}-${packageInfo.release}\t${packageInfo.size}`
          : // tslint:disable-next-line: max-line-length
            `${packageInfo.name}\t${packageInfo.epoch}:${packageInfo.version}-${packageInfo.release}\t${packageInfo.size}`;
      output.push(entry);
    }
  }

  return output.join('\n');
}
