import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve as resolvePath } from 'path';

import { bufferToHashMetadata } from './database-metadata';
import { DatabasePageType, HashPageType, HASH_METADATA_SIZE } from './types';
import { bufferToDatabasePage, bufferToHashIndex } from './database-pages';
import { bufferToKeyDataContent, bufferToHashValueContent } from './hash-pages';

import { headerImport } from './rpm/header';
import { getNEVRA } from './rpm/extensions';

// added for testing!
setImmediate(() => {
  const berkeleydb = readFileSync(
    resolvePath(__dirname, '..', 'test/fixtures/Packages'),
  );
  const metadata = berkeleydb.slice(0, HASH_METADATA_SIZE);

  const hashMetadata = bufferToHashMetadata(metadata);
  const dbMetadata = hashMetadata.dbmeta;

  const result: Array<{ key: Buffer; value: Buffer }> = [];

  for (let pgno = 1; pgno < dbMetadata.last_pgno; pgno++) {
    const page = berkeleydb.slice(
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
        berkeleydb,
        page,
        hashPage.value,
        dbMetadata.pagesize,
      );

      result.push({
        key: keyContent,
        value: valueContent,
      });

      const entries = headerImport(valueContent);
      console.log(getNEVRA(entries));
    }
  }

  for (let i = 0; i < result.length; i++) {
    const entry = result[i];
    if (!existsSync('data')) {
      mkdirSync('data');
    }

    // Ignore the keys, they are just some indexes that have no meaning in RPM
    // writeFileSync(`data/key-${i}.bin`, entry.key);
    writeFileSync(`data/value-${i}.bin`, entry.value);
  }
});
