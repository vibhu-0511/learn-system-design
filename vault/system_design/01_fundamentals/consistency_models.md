#system-design #fundamentals #distributed-systems #consistency

# Consistency Models

## Intuition (30 sec)

You update your profile picture. **Strong consistency:** everyone immediately sees the new pic. **Eventual consistency:** your friend in Australia might see the old pic for a few seconds, but eventually it updates. **Causal consistency:** anyone who saw you change it sees the new one, but others might still see the old one.

## Failure-First Scenario

> Your e-commerce site shows "5 items in stock." Two users buy the last item simultaneously. With eventual consistency, both succeed — you've oversold. With strong consistency, only one succeeds but both see accurate counts. Your consistency model determines whether you lose money.

## Working Knowledge (5 min)

### The Consistency Spectrum

```
Strongest ←——————————————————————————————————→ Weakest

Linearizable → Sequential → Causal → Read-your-writes → Monotonic → Eventual
```

| Model | Guarantee | Trade-off |
|-------|-----------|-----------|
| **Linearizable** | Reads always return the latest write. Behaves like single copy. | Slowest. Requires coordination. |
| **Sequential** | All operations appear in some global order (not necessarily real-time) | Slightly faster than linearizable |
| **Causal** | If operation A caused operation B, everyone sees A before B | Good balance of consistency and performance |
| **Read-your-writes** | You always see your own writes immediately | Others might see stale data |
| **Monotonic reads** | You never see data go "backwards" in time | Might be stale but never older than what you already saw |
| **Eventual** | Given enough time (usually ms), all replicas converge | Fastest. No coordination needed. |

### When to Use What

| Use Case | Model | Why |
|----------|-------|-----|
| Bank balance | Linearizable | Can't show wrong balance |
| Inventory count | Linearizable or Sequential | Prevent overselling |
| Social media post | Eventual | Minor delay is fine |
| User's own profile edits | Read-your-writes | User should see their changes |
| News feed | Eventual / Causal | Order of related posts matters, timing doesn't |
| DNS | Eventual | TTL-based propagation is acceptable |
| Chat messages | Causal | Reply should appear after the message it replies to |

## Deep Dive (30 min)

### 1. Linearizability (Strongest Consistency)

**Definition:** Once a write completes, all subsequent reads (from any client) return that value or a newer one. Operations appear to happen at a single point in time between invocation and response.

**Visual Timeline:**

```
Time →
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Client A:  |─── Write(x=1) ───|✓
                                ├─ Linearization Point
Client B:                       |  |─── Read(x) → 1 ───|
Client C:                       |         |─── Read(x) → 1 ───|

All reads after the write completes see the new value.
```

**Key Properties:**
- Total order of all operations
- Real-time ordering constraint: if operation A completes before operation B begins, A appears before B
- Behaves as if there's a single copy of the data

**How to Achieve:**
- Single leader with synchronous replication
- Consensus algorithms (Raft, Paxos)
- Distributed locks with fencing tokens

**Cost:**
- Every write must wait for acknowledgment from majority of nodes
- High latency during network issues (100-200ms+)
- Reduced availability during partitions

**Production Examples:**
- Google Spanner (TrueTime API for global linearizability)
- CockroachDB (serializable isolation)
- etcd, ZooKeeper (coordination services)
- Banking transactions, inventory management

---

### 2. Sequential Consistency

**Definition:** All operations appear to execute in some sequential order, and operations of each process appear in that sequence in the same order they were issued. Unlike linearizability, doesn't respect real-time ordering.

**Visual Timeline:**

```
Time →
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Client A:  |─── Write(x=1) ───|✓
Client B:  |─── Write(x=2) ───|✓
                                  |─── Read(x) → 2 ───| (OK)
Client C:                         |─── Read(x) → 1 ───| (Also OK!)

Both can see different orders, as long as each client sees a consistent order.
Within each client, operations maintain program order.
```

**Difference from Linearizability:**
- Sequential: Operations have a total order, but not necessarily real-time
- Linearizable: Operations have a total order AND respect wall-clock time

**Use Cases:**
- Multi-threaded programs
- Distributed caches where exact timing doesn't matter
- Event sourcing systems

---

### 3. Causal Consistency

**Definition:** If operation A causally affects operation B, then all processes observe A before B. Concurrent operations (no causal relationship) can be seen in different orders by different processes.

**Visual Timeline:**

```
Time →
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Alice:    |─ Post("Going to lunch") ─|✓
                    ↓ causes
Bob:                |─ Reply("Save me a seat!") ─|✓

Charlie:            |───────────────────────────────|
         Sees: Post → Reply ✓ (correct causal order)

Dave:               |───────────────────────────────|
         Cannot see: Reply → Post ✗ (violates causality)

Concurrent posts can appear in any order.
```

**How Causality is Tracked:**
- Vector clocks: Each node maintains a vector of counters
- Version vectors: Track causal relationships between versions
- Logical timestamps (Lamport clocks)

**Implementation Example:**

```
Event         Vector Clock
─────────────────────────────
A: Write(x=1)  [A:1, B:0, C:0]
B: Read(x=1)   [A:1, B:1, C:0]  ← Causally depends on A
C: Write(y=2)  [A:0, B:0, C:1]  ← Concurrent with A and B
B: Write(x=3)  [A:1, B:2, C:0]  ← Causally depends on B's previous read
```

