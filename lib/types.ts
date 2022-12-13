import { PackageInfo } from './rpm/types';

export interface Response {
  response: PackageInfo[];
  rpmMetadata?: RpmMetadata;
  error?: ParserError;
}

export interface RpmMetadata {
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
