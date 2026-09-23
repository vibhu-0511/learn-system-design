#system-design #hld #database #data-modeling

# Data Modeling for HLD — Schema Design Patterns

## Intuition (30 sec)

Your data model drives everything: which database to choose, how to query, how to scale. A bad data model means rewriting the entire system later. Spend time here.

---

## The HLD Data Modeling Process

```
1. List core entities (nouns in requirements)
2. Define relationships (1:1, 1:many, many:many)
3. Identify access patterns (how will data be queried?)
4. Choose database(s) based on patterns
5. Design schema for your chosen database
```

---

## Access Pattern First Design

**SQL approach:** Design the schema, figure out queries later.
**NoSQL approach:** Design the queries, figure out schema later.

**For HLD, always start with access patterns:**

| Access Pattern | Implication |
|---------------|-------------|
| "Get user by ID" | Key-value lookup → any DB works |
| "Get all orders for user, sorted by date" | Index on (user_id, created_at) |
| "Search products by text + filters" | Elasticsearch needed |
| "Get friends of friends" | Graph database or recursive query |
| "Count events in last 5 minutes" | Time-series or Redis counter |
| "Get user's feed (posts from followed users)" | Denormalized feed table or fan-out |

---

## Common Schema Patterns

### 1. Normalized (SQL Default)

```sql
Users: id, name, email
Orders: id, user_id (FK), total, status, created_at
OrderItems: id, order_id (FK), product_id (FK), quantity, price
Products: id, name, price, category_id
```

**Pro:** No data duplication, strong consistency.
**Con:** JOINs required, slower reads at scale.
**Use for:** User data, orders, payments — anything needing ACID.

### 2. Denormalized (Read-Optimized)

```sql
OrderView: order_id, user_name, user_email, product_name, quantity, price, total
-- All data in one table, no JOINs needed
```

**Pro:** Fast reads, no JOINs.
**Con:** Data duplication, harder writes.
**Use for:** Dashboards, reports, read-heavy views. See [[03_design_patterns/cqrs]].

### 3. Document Model (MongoDB)

```json
{
  "order_id": "ord_123",
  "user": { "id": "u_456", "name": "Rahul", "email": "rahul@example.com" },
  "items": [
    { "product": "iPhone 15", "qty": 1, "price": 79999 },
    { "product": "Case", "qty": 1, "price": 999 }
  ],
  "total": 80998,
  "status": "delivered"
}
```

**Pro:** All order data in one document, one read fetches everything.
**Con:** Updating user name requires updating every order document.
**Use for:** Self-contained entities read together.

### 4. Wide-Column (Cassandra)

```
Partition Key: user_id
Clustering Key: created_at DESC

user_123 | 2024-01-15 | { order_id: "ord_1", total: 5000, status: "delivered" }
user_123 | 2024-01-10 | { order_id: "ord_2", total: 3000, status: "shipped" }
```

**Pro:** Writes are blazing fast, reads by partition key are fast.
**Con:** Can't query across partitions efficiently.
**Use for:** Time-series data, activity feeds, messaging.

---

## Database Selection Decision Tree

```
"What are your access patterns?"
│
├── Complex queries + JOINs + ACID needed → PostgreSQL
├── Flexible schema + document lookups → MongoDB
├── Massive writes + time-series → Cassandra
├── Key-value + sub-ms latency → Redis
├── Full-text search + filters → Elasticsearch
├── Graph traversals (friends-of-friends) → Neo4j
└── Multiple patterns → Polyglot persistence (use multiple DBs)
```

---

## In Interviews

When defining your data model:
1. List 3-4 core entities
2. Show one relationship diagram
3. State key access patterns
4. Justify your DB choice based on those patterns

> "Our main entities are Users, Orders, and Products. The key access patterns are: get orders by user (sorted by date) and search products by text. I'd use PostgreSQL for Users and Orders since we need ACID for the payment flow, and Elasticsearch for product search since we need full-text search with filters."

## Links
- [[../06_trade_offs/sql_vs_nosql]] — Database decision framework
- [[../02_building_blocks/databases_sql]] — SQL deep dive
- [[../02_building_blocks/databases_nosql]] — NoSQL types
- [[../03_design_patterns/cqrs]] — Separate read/write models
