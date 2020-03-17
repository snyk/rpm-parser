import { readFileSync } from 'fs';
import { resolve as resolvePath } from 'path';
import { bufferToHashMetadata } from './database-metadata';
import { HASH_METADATA_SIZE } from './types';

// added for testing!
setImmediate(() => {
  const berkeleydb = readFileSync(resolvePath(__dirname, '..', 'test/fixtures/Packages'));
  const metadata = berkeleydb.slice(0, HASH_METADATA_SIZE);

  const result = bufferToHashMetadata(metadata);
  const conzole = console;
  conzole.log(JSON.stringify(result));
});