**Use Cases:**
- Chat applications (replies must follow messages)
- Collaborative editing (Google Docs)
- Social media feeds (comments follow posts)
- Distributed databases with session guarantees

---

### 4. Read-Your-Writes Consistency

**Definition:** After you write a value, all your subsequent reads will see that value or a newer one. No guarantees for other users' reads.

**Visual Timeline:**

```
Time →
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Alice:    |─ Write(profile="new pic") ─|✓
          |                              |─ Read(profile) → "new pic" ✓

Bob:      |                              |─ Read(profile) → "old pic" ✓ (OK)
          |                                                  |─ Read(profile) → "new pic" ✓

Alice always sees her own writes.
Bob might see stale data, but eventually sees updates.
```

**Implementation Techniques:**
1. **Sticky sessions:** Route user's requests to the same replica
2. **Read from leader:** Direct user's reads to the write master
3. **Client-side tracking:** Include timestamp/version with reads

**Configuration Example (AWS DynamoDB):**

```python
# Write with consistent read
dynamodb.put_item(
    TableName='Users',
    Item={'userId': '123', 'profile': 'new pic'}
)

# Read your own write - strongly consistent read
response = dynamodb.get_item(
    TableName='Users',
    Key={'userId': '123'},
    ConsistentRead=True  # Read-your-writes guarantee
)
```

**Use Cases:**
- User profile updates
- Shopping cart modifications
- User settings/preferences
- Any user-specific data

---

### 5. Monotonic Reads Consistency

**Definition:** If a process reads a value v1, any subsequent read will return v1 or a newer value, never an older value. Time never goes backward for a single observer.

**Visual Timeline:**

```
Time →
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Replicas:  R1[v=5] ← ← ← ← ← R2[v=3] (replication lag)

User:      |─ Read → R1 → v=5 ─|
           |                     |─ Read → R2 → v=3 ✗ VIOLATION!
           |                     |─ Read → R2 → v=5 ✓ OK

Without monotonic reads: User sees data "going backwards"
With monotonic reads: Always route to replica with at least version 5
```

**The Problem Without Monotonic Reads:**

```
User refreshes a page twice:
  Request 1 → Load balancer → Replica A (up to date)    → Shows 10 items
  Request 2 → Load balancer → Replica B (lagging)       → Shows 8 items

User sees items "disappear" and reappear - confusing!
```

**Implementation:**
- Track the version/timestamp of last read
- Only read from replicas that have at least that version
- Use session tokens to maintain replica affinity

