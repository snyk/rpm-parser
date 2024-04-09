import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

import {
  getPackages,
  getPackagesSqlite,
  formatRpmPackageVersion,
} from '../lib';
import { PackageInfo } from '../lib/rpm/types';

function fixturePath(path: string): string {
  return join(__dirname, path);
}

describe('Testing various RPM Berkeley databases', () => {
  const fixtures: [string, boolean][] = [
    ['amazonlinux2_plain', false],
    ['centos6_dev_tools', false],
    ['centos6_many', false],
    ['centos6_plain', false],
    ['centos7_dev_tools', false],
    ['centos7_httpd24', false],
    ['centos7_many', false],
    ['centos7_plain', false],
    ['centos7_python35', false],
    ['fedora26_many', false],
    ['rpm4_empty', false],
    ['ubi7_plain', false],
    ['ubi8_plain', false],
    ['modules', true],
  ];

  for (const [path, withModules] of fixtures) {
    // Create a test run for every fixture
    test(path, async () => {
      const fixture = fixturePath(`fixtures/${path}`);
      const output = fixturePath(`outputs/${path}`);

      const rpmDb = readFileSync(fixture);
      const expectedOutput = readFileSync(output, 'utf-8');

      const parserOutput = await getPackages(rpmDb);

      if (!expectedOutput) {
        expect(parserOutput.response).toEqual([]);
        return;
      }

      expect(parserOutput.error).toBeUndefined();
      expect(parserOutput.rpmMetadata).toBeDefined();
      expect(parserOutput.rpmMetadata!.packagesSkipped).toEqual(0);

      const expectedEntries = expectedOutput.trim().split('\n').sort();
      const parserEntries = formatRpmPackages(
        parserOutput.response,
        withModules,
      ).sort();

      for (let j = 0; j < expectedEntries.length; j++) {
        const expectedEntry = expectedEntries[j];
        const parserEntry = parserEntries[j];
        expect(parserEntry).toEqual(expectedEntry);
      }
    });
  }
});

describe('Testing various RPM sqlite databases', () => {
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

function formatRpmPackages(
  packages: PackageInfo[],
  enableModules = false,
): string[] {
  return packages.map((packageInfo) => {
    let prefix = '';
    if (enableModules) {
      prefix = (packageInfo.module ? packageInfo.module : '(none)') + '\t';
    }
    return `${prefix}${packageInfo.name}\t${formatRpmPackageVersion(
      packageInfo,
    )}\t${packageInfo.size}`;
  });
}
