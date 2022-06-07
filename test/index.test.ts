import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

import { getPackages, getPackagesSqlite } from '../lib';

function fixturePath(path: string): string {
  return join(__dirname, path);
}

describe('Testing various RPM Berkeley databases', () => {
  const fixturePaths = [
    'amazonlinux2_plain',
    'centos6_dev_tools',
    'centos6_many',
    'centos6_plain',
    'centos7_dev_tools',
    'centos7_httpd24',
    'centos7_many',
    'centos7_plain',
    'centos7_python35',
    'fedora26_many',
    'rpm4_empty',
    'ubi7_plain',
    'ubi8_plain',
  ];

  for (const path of fixturePaths) {
    // Create a test run for every fixture
    test(path, async () => {
      const fixture = fixturePath(`fixtures/${path}`);
      const output = fixturePath(`outputs/${path}`);

      const rpmDb = readFileSync(fixture);
      const expectedOutput = readFileSync(output, 'utf-8');

      const parserOutput = await getPackages(rpmDb);

      expect(parserOutput.error).toBeUndefined();
      expect(parserOutput.rpmMetadata).toBeDefined();
      expect(parserOutput.rpmMetadata!.packagesSkipped).toEqual(0);

      const expectedEntries = expectedOutput.trim().split('\n').sort();
      const parserEntries = parserOutput.response.trim().split('\n').sort();

      for (let j = 0; j < expectedEntries.length; j++) {
        const expectedEntry = expectedEntries[j];
        const parserEntry = parserEntries[j];
        expect(parserEntry).toEqual(expectedEntry);
      }
    });
  }
});

describe('Testing various RPM sqlite databases', async () => {
  const fixtureDir: string = fixturePath('fixtures/rpm-4.16');
  const outputDir: string = fixturePath('outputs/rpm-4.16');

  const fixturesFileNames = readdirSync(fixtureDir);

  for (const path of fixturesFileNames) {
    test(`testing ${path}`, async () => {
      const expectedOutput = readFileSync(`${outputDir}/${path}`, 'utf8');
      const packagesDbContent = (
        await getPackagesSqlite(readFileSync(`${fixtureDir}/${path}`))
      ).response;
      expect(packagesDbContent).toMatchObject(JSON.parse(expectedOutput));
    });
  }
});
