import { bufferToHashMetadata } from './berkeleydb/database-metadata';
import { DatabasePageType, HashPageType, HASH_METADATA_SIZE } from './types';
import { bufferToDatabasePage, bufferToHashIndex } from './berkeleydb/database-pages';
import { bufferToKeyDataContent, bufferToHashValueContent } from './berkeleydb/hash-pages';

import { headerImport } from './rpm/header';
import { getNEVRA } from './rpm/extensions';

export function getPackages(data: Buffer): string {
  const metadata = data.slice(0, HASH_METADATA_SIZE);

  const hashMetadata = bufferToHashMetadata(metadata);
  const dbMetadata = hashMetadata.dbmeta;

  const result: Array<{ key: Buffer; value: Buffer }> = [];

  const output: string[] = [];

  for (let pgno = 1; pgno < dbMetadata.last_pgno; pgno++) {
    const page = data.slice(
      pgno * dbMetadata.pagesize,
      pgno * dbMetadata.pagesize + dbMetadata.pagesize,
    );

    const pageMetadata = bufferToDatabasePage(page);

    if (pageMetadata.type !== DatabasePageType.P_HASH) {
      break;
    }

    const hashIndex = bufferToHashIndex(page, pageMetadata.entries);

    for (const hashPage of hashIndex.entries) {
      const keyPageType = page[hashPage.key];
      if (keyPageType !== HashPageType.H_KEYDATA) {
        throw new Error('Unexpected key type');
      }

      const valuePageType = page[hashPage.value];
      if (valuePageType !== HashPageType.H_OFFPAGE) {
        // The first page will have a key and value of type H_KEYDATA,
        // the value means nothing to us, so we can just skip it.
        continue;
      }

      const keyContent = bufferToKeyDataContent(page, hashPage.key);
      const valueContent = bufferToHashValueContent(
        data,
        page,
        hashPage.value,
        dbMetadata.pagesize,
      );

      result.push({
        key: keyContent,
        value: valueContent,
      });

      const entries = headerImport(valueContent);
      const packageInfo = getNEVRA(entries);

      const entry =
        packageInfo.epoch === undefined || packageInfo.epoch === 0
          ? `${packageInfo.name}\t${packageInfo.version}-${packageInfo.release}\t${packageInfo.size}`
          // tslint:disable-next-line: max-line-length
          : `${packageInfo.name}\t${packageInfo.epoch}:${packageInfo.version}-${packageInfo.release}\t${packageInfo.size}`;
      output.push(entry);
    }
  }

  return output.join('\n');
}
