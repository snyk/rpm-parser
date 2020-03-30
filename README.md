![Snyk logo](https://snyk.io/style/asset/logo/snyk-print.svg)

***

Snyk helps you find, fix and monitor for known vulnerabilities in your dependencies, both on an ad hoc basis and as part of your CI (Build) system.

## Snyk RPM Parser

A library that reads the list of packages inside an RPM database file.

### How it works

The parser loads an RPM database file, which is in a BerkeleyDB format. The parser reads the beginning of the file to determine if this is a valid an expected BerkeleyDB.

The database is split into equally-sized pages. The database itself is of type Hash DB so the parser is interested only in pages that signify this type.

### BerkeleyDB internals

The database layout looks like this:

| Page layout: | Page number | Comment |
|---|---|---|
| Metadata page | 0 | Every page size is 4096 bytes |
| Hash page | | Says where to find the data |
| Overflow page | | Data may span multiple connected Overflow pages |
| Overflow page | | |
| Hash page | | |
| Overflow page | | |
| ... | n | The number of pages (n) is defined in the metadata page's last_pgno field |

The first page is the metadata page, which contains the database type, magic number, number of entries, etc. Subsequent pages are either Hash DB pages or Overflow pages.

- Every page has a metadata header that conveys what type of data is stored in the page.
- Hash DB pages contain an index of offsets at the start of the page. These offsets point to entries within the same page. Accessing the entries gives us key/value pairs -- the key is not relevant (it is just an internal value to BerkeleyDB) but the value tells us where to find the data. The value tells us where to start looking for data (from which page), and how big the data is.
- Overflow pages contain the actual data. The data may span multiple pages so pages are linked to each other using the `prev_pgno` and `next_pgno` fields of the page metadata.
- Data is obtained by going through all linked overflow pages and collating the raw bytes.

Refer to the [BerkeleyDB module README](https://github.com/snyk/rpm-parser/blob/master/lib/berkeleydb/README.md) for a breakdown of the page layout for every page type.

### RPM package extraction

Once all data entries are obtained, the parser processes them as RPM metadata blobs.

The blobs contain many entries that describe a single package. Every entry (e.g. name, description, release, version, etc.) has its own header and data (the actual content). Once all entries are processed, the parser can build the full view of every installed package.
