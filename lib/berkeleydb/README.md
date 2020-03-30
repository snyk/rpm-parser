# BerkeleyDB module #

Handles reading the underlying BerkeleyDB used as a backend for RPM.

## Metadata page header ##

This header appears at the start of page 0.
Bytes 0-71 contain the generic BerkeleyDB header, whereas bytes 72-511 contain the Hash DB header.

| Field | Bytes | Comment | Usage
|---|---|---|---|
| lsn | 0-7 | Log sequence number | |
| pgno | 8-11 | Current page number | |
| magic | 12-15 | Magic number | Must have the value 0x061561 for Hash DB |
| version | 16-19 | Version | |
| pagesize | 20-23 | Page size | |
| encrypt_alg | 24 | Encryption algorithm | Not used in RPM |
| type | 25 | Page type | Must have the value 0x08 for Hash DB |
| metaflags | 26 | Meta-only flags | |
| unused1 | 27 | Unused | |
| free | 28-31 | Free list page number | |
| last_pgno | 32-35 | Page number of last page in db | |
| nparts | 36-39 | Number of partitions | |
| key_count | 40-43 | Cached key count | |
| record_count | 44-47 | Cached record count | |
| flags | 48-51 | Flags: unique to each AM | |
| uid | 52-71 | Unique file ID | |
| max_bucket | 72-75 | ID of maximum bucket in use | |
| high_mask | 76-79 | Modulo mask into table | |
| low_mask | 80-83 | Modulo mask into table lower half | |
| fill_factor | 84-87 | Fill factor | |
| nelem | 88-91 | Number of keys in hash table | Useful to verify if all data could be read |
| h_charkey | 92-95 | Value of hash(CHARKEY) | |
| spares | 96-223 | Spare pages for overflow | |
| unused | 224-459 | Unused space | |
| crypto_magic | 460-463 | Crypto magic number | Not used in RPM |
| trash | 464-475 | Trash space - not in use | |
| iv | 476-495 | Crypto IV |  Not used in RPM |
| chksum | 496-511 | Page checksum | Not used in RPM |

## Page header

This header appears at the start of every page regardless of its type and is 26-bytes long. This means that for a 4096-bytes page it leaves up to 4070 bytes for content.

| Field | Bytes | Comment | Usage
|---|---|---|---|
| lsn | 0-7 | Log sequence number | |
| pgno | 8-11 | Current page number | |
| prev_pgno | 12-15 | Previous page number | Useful for traversing linked Overflow-type pages |
| next_pgno | 16-19 | Next page number | Useful for traversing linked Overflow-type pages |
| entries | 20-21 | Number of items on the page | Useful for determining the size of the page index*, if this is a Hash page |
| hf_offset | 22-23 | High free byte page offset | Useful to determine where the data ends in an Overflow page |
| level | 24 | B-Tree page level | Not used in Hash DB |
| type | 25 | Page type | 0x07 for a Hash page, 0x0D for an Overflow page |
