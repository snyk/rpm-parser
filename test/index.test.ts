import { readFileSync } from 'fs';
import { join } from 'path';

import { getPackages } from '../lib';

function fixturePath(path: string): string {
  return join(__dirname, path);
}

describe('testing various RPM databases', () => {
  const fixturePaths = [
    'Packages_centos6_dev_tools',
    'Packages_centos6_many',
    'Packages_centos6_plain',
    'Packages_centos7_dev_tools',
    'Packages_centos7_httpd24',
    'Packages_centos7_many',
    'Packages_centos7_plain',
    'Packages_centos7_python35',
  ];

  for (const path of fixturePaths) {
    // Create a test run for every fixture
    test(path, async () => {
      const fixture = fixturePath(`fixtures/${path}`);
      const output = fixturePath(`outputs/${path}`);

      const rpmDb = readFileSync(fixture);
      const expectedOutput = readFileSync(output, 'utf-8');

      const parserOutput = await getPackages(rpmDb);

      const expectedEntries = expectedOutput
        .trim()
        .split('\n')
        .sort();
      const parserEntries = parserOutput
        .trim()
        .split('\n')
        .sort();

      for (let j = 0; j < expectedEntries.length; j++) {
        const expectedEntry = expectedEntries[j];
        const parserEntry = parserEntries[j];
        expect(parserEntry).toEqual(expectedEntry);
      }
    });
  }
});
