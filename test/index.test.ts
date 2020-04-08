import { readFileSync } from 'fs';
import { join } from 'path';

import { getPackages } from '../lib';

function fixturePath(path: string): string {
  return join(__dirname, path);
}

describe('Testing various RPM databases', () => {
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
      const rpmDb = readFileSync(fixture);

      const parserOutput = await getPackages(rpmDb);

      expect(parserOutput.error).toBeUndefined();
      expect(parserOutput.rpmMetadata).toBeDefined();
      expect(parserOutput.rpmMetadata!.packagesSkipped).toEqual(0);

      const parserEntries = parserOutput.dependencies;
      expect(parserEntries).toMatchSnapshot(path);
    });
  }
});
