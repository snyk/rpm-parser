import { readFileSync } from 'fs';
import { resolve as resolvePath } from 'path';

import { bufferToHashMetadata } from './database-metadata';
import {
  HashPageType,
  HASH_METADATA_SIZE,
  DATABASE_PAGE_SIZE,
} from './types';
import { bufferToDatabasePage } from './database-pages';

// added for testing!
const conzole = console;
setImmediate(() => {
  conzole.log(`Started: ${new Date().toLocaleTimeString()}`);

  const berkeleydb = readFileSync(
    resolvePath(__dirname, '..', 'test/fixtures/Packages'),
  );
  const metadata = berkeleydb.slice(0, HASH_METADATA_SIZE);

  const hashMetadata = bufferToHashMetadata(metadata);
  const dbMetadata = hashMetadata.dbmeta;

  for (let pgno = 1; pgno < dbMetadata.last_pgno; pgno++) {
    const page = berkeleydb.slice(
      pgno * dbMetadata.pagesize,
      pgno * dbMetadata.pagesize + dbMetadata.pagesize,
    );

    const pageMetadata = bufferToDatabasePage(page);
    conzole.log(pageMetadata);

    // __ham_item_first -> get first page
    // __ham_item_next -> get next page

    // Note that key/data lengths are often stored in db_indx_t

    // db_cam.c:1281
    // pgno === 0 at the start of getting a hash! key and data are empty pointers with user allocated memory!
    // - allocate hash meta struct, using meta_pgno === 0
    // - hcp->seek_size = 0;
    // the pgno is === 0, so call __ham_item_first!
    //    - __ham_item_init()
    //    - hcp->bucket = 0;
    //      hcp->pgno = BUCKET_TO_PAGE(hcp, hcp->bucket); // sets the cursor's pgno!!!
    //        - #define	BUCKET_TO_PAGE(hcp, hcp->bucket)	(BS_TO_PAGE((hcp->bucket), (hcp)->hdr->spares)) // hmeta spares
    //          #define	BS_TO_PAGE(bucket, spares) ((bucket) + (spares)[__db_log2((bucket) + 1)])
    //          #define	BS_TO_PAGE(0, spares) ((0) + (spares)[__db_log2((0) + 1)]) // index into the spares array!
    /*
                u_int32_t
                __db_log2(num)
                  u_int32_t num;
                {
                  u_int32_t i, limit;

                  limit = 1;
                  for (i = 0; limit < num; limit = limit << 1)
                    ++i;
                  return (i);
                }
    */
    //          #define	BS_TO_PAGE(0, spares) ((0) + (spares)[0]), meaning...
    //      hcp->pgno = spares[0]; meaning...
    //      hcp->pgno = 1;
    //
    //      hcp->dup_off = 0;
    //  - __ham_item_next()
    //    - __ham_get_cpage()
    //    - allocate 4096 bytes into hcp->page
    //    - hcp->indx += 2; // it was NDX_INVALID (0), so 0 += 2
    //    - __ham_item()
    //      - ((u_int8_t *)pg + ((db_indx_t *)((u_int8_t *)(pg) + 26))[3]) // 26 * 3 = 78
    //        we should be accessing the byte at position 78 but it doesn't have what we want...

    const pageData = page.slice(DATABASE_PAGE_SIZE, page.length);
    // TODO: find the right index...
    const pageType: HashPageType = pageData[0];

    // ^ how to calculate bytes of interest, containing potentially HashPageType bytes:
    [...pageData].map((byte, index) => ({ byte, index })).filter(({ byte }) => byte !== 0 && byte <= 5);

    switch (pageType) {
      case HashPageType.H_OFFPAGE:
        conzole.log('Hash type H_OFFPAGE');
        break;
      case HashPageType.H_BLOB:
        conzole.log('Hash type H_BLOB');
        break;
      default:
        conzole.log('Hash type ' + pageType);
        break;
    }

    // read first 2 hash tables, and 1 overflow table, and stop
    if (pgno === 3) {
      break;
    }
  }

  conzole.log(`Finished: ${new Date().toLocaleTimeString()}`);
});
