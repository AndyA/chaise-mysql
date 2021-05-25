# chaise-mysql

Live sync from CouchDB to MySQL.

## Design

Every MySQL table has an \_id column which should have a non-unique index. May also form part of the primary key.

Each view provides rows for a single table. That makes referential integrity hard because we can't guarantee insertion order.

## Questions

- how do new views catch up?
- how do we catch up with an existing db?