**Use Cases:**
- Feed pagination (don't lose items between pages)
- Monitoring dashboards (metrics shouldn't go backward)
- Any UI that refreshes/polls

---

### 6. Eventual Consistency (Weakest)

**Definition:** If no new writes arrive, all replicas eventually return the same value. No guarantee on how long "eventually" takes (typically milliseconds to seconds).

**Visual Timeline:**

```
Time →
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           Write       Replication Lag      Converged
           ↓           ↓                    ↓
Node 1:  [v=old] → [v=new] ──────────────────────┐
                                                  ↓
Node 2:  [v=old] ─────────────── [v=new] ────────┤ All
                                                  ├ Agree
Node 3:  [v=old] ─────────────────────── [v=new]─┘ v=new

Client A:  |─ Write(x=5) ─|✓
Client B:           |─ Read(x) → 3 (stale) ─|
Client C:                  |─ Read(x) → 5 (current) ─|
Client B:                              |─ Read(x) → 5 (caught up) ─|
```

**Conflict Resolution Strategies:**

1. **Last-Write-Wins (LWW):**
   ```
   Node 1: Write(x=5, timestamp=t1)
   Node 2: Write(x=7, timestamp=t2)

   If t2 > t1: final value = 7
   ```
   - Simple, but can lose concurrent writes
   - Used by Cassandra, DynamoDB

2. **Vector Clocks:**
   ```
   V1 = [N1:1, N2:0, N3:0]  → Write(x=5)
   V2 = [N1:1, N2:1, N3:0]  → Write(x=7)

   V1 and V2 are concurrent (conflict!)
   → Application must resolve
   ```
   - Detects conflicts, doesn't auto-resolve
   - Used by Riak, Voldemort

3. **CRDTs (Conflict-Free Replicated Data Types):**
   ```
   G-Counter (Grow-only counter):
   Node 1: increment → [N1:5, N2:0, N3:0]
   Node 2: increment → [N1:0, N2:3, N3:0]

   Merge: [N1:5, N2:3, N3:0] → Total = 8
   ```
   - Automatically mergeable
   - Types: counters, sets, maps, registers

**Use Cases:**
- DNS propagation
- CDN content distribution
- Social media feeds
- View counts, likes
- Shopping recommendations

---

## Quorum-Based Consistency

Quorums allow you to configure consistency on a per-operation basis.

### The Formula

```
N = Total number of replicas
W = Write acknowledgments required (write quorum)
R = Read replicas queried (read quorum)

If W + R > N  →  Strong consistency (read/write sets overlap)
If W + R ≤ N  →  Eventual consistency (sets may not overlap)
```

### Visual Explanation

**Strong Consistency (W=2, R=2, N=3):**

```
       Replicas: [1] [2] [3]
                  ↓   ↓
Write:           [✓] [✓] [x]  ← W=2 acknowledges
                      ↓   ↓
Read:             [x] [✓] [✓]  ← R=2 queries

Overlap: [2] is in both sets → Must see the write!
W + R = 2 + 2 = 4 > 3 (N) → Guaranteed overlap
```

**Eventual Consistency (W=1, R=1, N=3):**

```
       Replicas: [1] [2] [3]
                  ↓
Write:           [✓] [x] [x]  ← W=1 acknowledges
                      ↓
Read:             [x] [✓] [x]  ← R=1 queries

No overlap! Read may miss the write.
W + R = 1 + 1 = 2 ≤ 3 (N) → No guarantee
```

### Common Configurations

| Config | W | R | N | Consistency | Use Case |
|--------|---|---|---|-------------|----------|
| **Balanced** | 2 | 2 | 3 | Strong | General purpose |
| **Fast Read** | 3 | 1 | 3 | Strong | Read-heavy workloads |
| **Fast Write** | 1 | 3 | 3 | Strong | Write-heavy workloads |
| **Maximum Performance** | 1 | 1 | 3 | Eventual | Analytics, logs |
| **Paranoid** | 3 | 3 | 3 | Strong | Financial data |
| **Multi-DC** | 4 | 4 | 6 | Strong | Global consistency |

### Quorum Calculations Examples

**Example 1: N=5, W=3, R=3**
```
W + R = 3 + 3 = 6 > 5 (N)
✓ Strong consistency
✓ Survives 2 node failures
✓ Balanced read/write performance
```

**Example 2: N=5, W=1, R=5**
```
W + R = 1 + 5 = 6 > 5 (N)
✓ Strong consistency
✓ Very fast writes (only 1 ack)
✗ Slow reads (query all 5)
Use case: Write-heavy logs with occasional consistent reads
```

**Example 3: N=5, W=5, R=1**
```
W + R = 5 + 1 = 6 > 5 (N)
✓ Strong consistency
✗ Slow writes (all 5 must ack)
✓ Very fast reads (query only 1)
Use case: Read-heavy caches with rare updates
```

**Example 4: N=7, W=4, R=3**
```
W + R = 4 + 3 = 7 = 7 (N)
? Edge case! Sets might just touch
✓ Strong consistency (W+R ≥ N works)
✓ Survives 3 node failures
```

---

## Database-Specific Configurations

### Cassandra Configuration

```cql
-- Table-level default
CREATE TABLE users (
    user_id UUID PRIMARY KEY,
    email TEXT,
    balance DECIMAL
) WITH read_repair_chance = 0.1;

-- Query-level tuning
-- Eventual consistency (fast)
SELECT * FROM users WHERE user_id = ?
USING CONSISTENCY ONE;

-- Strong consistency
SELECT * FROM users WHERE user_id = ?
USING CONSISTENCY QUORUM;  -- Equivalent to R = (N/2 + 1)

-- Write with strong consistency
INSERT INTO users (user_id, balance) VALUES (?, ?)
USING CONSISTENCY ALL;  -- All replicas must acknowledge

-- Multi-datacenter consistency
SELECT * FROM users WHERE user_id = ?
USING CONSISTENCY LOCAL_QUORUM;  -- Quorum within local DC only
```

**Cassandra Consistency Levels:**

| Level | Meaning | W/R Equivalent |
|-------|---------|----------------|
| ONE | 1 replica | W=1 or R=1 |
| TWO | 2 replicas | W=2 or R=2 |
| THREE | 3 replicas | W=3 or R=3 |
| QUORUM | Majority (N/2 + 1) | W or R = ceiling(N/2 + 1) |
| ALL | All replicas | W=N or R=N |
| LOCAL_QUORUM | Quorum in local DC | W or R = ceiling(local_N/2 + 1) |
| EACH_QUORUM | Quorum in each DC | W = ceiling(N_dc1/2 + 1) + ceiling(N_dc2/2 + 1) |

**Production Example:**

```java
// E-commerce application
public class OrderService {

    // Critical: inventory checks must be consistent
    public boolean checkInventory(String productId) {
        return session.execute(
            "SELECT quantity FROM inventory WHERE product_id = ?",
            ConsistencyLevel.QUORUM,  // Strong consistency
            productId
        ).one().getInt("quantity") > 0;
    }

    // Non-critical: product descriptions can be eventually consistent
    public Product getProductDetails(String productId) {
        return session.execute(
            "SELECT * FROM products WHERE product_id = ?",
            ConsistencyLevel.ONE,  // Eventual consistency (fast)
            productId
        ).map(this::toProduct);
    }
}
```

---

### DynamoDB Configuration

```python
import boto3
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('Users')

# Eventual consistency (default, 50% of cost)
response = table.get_item(
    Key={'userId': '123'},
    ConsistentRead=False  # Eventually consistent (default)
)

# Strong consistency (2x cost of eventual)
response = table.get_item(
    Key={'userId': '123'},
    ConsistentRead=True  # Strongly consistent
)

# Write (always strongly consistent within a region)
table.put_item(
    Item={
        'userId': '123',
        'balance': 100.00,
        'updated_at': '2026-02-14T10:00:00Z'
    }
)

# Batch operations with consistency
response = dynamodb.batch_get_item(
    RequestItems={
        'Users': {
            'Keys': [
                {'userId': '123'},
                {'userId': '456'}
            ],
            'ConsistentRead': True  # Strongly consistent batch read
        }
    }
)

# Transactions (ACID guarantees, always strongly consistent)
dynamodb.transact_write_items(
    TransactItems=[
        {
            'Update': {
                'TableName': 'Users',
                'Key': {'userId': '123'},
                'UpdateExpression': 'SET balance = balance - :amount',
                'ExpressionAttributeValues': {':amount': 50}
            }
        },
        {
            'Update': {
                'TableName': 'Orders',
                'Key': {'orderId': '789'},
                'UpdateExpression': 'SET status = :status',
                'ExpressionAttributeValues': {':status': 'confirmed'}
            }
        }
    ]
)
```

**DynamoDB Consistency Models:**

| Operation | Consistency | Cost | Latency |
|-----------|-------------|------|---------|
| GetItem (eventual) | Eventual | 0.5 RCU | ~5ms |
| GetItem (consistent) | Strong | 1 RCU | ~10ms |
| PutItem | Strong (regional) | 1 WCU | ~10ms |
| Query (eventual) | Eventual | 0.5 RCU/item | ~5ms |
| Query (consistent) | Strong | 1 RCU/item | ~10ms |
| TransactWriteItems | Strong | 2 WCU/item | ~20ms |
| Global Tables | Eventual | Standard + replication | Seconds |

**Production Example:**

```python
class UserService:
    def update_profile(self, user_id, profile_data):
        """User profile updates - read-your-writes consistency"""
        table.put_item(Item={'userId': user_id, **profile_data})

        # Immediately read back with strong consistency
        return table.get_item(
            Key={'userId': user_id},
            ConsistentRead=True  # User sees their own write
        )['Item']

    def get_user_for_display(self, user_id, viewer_id):
        """Profile viewed by others - eventual consistency OK"""
        if user_id == viewer_id:
            # Own profile - need strong consistency
            consistent_read = True
        else:
            # Others' profiles - eventual consistency (cheaper)
            consistent_read = False

        return table.get_item(
            Key={'userId': user_id},
            ConsistentRead=consistent_read
        )['Item']
```

---

### MongoDB Configuration

```javascript
// Read concern levels
db.users.find({userId: "123"})
  .readConcern("local")  // Eventual: return local data immediately

db.users.find({userId: "123"})
  .readConcern("majority")  // Strong: data acknowledged by majority

db.users.find({userId: "123"})
  .readConcern("linearizable")  // Strongest: guaranteed linearizability

// Write concern levels
db.users.insertOne(
  {userId: "123", balance: 100},
  {writeConcern: {w: 1}}  // Eventual: 1 node acknowledgment
)

db.users.insertOne(
  {userId: "123", balance: 100},
  {writeConcern: {w: "majority"}}  // Strong: majority acknowledgment
)

db.users.insertOne(
  {userId: "123", balance: 100},
  {writeConcern: {w: "majority", j: true}}  // Strong + durable (journaled)
)

// Session with causal consistency
const session = client.startSession({causalConsistency: true});

session.withTransaction(async () => {
  // This read sees all writes from earlier in the session
  const user = await users.findOne({userId: "123"}, {session});

  // This write is causally ordered after the read
  await orders.insertOne({
    userId: "123",
    amount: user.balance
  }, {session});
});

// Replica set configuration
rs.initiate({
  _id: "rs0",
  members: [
    {_id: 0, host: "mongo1:27017", priority: 2},
    {_id: 1, host: "mongo2:27017", priority: 1},
    {_id: 2, host: "mongo3:27017", priority: 1}
  ]
})

// Read preference (which replicas to query)
db.users.find({}).readPref("primary")  // Strong: read from primary only
db.users.find({}).readPref("primaryPreferred")  // Primary if available
db.users.find({}).readPref("secondary")  // Eventual: read from secondaries
db.users.find({}).readPref("nearest")  // Lowest latency (eventual)
```

**MongoDB Consistency Matrix:**

| Read Concern | Write Concern | Consistency Level | Use Case |
|--------------|---------------|-------------------|----------|
| local | 1 | Eventual | Maximum performance |
| majority | majority | Strong | General purpose |
| linearizable | majority | Linearizable | Financial transactions |
| local | majority | Read-your-writes | User profiles |
| majority | 1 | Mixed | Read-heavy analytics |

**Production Example:**

```javascript
// E-commerce order system
class OrderService {

  // Critical: inventory deduction must be linearizable
  async deductInventory(productId, quantity) {
    const session = client.startSession();

    try {
      await session.withTransaction(async () => {
        const product = await db.products.findOne(
          {productId},
          {
            session,
            readConcern: {level: "linearizable"}  // Strongest
          }
        );

        if (product.quantity < quantity) {
          throw new Error("Insufficient inventory");
        }

        await db.products.updateOne(
          {productId},
          {$inc: {quantity: -quantity}},
          {
            session,
            writeConcern: {w: "majority", j: true}  // Durable + strong
          }
        );
      });
    } finally {
      await session.endSession();
    }
  }

  // Non-critical: product catalog can be eventually consistent
  async getProductCatalog() {
    return db.products.find({})
      .readPref("secondary")  // Eventual, reduces primary load
      .readConcern("local")   // Fast, local data
      .toArray();
  }

  // User-facing: order history needs read-your-writes
  async getUserOrders(userId) {
    return db.orders.find({userId})
      .readConcern("majority")  // See own orders immediately
      .toArray();
  }
}
```

---

## Decision Tree: Choosing Consistency Level

```
Start: What kind of data is this?
│
├─ Money/Inventory/Votes?
│  └─ Linearizable or Sequential
│     └─ Use: Spanner, CockroachDB, or Cassandra QUORUM
│
├─ User-generated content?
│  │
│  ├─ User viewing their OWN data?
│  │  └─ Read-Your-Writes
│  │     └─ Sticky sessions OR consistent reads
│  │
│  └─ User viewing OTHERS' data?
│     └─ Eventual + Monotonic Reads
│        └─ Use: DynamoDB eventual, Cassandra ONE
│
├─ Causally related? (replies, threads, collaborative docs)
│  └─ Causal Consistency
│     └─ Use: MongoDB causal sessions, or vector clocks
│
├─ High-volume metrics/analytics?
│  └─ Eventual Consistency
│     └─ Use: DynamoDB eventual, Cassandra ONE/LOCAL_ONE
│
└─ Don't know?
   └─ Start with: W=2, R=2, N=3 (strong + available)
      └─ Measure and tune based on metrics
```

### Decision Matrix by Feature Type

| Feature Type | Recommended | Configuration Example |
|--------------|-------------|----------------------|
| **Authentication/Login** | Read-Your-Writes | DynamoDB ConsistentRead=True |
| **Authorization/Permissions** | Linearizable | MongoDB linearizable + majority |
| **Financial Transactions** | Linearizable | Spanner, or Cassandra ALL |
| **Inventory Management** | Sequential/Linearizable | Cassandra QUORUM |
| **Shopping Cart** | Read-Your-Writes | Sticky sessions + local writes |
| **Product Catalog** | Eventual | DynamoDB eventual, CDN |
| **User Profile (own)** | Read-Your-Writes | DynamoDB ConsistentRead=True |
| **User Profile (others)** | Eventual | DynamoDB eventual |
| **Social Feed** | Eventual + Monotonic | Cassandra ONE + version tracking |
| **Chat Messages** | Causal | MongoDB causal sessions |
| **Likes/Views Count** | Eventual | Cassandra ONE, CRDT counters |
| **Comments/Replies** | Causal | Vector clocks or causal sessions |
| **Search Index** | Eventual | Elasticsearch, async indexing |
| **Recommendations** | Eventual | Cassandra ONE, batch processing |
| **Audit Logs** | Sequential | Kafka (ordered) → S3 |
| **System Metrics** | Eventual | Time-series DB, eventual writes |

---

## Real Production Examples

### Example 1: E-commerce Platform (Amazon-style)

```
Product Catalog Service:
  ├─ Product Details (description, images)
  │  └─ Consistency: Eventual (DynamoDB eventual reads)
  │  └─ Why: Slight staleness OK, optimize for speed/cost
  │
  ├─ Inventory Count
  │  └─ Consistency: Linearizable (DynamoDB transactions)
  │  └─ Why: Prevent overselling
  │
  ├─ Product Reviews
  │  └─ Consistency: Eventual (Cassandra ONE)
  │  └─ Why: Reviews don't need instant propagation
  │
  └─ "Add to Cart" Button Availability
     └─ Consistency: Sequential (Cassandra QUORUM)
     └─ Why: Must reflect accurate stock, but ms lag OK

Shopping Cart Service:
  ├─ User's Own Cart
  │  └─ Consistency: Read-Your-Writes (sticky sessions)
  │  └─ Why: User must see their added items
  │
  └─ Cart Total Calculation
     └─ Consistency: Read-Your-Writes (compute from own cart)

Order Service:
  ├─ Place Order
  │  └─ Consistency: Linearizable (ACID transaction)
  │  └─ Why: Deduct inventory, charge card, create order atomically
  │
  └─ Order History
     └─ Consistency: Read-Your-Writes (DynamoDB ConsistentRead)
     └─ Why: User must see order immediately after placing
```

**Configuration:**

```python
class EcommerceService:

    def get_product_details(self, product_id):
        """Eventual consistency - optimize for speed"""
        return dynamodb.get_item(
            TableName='Products',
            Key={'productId': product_id},
            ConsistentRead=False  # Eventual, 50% cheaper
        )

    def check_inventory(self, product_id):
        """Strong consistency - prevent overselling"""
        return dynamodb.get_item(
            TableName='Inventory',
            Key={'productId': product_id},
            ConsistentRead=True  # Strong, see latest count
        )

    def place_order(self, user_id, items):
        """Linearizable - ACID transaction"""
        dynamodb.transact_write_items(
            TransactItems=[
                # Deduct inventory
                {
                    'Update': {
                        'TableName': 'Inventory',
                        'Key': {'productId': item['productId']},
                        'UpdateExpression': 'SET quantity = quantity - :qty',
                        'ConditionExpression': 'quantity >= :qty',
                        'ExpressionAttributeValues': {':qty': item['quantity']}
                    }
                }
                for item in items
            ] + [
                # Create order
                {
                    'Put': {
                        'TableName': 'Orders',
                        'Item': {
                            'orderId': generate_id(),
                            'userId': user_id,
                            'items': items,
                            'status': 'confirmed'
                        }
                    }
                }
            ]
        )
```

---

### Example 2: Social Media Platform (Twitter-style)

```
User Service:
  ├─ Profile Edit (own profile)
  │  └─ Consistency: Read-Your-Writes (DynamoDB ConsistentRead)
  │  └─ Why: User must see their changes immediately
  │
  ├─ Profile View (others' profiles)
  │  └─ Consistency: Eventual (CDN + DynamoDB eventual)
  │  └─ Why: Slight staleness OK, optimize for scale
  │
  └─ Follow/Unfollow Count
     └─ Consistency: Eventual (CRDT counter)
     └─ Why: Exact count less critical than speed

Timeline Service:
  ├─ Post Creation
  │  └─ Consistency: Causal (Cassandra + version vectors)
  │  └─ Why: Ensure causal ordering of replies
  │
  ├─ Home Feed
  │  └─ Consistency: Eventual + Monotonic (Cassandra ONE)
  │  └─ Why: Speed critical, slight delay acceptable
  │
  └─ Replies/Threads
     └─ Consistency: Causal (parent post → replies ordering)
     └─ Why: Reply must appear after original post

Engagement Service:
  ├─ Like/Unlike
  │  └─ Consistency: Eventual (async, eventually increment)
  │  └─ Why: Exact count not critical, optimize for throughput
  │
  ├─ Like Count Display
  │  └─ Consistency: Eventual (approximate count OK)
  │  └─ Why: "~1.2M likes" is acceptable
  │
  └─ "Did I Like This?" Button State
     └─ Consistency: Read-Your-Writes (cache user's own actions)
     └─ Why: User must see their own like immediately
```

**Configuration:**

```javascript
class SocialMediaService {

  async createPost(userId, content) {
    // Causal consistency: track causality with vector clock
    const vectorClock = await this.getVectorClock(userId);
    vectorClock[userId]++;

    await cassandra.execute(
      'INSERT INTO posts (post_id, user_id, content, vector_clock, created_at) VALUES (?, ?, ?, ?, ?)',
      [generateId(), userId, content, vectorClock, Date.now()],
      {consistency: cassandra.types.consistencies.quorum}  // Strong write
    );

    // Fanout to followers (async, eventual)
    await this.fanoutToFollowers(userId, postId, {async: true});
  }

  async getHomeFeed(userId, lastSeenVersion) {
    // Monotonic reads: don't show older posts than user has already seen
    return cassandra.execute(
      'SELECT * FROM timeline WHERE user_id = ? AND version > ? LIMIT 50',
      [userId, lastSeenVersion],
      {consistency: cassandra.types.consistencies.one}  // Eventual, fast
    );
  }

  async likePost(userId, postId) {
    // Eventual consistency: increment counter asynchronously
    await redis.sadd(`post:${postId}:likes`, userId);  // Track who liked
    await redis.incr(`post:${postId}:like_count`);     // Increment count

    // User sees their own like immediately (read-your-writes)
    await redis.sadd(`user:${userId}:liked_posts`, postId);
  }

  async getPostWithLikes(postId, viewerUserId) {
    const [post, likeCount, didILike] = await Promise.all([
      cassandra.execute(
        'SELECT * FROM posts WHERE post_id = ?',
        [postId],
        {consistency: cassandra.types.consistencies.one}  // Eventual
      ),
      redis.get(`post:${postId}:like_count`),  // Eventual count
      redis.sismember(`user:${viewerUserId}:liked_posts`, postId)  // Own likes
    ]);

    return {
      ...post,
      likeCount: parseInt(likeCount) || 0,
      likedByMe: didILike  // Read-your-writes guarantee
    };
  }
}
```

---

### Example 3: Banking Application

```
Account Service:
  ├─ Account Balance
  │  └─ Consistency: Linearizable (Spanner or CockroachDB)
  │  └─ Why: Must show exact balance, no stale reads
  │
  ├─ Transaction History
  │  └─ Consistency: Sequential (ordered by timestamp)
  │  └─ Why: Must maintain order, but ms delay OK
  │
  └─ Account Settings
     └─ Consistency: Read-Your-Writes (user sees own changes)

Transfer Service:
  ├─ Money Transfer
  │  └─ Consistency: Linearizable + ACID (distributed transaction)
  │  └─ Why: Atomic debit + credit, no inconsistency allowed
  │
  └─ Transfer Status
     └─ Consistency: Read-Your-Writes (user sees own transfer)

Fraud Detection Service:
  ├─ Real-time Scoring
  │  └─ Consistency: Linearizable (see all recent transactions)
  │  └─ Why: Must have complete view for fraud detection
  │
  └─ Historical Patterns
     └─ Consistency: Eventual (batch processing acceptable)
```

**Configuration:**

```java
// Using CockroachDB (PostgreSQL compatible with linearizability)
public class BankingService {

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public void transferMoney(String fromAccount, String toAccount, BigDecimal amount) {
        // Linearizable read: get current balances
        Account from = accountRepo.findByIdForUpdate(fromAccount);
        Account to = accountRepo.findByIdForUpdate(toAccount);

        if (from.getBalance().compareTo(amount) < 0) {
            throw new InsufficientFundsException();
        }

        // Atomic debit and credit
        from.setBalance(from.getBalance().subtract(amount));
        to.setBalance(to.getBalance().add(amount));

        accountRepo.save(from);
        accountRepo.save(to);

        // Audit log (can be async, eventual)
        auditService.logTransfer(fromAccount, toAccount, amount);
    }

    public BigDecimal getBalance(String accountId) {
        // Linearizable read: always show exact balance
        return accountRepo.findById(accountId)
            .map(Account::getBalance)
            .orElseThrow();
    }

    public List<Transaction> getTransactionHistory(String accountId) {
        // Sequential consistency: ordered by timestamp
        // Slight delay acceptable, but order must be correct
        return transactionRepo.findByAccountIdOrderByTimestamp(accountId);
    }
}
```

---

## Production Monitoring for Consistency Violations

### Key Metrics to Track

```yaml
Replication Lag:
  - Metric: max_replication_lag_ms
  - Alert: > 5000ms (5 seconds)
  - Why: Indicates how stale eventual reads might be
  - Tool: Prometheus, DataDog

Read-After-Write Failures:
  - Metric: read_your_writes_violations_count
  - Alert: > 0 (any violation)
  - Why: Users not seeing their own writes
  - Detection: Version tracking

Stale Read Rate:
  - Metric: stale_reads_percentage
  - Alert: > 5%
  - Why: Eventual consistency not converging
  - Detection: Version comparison

Quorum Failures:
  - Metric: quorum_timeout_count
  - Alert: > 100/hour
  - Why: Consistency level can't be achieved
  - Tool: Cassandra metrics, MongoDB logs

Conflict Rate:
  - Metric: write_conflicts_per_second
  - Alert: > 10/sec
  - Why: High concurrent writes causing conflicts
  - Resolution: Review consistency level or use CRDTs
```

### Monitoring Examples

**Cassandra Monitoring:**

```python
from prometheus_client import Gauge, Counter

# Replication lag
replication_lag = Gauge(
    'cassandra_replication_lag_ms',
    'Replication lag in milliseconds',
    ['datacenter', 'node']
)

# Quorum failures
quorum_failures = Counter(
    'cassandra_quorum_failures_total',
    'Total number of quorum timeout failures',
    ['consistency_level', 'operation']
)

# Monitor with nodetool
def monitor_cassandra():
    # Check replication lag
    result = subprocess.run(['nodetool', 'describecluster'], capture_output=True)
    # Parse and set metrics

    # Check for quorum timeouts in logs
    with open('/var/log/cassandra/system.log') as f:
        for line in f:
            if 'Operation timed out' in line:
                quorum_failures.labels(
                    consistency_level='QUORUM',
                    operation='read'
                ).inc()
```

**DynamoDB Monitoring:**

```python
import boto3

cloudwatch = boto3.client('cloudwatch')

def monitor_dynamodb_consistency():
    # Monitor strongly consistent vs eventually consistent read ratio
    metrics = cloudwatch.get_metric_statistics(
        Namespace='AWS/DynamoDB',
        MetricName='ConsumedReadCapacityUnits',
        Dimensions=[
            {'Name': 'TableName', 'Value': 'Users'}
        ],
        StartTime=datetime.utcnow() - timedelta(minutes=5),
        EndTime=datetime.utcnow(),
        Period=300,
        Statistics=['Sum']
    )

    # Alert if strongly consistent reads > 50% (cost optimization)
    strong_read_ratio = calculate_ratio(metrics)
    if strong_read_ratio > 0.5:
        alert("High strongly consistent read ratio", strong_read_ratio)
```

**Custom Read-Your-Writes Monitoring:**

```javascript
class ConsistencyMonitor {

  async trackReadYourWrites(userId, operation) {
    const writeVersion = await redis.get(`user:${userId}:last_write_version`);
    const readVersion = await redis.get(`user:${userId}:last_read_version`);

    if (readVersion && writeVersion && readVersion < writeVersion) {
      // Read-your-writes violation detected!
      metrics.increment('read_your_writes_violations', {
        userId,
        operation,
        lag: writeVersion - readVersion
      });

      logger.error('Read-your-writes violation', {
        userId,
        writeVersion,
        readVersion,
        operation
      });
    }
  }

  async trackMonotonicReads(userId, currentVersion) {
    const lastSeenVersion = await redis.get(`user:${userId}:last_seen_version`);

    if (lastSeenVersion && currentVersion < lastSeenVersion) {
      // Monotonic reads violation - seeing older data!
      metrics.increment('monotonic_reads_violations', {
        userId,
        regression: lastSeenVersion - currentVersion
      });

      logger.error('Monotonic reads violation', {
        userId,
        lastSeenVersion,
        currentVersion
      });
    }

    await redis.set(`user:${userId}:last_seen_version`, currentVersion);
  }
}
```

**Alerting Configuration (Prometheus + Alertmanager):**

```yaml
groups:
  - name: consistency_alerts
    interval: 30s
    rules:
      - alert: HighReplicationLag
        expr: max_replication_lag_ms > 5000
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High replication lag detected"
          description: "Replication lag is {{ $value }}ms on {{ $labels.node }}"

      - alert: ReadYourWritesViolation
        expr: rate(read_your_writes_violations[5m]) > 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Users not seeing their own writes"
          description: "{{ $value }} violations per second"

      - alert: QuorumFailureSpike
        expr: rate(quorum_failures_total[5m]) > 10
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High rate of quorum failures"
          description: "{{ $value }} quorum failures per second"

      - alert: StalenessIncreasing
        expr: stale_reads_percentage > 5
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High percentage of stale reads"
          description: "{{ $value }}% of reads are stale"
```

---

## The "Why" Chain

- **Why not always use strong consistency?** → Performance. Linearizable reads on a globally distributed DB might take 200ms. Eventual reads might take 5ms. Cost: strongly consistent reads in DynamoDB are 2x the price.

- **What's the alternative?** → You must pick a point on the spectrum. No system avoids this. Mix consistency levels within the same application based on feature requirements.

- **What breaks with wrong choice?**
  - Too strong = slow, can't scale, lower availability during partitions
  - Too weak = data bugs, lost writes, confused users, potential revenue loss

- **Why can't a system be "always consistent"?** → CAP theorem: during network partitions, you must choose between consistency and availability. You can't have both.

- **How do I know which level to choose?** → Ask: "What happens if this data is stale for 100ms?" If the answer is "nothing bad," use eventual. If it's "we lose money," use linearizable.

---

## Key Trade-offs

- [[06_trade_offs/consistency_vs_availability]] — Stronger consistency = lower availability
- [[06_trade_offs/latency_vs_throughput]] — Stronger consistency = higher latency
- [[cap_theorem]] — The theoretical foundation (pick 2 of 3: Consistency, Availability, Partition tolerance)
- [[06_trade_offs/cost_vs_performance]] — Strong consistency costs more (compute, network, $$$)

---

## Interview Tips

1. **Don't just say "eventual consistency"** — Specify which level and why
   - Bad: "We'll use eventual consistency"
   - Good: "We'll use eventual consistency for the product catalog, but read-your-writes for user profiles"

2. **Mention quorums when discussing distributed databases** — Shows implementation knowledge
   - "We'll configure Cassandra with N=3, W=2, R=2 for strong consistency while tolerating one node failure"

3. **Show nuanced thinking by mixing levels**
   - "For this feature we need read-your-writes consistency for the user's own data, but eventual is fine for the global feed"

4. **Know that you can tune per-operation**
   - "Critical inventory checks use QUORUM reads, but product descriptions use ONE for speed"

5. **Understand the cost implications**
   - "We'll use eventual reads for 95% of requests to reduce DynamoDB costs, and strongly consistent reads only for checkout"

6. **Discuss monitoring and alerting**
   - "We'll monitor replication lag and alert if it exceeds 5 seconds, which could cause user-visible staleness"

7. **Consider geographic distribution**
   - "With multi-region replication, we'll use LOCAL_QUORUM for low latency while maintaining consistency within each region"

---

## Quick Reference: Consistency Cheatsheet

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONSISTENCY MODEL PICKER                     │
└─────────────────────────────────────────────────────────────────┘

Money/Inventory/Votes          → Linearizable (W+R > N, or ACID)
User's own data                → Read-Your-Writes (sticky sessions)
Others' profiles               → Eventual (W=1, R=1)
Causally related (replies)     → Causal (vector clocks)
High-volume metrics            → Eventual (async aggregation)
Pagination/Feeds               → Monotonic Reads (version tracking)

┌─────────────────────────────────────────────────────────────────┐
│                       QUORUM FORMULAS                           │
└─────────────────────────────────────────────────────────────────┘

Strong:      W + R > N    (Example: W=2, R=2, N=3)
Eventual:    W + R ≤ N    (Example: W=1, R=1, N=3)
Fast Reads:  W=N, R=1     (Example: W=3, R=1, N=3)
Fast Writes: W=1, R=N     (Example: W=1, R=3, N=3)

┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE QUICK CONFIG                        │
└─────────────────────────────────────────────────────────────────┘

Cassandra:
  Strong:   CONSISTENCY QUORUM
  Eventual: CONSISTENCY ONE

DynamoDB:
  Strong:   ConsistentRead=True (2x cost)
  Eventual: ConsistentRead=False (default)

MongoDB:
  Strong:   readConcern: "majority", writeConcern: {w: "majority"}
  Eventual: readConcern: "local", writeConcern: {w: 1}
```

---

## Links

- [[cap_theorem]] — Why you can't have everything
- [[acid_vs_base]] — Transaction-level consistency
- [[03_design_patterns/replication]] — How consistency is implemented
- [[02_building_blocks/databases_nosql]] — Tunable consistency
- [[06_trade_offs/consistency_vs_availability]] — The fundamental trade-off
- [[06_trade_offs/latency_vs_throughput]] — Performance implications
- [[distributed_transactions]] — Achieving consistency across services
- [[conflict_resolution]] — Handling eventual consistency conflicts
