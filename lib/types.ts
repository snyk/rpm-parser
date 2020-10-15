import { PackageInfo } from './rpm/types';

export interface RpmParserResponse {
  /**
   * Returns all packages detected in an RPM database file.
   * Currently this is a flat list of dependencies and not a dependency graph.
   */
  packages: PackageInfo[];

  /**
   * Returns the list of packages, each stored in a new line. Packages include the following attributes:
   * name, version, epoch, size, architecture, and release. The attributes are delimited by a tab.
   * @deprecated Use "packages" instead, which makes it easier to parse entries.
   */
  response: string;

  /**
   * Contains a count of the entries that could not be processed as RPM packages.
   * In all circumstances this should be 0. However, if it does contain skipped packages
   * then it may indicate:
   * 1. A corrupt or bad RPM package/entry, or
   * 2. A limitation of the parser - possible reasons could be a new RPM version or a bug in the parsing logic.
   */
  packagesSkipped: number;
}

/**
 * Thrown on any encountered exception by the parser.
 * Includes a "context" object to pass extra information about the error.
 */
export class RpmParserError extends Error {
  readonly context: unknown | undefined;

  constructor(message: string, context?: unknown) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
    this.context = context;
  }
}
