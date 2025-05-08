import { readFileSync } from 'fs';
import { join } from 'path';
import { getPackagesNdb } from '../../../lib';

function fixturePath(fileName: string): string {
  // Path relative to this test file (test/unit/ndb) -> ../../fixtures/
  return join(__dirname, '..', '..', 'fixtures', fileName);
}

// Validation steps:
// 1. docker run -dit --name sle-test registry.suse.com/suse/sle15:15.3 && docker exec -it sle-test bash
// 2. docker cp sle-test:/usr/lib/sysimage/rpm/Packages.db ./Packages.db
// 3. syft registry.suse.com/suse/sle15:15.3 -o github-json > output-sle15.3
// 4. jq '.manifests["registry.suse.com/suse/sle15:15.3:/usr/lib/sysimage/rpm/Packages.db"].resolved | length'  output-sle15.3
// 5. 132 packages found

describe('NDB Database Parser tests', () => {
  test('should parse SLE15.3 NDB Packages.db file', async () => {
    // Update test description
    const fixtureFile = fixturePath('ndb-packages.db'); // Load the SLE15.3 fixture
    const dbBuffer = readFileSync(fixtureFile);
    const result = await getPackagesNdb(dbBuffer);

    expect(result.error).toBeUndefined();
    expect(result.rpmMetadata).toBeDefined();
    expect(result.rpmMetadata?.dbType).toEqual('NDB');
    expect(result.response).toBeDefined();
    expect(result.response.length).toEqual(132);
  });
});
