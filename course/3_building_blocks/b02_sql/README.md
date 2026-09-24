# b02: SQL Databases — An index turns a scan into a handful of page reads, and you pay for it on every write

Building blocks · b01 → **b02** → b03

> *"Index for the questions you ask, and only those"*
>
> **Concern**: latency · consistency

## The Problem

You store user data in JSON files. It works for 100 users. At 10,000, finding "all orders from last month for users in California" means scanning every file, and it takes 30 seconds. Two users sign up with the same email and nothing stops them. You have built a slow, unchecked database by hand.

In a SQL table with a million rows and no index, one lookup reads every row and takes about a second, and it grows with the table.

## The Idea

A SQL database is a spreadsheet with strict rules and superpowers. Every row in the Users sheet must have a name and an email. Sheets link together (Users to Orders to Products), and the database enforces the rules and keeps concurrent changes from corrupting each other (the ACID guarantees from f07).

The single most important performance tool is the **index**: a side structure, usually a B-tree, that lets the database find a row without reading the table. The book analogy is exact: an index at the back of a book takes you to page 214 instead of making you read every page.

## How It Works

1. **Tables, keys and joins.** A primary key identifies a row and a foreign key points at another table's row. Normalizing avoids duplicating data, and denormalizing on purpose trades that for faster reads.
2. **A B-tree is shallow and wide.** With about 100 keys per page, three levels cover a million rows, so a lookup reads 3 pages however big the table gets:

```js
// sim.mjs
const pagesFor = (rows) => Math.max(1, Math.ceil(Math.log(rows) / Math.log(FANOUT)));
```

3. **The query optimizer chooses the plan.** It decides whether to use an index or scan, based on statistics about the data.
4. **A connection pool reuses connections** instead of opening one per request, which would waste time and exhaust the database.

With an index the million-row lookup takes 0.3 ms instead of 1,000 ms.

## When It Breaks

The index only helps queries that can use it. A leading wildcard (`LIKE '%smith'`) or a function on the column (`WHERE lower(email) = ...`) cannot use a normal B-tree, so the database scans all million rows again: back to 1,000 ms. The fix is to write the query so it matches the index, or to build an index that fits it. Treating search as a SQL scan is a common trap, and it is the mistake behind the bug hunt linked in the Practice tab.

## The Trade-off

An index is not free. Every write must update every index on the table:

```js
// sim.mjs
    writeMs: round2(BASE_WRITE_MS + INDEX_WRITE_MS * indexes),
    indexes,
    storageFactor: round2(1 + INDEX_STORAGE * indexes),
```

With 8 indexes reads stay at 0.3 ms, but each write takes 1.4 ms instead of 0.35 ms and the table takes 3.4 times the space. Index the columns your queries filter and sort on, check the plan with `EXPLAIN`, and drop indexes nobody uses.

## In The Wild

PostgreSQL and MySQL are the workhorses. A typical growth path is indexes, then a connection pool, then read replicas for read scale, then sharding for write scale (e02). Operating a database is its own risk: the Slack 2024 replay in the Practice tab is a case of maintenance work under load.

## Try It

```sh
node course/3_building_blocks/b02_sql/sim.mjs --rows=10000000
```

You should see four frames. With ten million rows the scan takes `queryMs=10000` and the indexed lookup `queryMs=0.4` (4 page reads), so the scan grows a hundredfold while the index barely moves. Try `--indexes=12` to see the write cost of over-indexing.

## Say It In The Interview

1. Explain the index: a B-tree makes lookups logarithmic, and it speeds reads and slows writes.
2. Name the query that ignores it: a leading wildcard or a function on the column.
3. Mention normalization versus denormalization, and connection pooling.
4. Give the scaling path: indexes, pooling, replicas, then sharding.

## Boundary

This chapter covers tables, indexes and their cost. Replication is p02, sharding is p03, and the deeper index chapter is p01.

## What's Next

A SQL table needs a fixed schema and one machine's limits. When the data does not fit that mold, what do you use? That is b03, NoSQL.

## Source notes

- [SQL databases](../../../vault/system_design/02_building_blocks/databases_sql.md)
