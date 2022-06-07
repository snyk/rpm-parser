import { PackageInfo } from './rpm/types';

export interface IParserBerkeleyResponse {
  response: string;
  rpmMetadata?: IRpmMetadata;
  error?: ParserError;
}
export interface IParserSqliteResponse {
  response: PackageInfo[];
  rpmMetadata?: IRpmMetadata;
  error?: ParserError;
}
export interface IRpmMetadata {
  packagesProcessed: number;
  packagesSkipped: number;
}

export class ParserError extends Error {
  readonly context: unknown | undefined;

  constructor(message: string, context?: unknown) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
    this.context = context;
  }
}
