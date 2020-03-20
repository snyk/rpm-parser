export const ENTRY_INFO_SIZE = 16;

export interface EntryInfo {
  tag: number; // Int32, Tag identifier.
  type: number; // Uint32, Tag data type.
  offset: number; // Int32, Offset into data segment (ondisk only).
  count: number; // Uint32, Number of tag elements.
}

export interface IndexEntry {
  info: EntryInfo; // Description of tag data.
  length: number; // Int32, No. bytes of data.
  data: Buffer;
}

export interface PackageInfo {
  epoch?: number;
  name: string;
  version: string;
  release: string;
  arch: string;
  size: number;
}

export enum RpmTag {
  NAME = 1000,
  VERSION = 1001,
  RELEASE = 1002,
  EPOCH = 1003,
  ARCH = 1022,
  SIZE = 1009,
}

export enum RpmType {
  NULL = 0,
  CHAR = 1,
  INT8 = 2,
  INT16 = 3,
  INT32 = 4,
  INT64 = 5,
  STRING = 6,
  BIN = 7,
  STRING_ARRAY = 8,
  I18NSTRING = 9,
}
