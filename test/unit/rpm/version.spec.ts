import { formatRpmPackageVersion } from '../../../lib';
import { PackageInfo } from '../../../lib/rpm/types';

describe('version parsing', () => {
  it('parses version with epoch undefined', () => {
    const rpmPackage: PackageInfo = {
      name: 'pkg',
      version: '1.2.3',
      epoch: undefined,
      release: '1',
      size: 1,
    };

    expect(formatRpmPackageVersion(rpmPackage)).toBe('1.2.3-1');
  });

  it('parses version with epoch 0', () => {
    const rpmPackage: PackageInfo = {
      name: 'pkg',
      version: '1.2.3',
      epoch: 0,
      release: '1',
      size: 1,
    };

    expect(formatRpmPackageVersion(rpmPackage)).toBe('1.2.3-1');
  });

  it('parses version with epoch and release', () => {
    const rpmPackage: PackageInfo = {
      name: 'pkg',
      version: '1.2.3',
      epoch: 1,
      release: '1',
      size: 1,
    };

    expect(formatRpmPackageVersion(rpmPackage)).toBe('1:1.2.3-1');
  });
});
