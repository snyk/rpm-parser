import { getPackageInfo } from '../../../lib/rpm/extensions';
import { IndexEntry, RpmTag, RpmType } from '../../../lib/rpm/types';

describe('getPackageInfo()', () => {
  test('happy path', async () => {
    // Notice how strings must end with a zero byte.
    const name = 'package\0';
    const release = 'rel\0';
    const version = '1.2.3\0';
    const size = [0x00, 0x00, 0x00, 0x01]; // 1 in Big Endian

    const nameEntry = {
      info: {
        tag: RpmTag.NAME,
        type: RpmType.STRING,
        count: 0,
        offset: 0,
      },
      data: Buffer.from(name),
      length: 0,
    };
    const releaseEntry = {
      info: {
        tag: RpmTag.RELEASE,
        type: RpmType.STRING,
        count: 0,
        offset: 0,
      },
      data: Buffer.from(release),
      length: 0,
    };
    const versionEntry = {
      info: {
        tag: RpmTag.VERSION,
        type: RpmType.STRING,
        count: 0,
        offset: 0,
      },
      data: Buffer.from(version),
      length: 0,
    };
    const sizeEntry = {
      info: {
        tag: RpmTag.SIZE,
        type: RpmType.INT32,
        count: 0,
        offset: 0,
      },
      data: Buffer.from(size),
      length: 0,
    };

    const packageEntries: IndexEntry[] = [
      nameEntry,
      releaseEntry,
      versionEntry,
      sizeEntry,
    ];

    await expect(getPackageInfo(packageEntries)).resolves.toEqual({
      name: 'package',
      release: 'rel',
      version: '1.2.3',
      size: 1,
    });
  });

  it('throws on unexpected type', async () => {
    const badType = RpmType.NULL;

    for (const tag of [
      RpmTag.ARCH,
      RpmTag.EPOCH,
      RpmTag.NAME,
      RpmTag.RELEASE,
      RpmTag.SIZE,
      RpmTag.VERSION,
    ]) {
      const entry = {
        info: {
          tag,
          type: badType,
          count: 0,
          offset: 0,
        },
        data: Buffer.from('irrelevant\0'),
        length: 0,
      };

      await expect(getPackageInfo([entry])).rejects.toThrow(/Unexpected type/);
    }
  });

  it('returns undefined on no matching entries', async () => {
    const nullEntry = {
      info: {
        tag: 0,
        type: RpmType.NULL,
        count: 0,
        offset: 0,
      },
      data: Buffer.alloc(0),
      length: 0,
    };
    await expect(getPackageInfo([nullEntry])).resolves.toBeUndefined();
  });

  it('returns undefined on partially matching entry', async () => {
    // Notice how strings must end with a zero byte.
    const name = 'package\0';
    const release = 'rel\0';
    const version = '1.2.3\0';
    const size = [0x00, 0x00, 0x00, 0x01]; // 1 in Big Endian

    const nameEntry = {
      info: {
        tag: RpmTag.NAME,
        type: RpmType.STRING,
        count: 0,
        offset: 0,
      },
      data: Buffer.from(name),
      length: 0,
    };
    const releaseEntry = {
      info: {
        tag: RpmTag.RELEASE,
        type: RpmType.STRING,
        count: 0,
        offset: 0,
      },
      data: Buffer.from(release),
      length: 0,
    };
    const versionEntry = {
      info: {
        tag: RpmTag.VERSION,
        type: RpmType.STRING,
        count: 0,
        offset: 0,
      },
      data: Buffer.from(version),
      length: 0,
    };
    const sizeEntry = {
      info: {
        tag: RpmTag.SIZE,
        type: RpmType.INT32,
        count: 0,
        offset: 0,
      },
      data: Buffer.from(size),
      length: 0,
    };

    await expect(getPackageInfo([nameEntry])).resolves.toBeUndefined();
    await expect(getPackageInfo([releaseEntry])).resolves.toBeUndefined();
    await expect(getPackageInfo([versionEntry])).resolves.toBeUndefined();
    await expect(getPackageInfo([sizeEntry])).resolves.toBeUndefined();

    await expect(
      getPackageInfo([nameEntry, sizeEntry]),
    ).resolves.toBeUndefined();
    await expect(
      getPackageInfo([nameEntry, sizeEntry, versionEntry]),
    ).resolves.toBeUndefined();
    await expect(
      getPackageInfo([nameEntry, sizeEntry, releaseEntry]),
    ).resolves.toBeUndefined();

    await expect(
      getPackageInfo([nameEntry, releaseEntry]),
    ).resolves.toBeUndefined();
    await expect(
      getPackageInfo([nameEntry, releaseEntry, versionEntry]),
    ).resolves.toBeUndefined();

    await expect(
      getPackageInfo([nameEntry, versionEntry]),
    ).resolves.toBeUndefined();

    await expect(
      getPackageInfo([releaseEntry, versionEntry]),
    ).resolves.toBeUndefined();
    await expect(
      getPackageInfo([releaseEntry, versionEntry, sizeEntry]),
    ).resolves.toBeUndefined();

    await expect(
      getPackageInfo([versionEntry, sizeEntry]),
    ).resolves.toBeUndefined();
  });
});
