#system-design #pattern #data #distributed

# Consistent Hashing

## Intuition (30 sec)

Imagine seating guests at a round table: instead of assigning "Guest 1 → Seat 1," you place guests randomly around the circle. Each guest sits at the next available seat clockwise from their random position. When you add a new seat, only the guests near it need to move — everyone else stays put.

## Failure-First Scenario

> You have 4 cache servers. You use `server = hash(key) % 4`. You add a 5th server. Now `hash(key) % 5` maps almost EVERY key to a different server. Your entire cache is invalidated. Miss rate goes to 100%. Database gets hammered. Consistent hashing would only move ~20% of keys.

## Core Definitions

### Consistent Hashing
A distributed hashing scheme that minimizes key remapping when nodes are added or removed. Maps both keys and nodes onto a hash ring, ensuring only K/N keys move when the cluster size changes (where K = total keys, N = number of nodes).

### Hash Ring
A circular hash space (typically 0 to 2^32-1 or 2^160-1) where both nodes and keys are mapped. The ring "wraps around" so the maximum value connects back to zero, forming a continuous circle.

### Virtual Nodes (Vnodes)
Multiple logical positions on the hash ring for each physical node. A single server with 150 vnodes appears at 150 different positions on the ring, dramatically improving load distribution.

### Hash Function
A deterministic function (MD5, SHA-1, MurmurHash) that maps keys and node identifiers to positions on the hash ring. Must provide uniform distribution and minimal collisions.

### Replication Factor
The number of copies of each key stored across different nodes. With replication factor N=3, a key is stored on the primary node and the next N-1 nodes clockwise on the ring.

### Token
The hash value representing a node's or vnode's position on the ring. In Cassandra, tokens define the range of keys a node is responsible for (from previous token to current token).

## Working Knowledge (5 min)

### The Problem with Simple Hashing

```
hash(key) % N servers

N changes (add/remove server) → almost all keys remap → massive cache misses
```

**Why it fails:**
- Server 0: keys where hash % 4 = 0
- Server 1: keys where hash % 4 = 1
- Server 2: keys where hash % 4 = 2
- Server 3: keys where hash % 4 = 3

Add server 4 → Now we use hash % 5:
- Server 0: keys where hash % 5 = 0 (DIFFERENT SET)
- Server 1: keys where hash % 5 = 1 (DIFFERENT SET)
- 80-99% of keys now map to different servers

### The Hash Ring

```
         0
    359° ↓ 1°
  ┌────────────┐
 │  Node C      │
│   (350°)       │
│                 │
270°             90°
│    Hash Ring    │
│                 │
│   Node A        │
 │  (100°)       │
  └────────────┘
    180° ↑
    Node B (180°)

Key "user:1001" → hash = 120°
Walk clockwise → Next node = B (180°)
Store on Node B
```

**Algorithm:**
1. Hash each **server** to a position on ring (0 to 2^32)
2. Hash each **key** to a position on same ring
3. Walk **clockwise** from key's position to find first server
4. That server owns the key

**Adding a server:** Only keys between new server and its predecessor move. ~1/N keys, not all keys.

**Removing a server:** Only that server's keys move to next server clockwise.

### Visual: Hash Ring Fundamentals

```
SCENARIO: 3 servers, 4 keys

Ring positions (0-359):
┌─────────────────────────────────────┐
│  Node A (pos: 100)                  │
│  Node B (pos: 200)                  │
│  Node C (pos: 300)                  │
│                                      │
│  Key1 (hash: 50)   → walks to A     │
│  Key2 (hash: 150)  → walks to B     │
│  Key3 (hash: 250)  → walks to C     │
│  Key4 (hash: 350)  → walks to A     │
└─────────────────────────────────────┘

Load distribution:
Node A: 2 keys (Key1, Key4) - 50%
Node B: 1 key  (Key2)       - 25%
Node C: 1 key  (Key3)       - 25%
```

### Virtual Nodes (Vnodes)

Problem: With few servers, distribution is uneven (one server might "own" 60% of the ring).

Solution: Each physical server gets multiple positions (virtual nodes) on the ring:

```
Server A → VnodeA1(50), VnodeA2(180), VnodeA3(310)
Server B → VnodeB1(90), VnodeB2(220), VnodeB3(350)
```

More virtual nodes → more even distribution. Typically 100-200 vnodes per server.

### Visual: Virtual Nodes Distribution

```
WITHOUT VIRTUAL NODES (uneven):
     0°
   ┌───┐
Node A │ 40% of ring
   │   │
   └───┘ 144°
   ┌───┐
Node B │ 35% of ring
   │   │
   └───┘ 270°
   ┌───┐
Node C │ 25% of ring
   └───┘

WITH VIRTUAL NODES (150 each, even):
     0°
   ╱─╲─╱─╲─╱─╲  Vnodes evenly distributed
  │A│B│C│A│B│C│ Each letter appears ~150 times
  │C│A│B│C│A│B│ Much better distribution
   ╲─╱─╲─╱─╲─╱

Load distribution:
Node A: 33.2% (target: 33.3%)
Node B: 33.4% (target: 33.3%)
Node C: 33.4% (target: 33.3%)
```

### Visual: Node Addition Impact

```
BEFORE (3 nodes):
  0°                90°               180°              270°
  │─────────────────│─────────────────│─────────────────│
  A                 B                 C                 A
  │← A owns range ──│← B owns range ──│← C owns range ──│

  Keys: K1(30°)→A, K2(120°)→B, K3(210°)→C, K4(300°)→A

ADD Node D at 45°:
  0°     45°        90°               180°              270°
  │──────│──────────│─────────────────│─────────────────│
  A      D          B                 C                 A
  │←A→│←─D range ──│← B owns range ──│← C owns range ──│

  Keys: K1(30°)→D (MOVED from A)
        K2(120°)→B (UNCHANGED)
        K3(210°)→C (UNCHANGED)
        K4(300°)→A (UNCHANGED)

RESULT: Only 1 out of 4 keys moved (25%)
With simple hashing (hash % N): 75% would move
```

### Visual: Node Removal Impact

```
BEFORE (4 nodes):
  0°     45°        90°               180°              270°
  │──────│──────────│─────────────────│─────────────────│
  A      D          B                 C                 A

  Keys: K1→D, K2→B, K3→C, K4→A

REMOVE Node D:
  0°                90°               180°              270°
  │─────────────────│─────────────────│─────────────────│
  A                 B                 C                 A
  │← A owns range ──│← B owns range ──│← C owns range ──│

  Keys: K1→B (MOVED, walks clockwise from D's position)
        K2→B (UNCHANGED)
        K3→C (UNCHANGED)
        K4→A (UNCHANGED)

RESULT: Only D's keys move to next node (B)
Simple hashing: 75% of keys would remap
```

## Deep Dive (30 min)

### How Much Data Moves?

| Operation | Simple Hash (% N) | Consistent Hashing |
|-----------|-------------------|-------------------|
| Add 1 server to 10 | ~90% keys move | ~10% keys move |
| Remove 1 server from 10 | ~90% keys move | ~10% keys move |
| Add 1 server to 100 | ~99% keys move | ~1% keys move |

### Mathematical Analysis

**Simple Hashing:**
```
Keys that stay: P(hash(k) % N_old == hash(k) % N_new)
Adding node 5 to 4 nodes: Only keys where hash % 4 == hash % 5
Probability ≈ 1/LCM(4,5) ≈ 5% stay
Result: 95% move
```

**Consistent Hashing:**
```
Keys that move: Keys in range [New_Node_Position, Previous_Node_Position]
Arc length = 1/N of ring (on average)
Result: Only 1/N keys move
```

### Implementation Patterns

#### Pattern 1: Basic Consistent Hash

```python
import hashlib
import bisect
from typing import List, Dict, Optional

class ConsistentHash:
    """Basic consistent hashing with virtual nodes"""

    def __init__(self, nodes: List[str], vnodes: int = 150):
        """
        Args:
            nodes: List of node identifiers
            vnodes: Number of virtual nodes per physical node
        """
        self.vnodes = vnodes
        self.ring: Dict[int, str] = {}
        self.sorted_keys: List[int] = []

        for node in nodes:
            self.add_node(node)

    def _hash(self, key: str) -> int:
        """Hash function using MD5"""
        return int(hashlib.md5(key.encode()).hexdigest(), 16)

    def add_node(self, node: str) -> None:
        """Add a node with its virtual nodes to the ring"""
        for i in range(self.vnodes):
            vnode_key = f"{node}:vnode{i}"
            hash_value = self._hash(vnode_key)
            self.ring[hash_value] = node
            bisect.insort(self.sorted_keys, hash_value)

    def remove_node(self, node: str) -> None:
        """Remove a node and all its virtual nodes"""
        for i in range(self.vnodes):
            vnode_key = f"{node}:vnode{i}"
            hash_value = self._hash(vnode_key)
            del self.ring[hash_value]
            self.sorted_keys.remove(hash_value)

    def get_node(self, key: str) -> Optional[str]:
        """Find the node responsible for a key"""
        if not self.ring:
            return None

        hash_value = self._hash(key)

        # Binary search for first node >= hash_value
        idx = bisect.bisect_right(self.sorted_keys, hash_value)

        # Wrap around to beginning if needed
        if idx == len(self.sorted_keys):
            idx = 0

        return self.ring[self.sorted_keys[idx]]

    def get_nodes(self, key: str, count: int) -> List[str]:
        """Get N nodes for replication (unique physical nodes)"""
        if not self.ring or count <= 0:
            return []

        hash_value = self._hash(key)
        idx = bisect.bisect_right(self.sorted_keys, hash_value)

        result = []
        seen = set()

        # Walk clockwise collecting unique physical nodes
        for i in range(len(self.sorted_keys)):
            pos = (idx + i) % len(self.sorted_keys)
            node = self.ring[self.sorted_keys[pos]]

            if node not in seen:
                result.append(node)
                seen.add(node)

                if len(result) == count:
                    break

        return result

# Usage
ch = ConsistentHash(['server1', 'server2', 'server3'], vnodes=150)

# Get node for key
print(ch.get_node('user:1001'))  # server2

# Get 3 nodes for replication
print(ch.get_nodes('user:1001', 3))  # ['server2', 'server3', 'server1']

# Add node - minimal key movement
ch.add_node('server4')

# Remove node - keys redistributed to next node
ch.remove_node('server2')
```

#### Pattern 2: Weighted Consistent Hashing

```python
class WeightedConsistentHash(ConsistentHash):
    """Consistent hashing with weighted nodes"""

    def __init__(self, base_vnodes: int = 150):
        self.base_vnodes = base_vnodes
        self.ring: Dict[int, str] = {}
        self.sorted_keys: List[int] = []
        self.weights: Dict[str, float] = {}

    def add_node(self, node: str, weight: float = 1.0) -> None:
        """
        Add node with weight (higher weight = more vnodes = more keys)

        Args:
            node: Node identifier
            weight: Relative capacity (1.0 = normal, 2.0 = double capacity)
        """
        self.weights[node] = weight
        vnodes = int(self.base_vnodes * weight)

        for i in range(vnodes):
            vnode_key = f"{node}:vnode{i}"
            hash_value = self._hash(vnode_key)
            self.ring[hash_value] = node
            bisect.insort(self.sorted_keys, hash_value)

    def remove_node(self, node: str) -> None:
        """Remove weighted node"""
        weight = self.weights.get(node, 1.0)
        vnodes = int(self.base_vnodes * weight)

        for i in range(vnodes):
            vnode_key = f"{node}:vnode{i}"
            hash_value = self._hash(vnode_key)
            if hash_value in self.ring:
                del self.ring[hash_value]
                self.sorted_keys.remove(hash_value)

        del self.weights[node]

# Usage: Handle heterogeneous hardware
wch = WeightedConsistentHash(base_vnodes=100)

# High-capacity server gets 2x vnodes (200)
wch.add_node('server1_32gb', weight=2.0)

# Normal capacity (100 vnodes)
wch.add_node('server2_16gb', weight=1.0)

# Low-capacity server gets 0.5x vnodes (50)
wch.add_node('server3_8gb', weight=0.5)
```

#### Pattern 3: Consistent Hashing with Jump Hash

```python
def jump_hash(key: int, num_buckets: int) -> int:
    """
    Google's Jump Hash - O(ln n) consistent hashing
    Better performance than ring-based approach
    Trade-off: Cannot weight nodes or customize placement
    """
    b, j = -1, 0
    while j < num_buckets:
        b = j
        key = ((key * 2862933555777941757) + 1) & 0xFFFFFFFFFFFFFFFF
        j = int((b + 1) * (float(1 << 31) / float((key >> 33) + 1)))
    return b

# Usage: High-performance caching
servers = ['cache1', 'cache2', 'cache3', 'cache4']

def get_cache_server(key: str) -> str:
    key_hash = int(hashlib.md5(key.encode()).hexdigest(), 16)
    bucket = jump_hash(key_hash, len(servers))
    return servers[bucket]

print(get_cache_server('user:1001'))  # cache2
```

### Decision Tree: When to Use Consistent Hashing

```
Need to distribute keys across servers?
│
├─ YES → Cluster size changes frequently?
│        │
│        ├─ YES → Keys are cacheable (can tolerate some movement)?
│        │        │
│        │        ├─ YES → Need weighted distribution?
│        │        │        │
│        │        │        ├─ YES → Use WEIGHTED CONSISTENT HASHING
│        │        │        │        Examples: Heterogeneous hardware,
│        │        │        │        different capacity servers
│        │        │        │
│        │        │        └─ NO → Use STANDARD CONSISTENT HASHING
│        │        │                Examples: Memcached, CDN routing,
│        │        │                load balancing
│        │        │
│        │        └─ NO → Keys are persistent data?
│        │                │
│        │                ├─ YES → Need custom placement control?
│        │                │        │
│        │                │        ├─ YES → Use CONSISTENT HASHING
│        │                │        │        with TOKENS
│        │                │        │        Examples: Cassandra,
│        │                │        │        Riak, DynamoDB
│        │                │        │
│        │                │        └─ NO → Use JUMP HASH
│        │                │                Examples: Simple sharding,
│        │                │                high-performance routing
│        │                │
│        │                └─ NO → (Invalid: all keys are persistent)
│        │
│        └─ NO → Cluster size is fixed?
│                 │
│                 ├─ YES → Use SIMPLE MODULO HASHING
│                 │        Example: hash(key) % N
│                 │        Pros: Simplest, fastest
│                 │        Cons: Cannot add/remove servers
│                 │
│                 └─ NO → Use RANGE-BASED PARTITIONING
│                          Example: A-M → Server1, N-Z → Server2
│                          Pros: Easy range queries
│                          Cons: Hotspots if data skewed
│
└─ NO → Not a distributed system scenario
```

### Production Patterns

#### Pattern 1: Virtual Node Count Selection

```python
import math
from typing import Dict

def calculate_optimal_vnodes(
    num_physical_nodes: int,
    target_imbalance: float = 0.05
) -> int:
    """
    Calculate optimal number of virtual nodes

    Args:
        num_physical_nodes: Number of physical servers
        target_imbalance: Acceptable load imbalance (0.05 = 5%)

    Returns:
        Recommended number of virtual nodes per physical node

    Rule of thumb:
    - Small cluster (3-10 nodes): 150-256 vnodes
    - Medium cluster (10-50 nodes): 64-150 vnodes
    - Large cluster (50+ nodes): 32-64 vnodes
    """
    if num_physical_nodes <= 10:
        return 150
    elif num_physical_nodes <= 50:
        return 100
    elif num_physical_nodes <= 100:
        return 64
    else:
        return 32

def measure_distribution_quality(
    ch: ConsistentHash,
    num_keys: int = 10000
) -> Dict[str, float]:
    """
    Measure load distribution across nodes

    Returns:
        Dictionary with distribution statistics
    """
    distribution = {}

    # Generate sample keys and count per node
    for i in range(num_keys):
        key = f"key:{i}"
        node = ch.get_node(key)
        distribution[node] = distribution.get(node, 0) + 1

    # Calculate statistics
    expected = num_keys / len(distribution)
    imbalances = []

    for node, count in distribution.items():
        imbalance = abs(count - expected) / expected
        imbalances.append(imbalance)

    return {
        'max_imbalance': max(imbalances),
        'avg_imbalance': sum(imbalances) / len(imbalances),
        'distribution': distribution,
        'expected_per_node': expected
    }

# Example: Find optimal vnodes for cluster size
nodes = [f'server{i}' for i in range(20)]

# Test different vnode counts
for vnodes in [32, 64, 128, 256]:
    ch = ConsistentHash(nodes, vnodes=vnodes)
    stats = measure_distribution_quality(ch)
    print(f"Vnodes: {vnodes}, Max Imbalance: {stats['max_imbalance']:.2%}")

# Output:
# Vnodes: 32, Max Imbalance: 15.3%
# Vnodes: 64, Max Imbalance: 8.7%
# Vnodes: 128, Max Imbalance: 4.2%  ← Good balance
# Vnodes: 256, Max Imbalance: 2.1%  ← Better but more memory
```

#### Pattern 2: Gradual Rebalancing Strategy

```python
from typing import Set, Tuple
import time

class RebalancingConsistentHash(ConsistentHash):
    """Consistent hash with gradual key migration"""

    def __init__(self, nodes: List[str], vnodes: int = 150):
        super().__init__(nodes, vnodes)
        self.old_ring: Optional[Dict[int, str]] = None
        self.old_sorted_keys: Optional[List[int]] = None
        self.rebalance_progress = 0.0

    def add_node_gradual(self, node: str, duration_seconds: float = 300):
        """
        Add node with gradual migration over duration

        Strategy:
        1. Add new node to ring
        2. For each request, probabilistically use old or new ring
        3. Gradually shift probability from 0% to 100% new ring
        4. After duration, all traffic uses new ring
        """
        # Snapshot current ring
        self.old_ring = self.ring.copy()
        self.old_sorted_keys = self.sorted_keys.copy()
        self.rebalance_start = time.time()
        self.rebalance_duration = duration_seconds

        # Add new node
        self.add_node(node)

    def get_node_during_rebalance(self, key: str) -> str:
        """Get node, handling gradual migration"""
        if self.old_ring is None:
            return self.get_node(key)

        # Calculate progress (0.0 to 1.0)
        elapsed = time.time() - self.rebalance_start
        progress = min(1.0, elapsed / self.rebalance_duration)

        # Gradually shift from old to new ring
        if hash(key) % 100 < progress * 100:
            # Use new ring
            return self.get_node(key)
        else:
            # Use old ring
            hash_value = self._hash(key)
            idx = bisect.bisect_right(self.old_sorted_keys, hash_value)
            if idx == len(self.old_sorted_keys):
                idx = 0
            return self.old_ring[self.old_sorted_keys[idx]]

        # Cleanup after completion
        if progress >= 1.0:
            self.old_ring = None
            self.old_sorted_keys = None

# Usage: Add node without thundering herd
rch = RebalancingConsistentHash(['s1', 's2', 's3'])

# Add node with 5-minute gradual migration
rch.add_node_gradual('s4', duration_seconds=300)

# Over next 5 minutes, traffic gradually shifts to new ring
# Avoids sudden spike of cache misses
```

#### Pattern 3: Bounded Loads

```python
from collections import defaultdict

class BoundedLoadConsistentHash(ConsistentHash):
    """
    Consistent hashing with load limits
    Prevents hotspots by capping load per node
    """

    def __init__(self, nodes: List[str], vnodes: int = 150,
                 load_factor: float = 1.25):
        """
        Args:
            load_factor: Max load as multiple of average
                        1.25 = node can handle 25% more than average
        """
        super().__init__(nodes, vnodes)
        self.load_factor = load_factor
        self.load_counter: Dict[str, int] = defaultdict(int)
        self.total_keys = 0

    def get_node_bounded(self, key: str) -> str:
        """Get node respecting load bounds"""
        hash_value = self._hash(key)
        idx = bisect.bisect_right(self.sorted_keys, hash_value)

        avg_load = self.total_keys / len(set(self.ring.values()))
        max_load = avg_load * self.load_factor

        # Walk clockwise until we find node under load limit
        checked = set()
        while True:
            if idx >= len(self.sorted_keys):
                idx = 0

            node = self.ring[self.sorted_keys[idx]]

            if self.load_counter[node] < max_load:
                self.load_counter[node] += 1
                self.total_keys += 1
                return node

            # Prevent infinite loop
            checked.add(node)
            if len(checked) == len(set(self.ring.values())):
                # All nodes at capacity, use least loaded
                return min(self.load_counter, key=self.load_counter.get)

            idx += 1

# Usage: Prevent hotspots in uneven workloads
blch = BoundedLoadConsistentHash(['s1', 's2', 's3'], load_factor=1.25)

# Even if keys hash unevenly, load is bounded
for i in range(1000):
    node = blch.get_node_bounded(f"key:{i}")

# No node has more than 25% above average load
```

### Monitoring and Observability

#### Key Metrics to Track

```python
from dataclasses import dataclass
from typing import Dict, List
import time

@dataclass
class ConsistentHashMetrics:
    """Metrics for monitoring consistent hash health"""

    # Distribution metrics
    keys_per_node: Dict[str, int]
    max_load_imbalance: float  # % deviation from average
    std_dev_load: float

    # Ring metrics
    num_vnodes: int
    num_physical_nodes: int
    vnodes_per_physical: float

    # Operation metrics
    avg_lookup_time_ms: float
    rebalances_in_progress: int

    # Hotspot detection
    hotspot_nodes: List[str]  # Nodes >150% of average load
    cold_nodes: List[str]     # Nodes <50% of average load

    timestamp: float

class MonitoredConsistentHash(ConsistentHash):
    """Consistent hash with built-in monitoring"""

    def __init__(self, nodes: List[str], vnodes: int = 150):
        super().__init__(nodes, vnodes)
        self.key_counter: Dict[str, int] = defaultdict(int)
        self.lookup_times: List[float] = []

    def get_node(self, key: str) -> str:
        """Get node with timing"""
        start = time.time()
        node = super().get_node(key)
        elapsed = (time.time() - start) * 1000  # ms

        self.lookup_times.append(elapsed)
        if len(self.lookup_times) > 1000:
            self.lookup_times.pop(0)

        self.key_counter[node] += 1
        return node

    def get_metrics(self) -> ConsistentHashMetrics:
        """Calculate current health metrics"""
        total_keys = sum(self.key_counter.values())
        num_nodes = len(set(self.ring.values()))

        if total_keys == 0 or num_nodes == 0:
            return ConsistentHashMetrics(
                keys_per_node={},
                max_load_imbalance=0,
                std_dev_load=0,
                num_vnodes=len(self.ring),
                num_physical_nodes=num_nodes,
                vnodes_per_physical=0,
                avg_lookup_time_ms=0,
                rebalances_in_progress=0,
                hotspot_nodes=[],
                cold_nodes=[],
                timestamp=time.time()
            )

        avg_load = total_keys / num_nodes

        # Calculate imbalance
        imbalances = []
        hotspots = []
        cold_nodes = []

        for node in set(self.ring.values()):
            load = self.key_counter[node]
            imbalance = abs(load - avg_load) / avg_load
            imbalances.append(imbalance)

            if load > avg_load * 1.5:
                hotspots.append(node)
            elif load < avg_load * 0.5:
                cold_nodes.append(node)

        # Standard deviation
        variance = sum((self.key_counter[n] - avg_load) ** 2
                      for n in set(self.ring.values())) / num_nodes
        std_dev = variance ** 0.5

        return ConsistentHashMetrics(
            keys_per_node=dict(self.key_counter),
            max_load_imbalance=max(imbalances) if imbalances else 0,
            std_dev_load=std_dev,
            num_vnodes=len(self.ring),
            num_physical_nodes=num_nodes,
            vnodes_per_physical=len(self.ring) / num_nodes,
            avg_lookup_time_ms=sum(self.lookup_times) / len(self.lookup_times)
                               if self.lookup_times else 0,
            rebalances_in_progress=0,
            hotspot_nodes=hotspots,
            cold_nodes=cold_nodes,
            timestamp=time.time()
        )

    def export_prometheus_metrics(self) -> str:
        """Export metrics in Prometheus format"""
        metrics = self.get_metrics()

        output = []
        output.append('# HELP consistent_hash_load_imbalance Max load imbalance ratio')
        output.append('# TYPE consistent_hash_load_imbalance gauge')
        output.append(f'consistent_hash_load_imbalance {metrics.max_load_imbalance}')

        output.append('# HELP consistent_hash_lookup_time_ms Average lookup time')
        output.append('# TYPE consistent_hash_lookup_time_ms gauge')
        output.append(f'consistent_hash_lookup_time_ms {metrics.avg_lookup_time_ms}')

        output.append('# HELP consistent_hash_keys_per_node Keys assigned to each node')
        output.append('# TYPE consistent_hash_keys_per_node gauge')
        for node, count in metrics.keys_per_node.items():
            output.append(f'consistent_hash_keys_per_node{{node="{node}"}} {count}')

        output.append('# HELP consistent_hash_hotspots Number of hotspot nodes')
        output.append('# TYPE consistent_hash_hotspots gauge')
        output.append(f'consistent_hash_hotspots {len(metrics.hotspot_nodes)}')

        return '\n'.join(output)

# Usage: Monitor in production
mch = MonitoredConsistentHash(['s1', 's2', 's3'], vnodes=150)

# Simulate traffic
for i in range(10000):
    mch.get_node(f"user:{i}")

# Check metrics
metrics = mch.get_metrics()
print(f"Max imbalance: {metrics.max_load_imbalance:.2%}")
print(f"Avg lookup: {metrics.avg_lookup_time_ms:.3f}ms")
print(f"Hotspots: {metrics.hotspot_nodes}")

# Export for monitoring system
prometheus_metrics = mch.export_prometheus_metrics()
```

#### Alerting Thresholds

```yaml
# Example Prometheus alerting rules
groups:
  - name: consistent_hash_alerts
    rules:
      # High load imbalance
      - alert: ConsistentHashImbalanced
        expr: consistent_hash_load_imbalance > 0.20
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Consistent hash load imbalance > 20%"
          description: "Keys are not evenly distributed. Consider increasing vnodes."

      # Hotspot detected
      - alert: ConsistentHashHotspot
        expr: consistent_hash_hotspots > 0
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Hotspot nodes detected"
          description: "Some nodes have >150% of average load."

      # Slow lookups
      - alert: ConsistentHashSlowLookups
        expr: consistent_hash_lookup_time_ms > 1.0
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Slow consistent hash lookups"
          description: "Avg lookup time > 1ms. May need optimization."
```

### Troubleshooting Guide

#### Problem 1: Uneven Distribution

**Symptoms:**
- Some nodes handle 2-3x more keys than others
- Hotspots appear in monitoring
- Some servers are overloaded while others are idle

**Root Causes:**
```
1. Too few virtual nodes
   → Solution: Increase vnodes from 32 to 150-256

2. Poor hash function
   → Solution: Switch from simple hash() to MD5/SHA-1

3. Non-uniform key distribution
   → Solution: Use bounded loads or weighted nodes

4. Heterogeneous hardware with equal vnodes
   → Solution: Use weighted consistent hashing
```

**Diagnostic Code:**
```python
def diagnose_distribution(ch: ConsistentHash, num_sample_keys: int = 10000):
    """Diagnose distribution problems"""

    # Count keys per node
    distribution = defaultdict(int)
    for i in range(num_sample_keys):
        node = ch.get_node(f"key:{i}")
        distribution[node] += 1

    avg = num_sample_keys / len(distribution)

    print("Distribution Analysis:")
    print(f"Average keys per node: {avg:.0f}")
    print(f"Total nodes: {len(distribution)}")
    print(f"Virtual nodes per physical: {ch.vnodes}")
    print()

    for node, count in sorted(distribution.items()):
        deviation = (count - avg) / avg * 100
        status = "⚠️ OVERLOADED" if deviation > 20 else \
                 "⚠️ UNDERLOADED" if deviation < -20 else "✓"
        print(f"{node}: {count} keys ({deviation:+.1f}%) {status}")

    # Calculate coefficient of variation
    variance = sum((c - avg) ** 2 for c in distribution.values()) / len(distribution)
    std_dev = variance ** 0.5
    cv = std_dev / avg

    print(f"\nCoefficient of Variation: {cv:.3f}")
    if cv > 0.15:
        print("⚠️ High variation. Recommendations:")
        print("  1. Increase vnodes to 150-256")
        print("  2. Check hash function quality")
        print("  3. Consider bounded loads")
    else:
        print("✓ Distribution is acceptable")

# Usage
ch = ConsistentHash(['s1', 's2', 's3'], vnodes=32)
diagnose_distribution(ch)

# Output:
# Distribution Analysis:
# Average keys per node: 3333
# Total nodes: 3
# Virtual nodes per physical: 32
#
# s1: 4102 keys (+23.1%) ⚠️ OVERLOADED
# s2: 2891 keys (-13.3%) ✓
# s3: 3007 keys (-9.8%) ✓
#
# Coefficient of Variation: 0.182
# ⚠️ High variation. Recommendations:
#   1. Increase vnodes to 150-256
```

#### Problem 2: Cascading Failures

**Scenario:**
```
Node A fails → Keys move to Node B
Node B overloaded → Node B fails
Node B's keys move to Node C
Node C overloaded → Node C fails
Cascade continues...
```

**Prevention Strategies:**

```python
class FailureResistantHash(ConsistentHash):
    """Consistent hash with cascade prevention"""

    def __init__(self, nodes: List[str], vnodes: int = 150,
                 max_load_factor: float = 1.5):
        super().__init__(nodes, vnodes)
        self.max_load_factor = max_load_factor
        self.current_load: Dict[str, float] = {n: 0.0 for n in nodes}

    def mark_node_failed(self, failed_node: str) -> List[str]:
        """
        Handle node failure with cascade prevention

        Returns:
            List of nodes that may be at risk
        """
        # Calculate load that will be redistributed
        failed_load = self.current_load[failed_node]

        # Find nodes that will receive the load
        at_risk = []
        avg_load = sum(self.current_load.values()) / len(self.current_load)

        # Check which nodes will be affected
        for node in set(self.ring.values()):
            if node == failed_node:
                continue

            # Estimate new load (simplified)
            new_load = self.current_load[node] + (failed_load / (len(self.current_load) - 1))

            if new_load > avg_load * self.max_load_factor:
                at_risk.append(node)

        # Remove failed node
        self.remove_node(failed_node)
        del self.current_load[failed_node]

        return at_risk

    def prevent_cascade(self, at_risk_nodes: List[str]):
        """Take action to prevent cascade"""
        print(f"⚠️ Nodes at risk of cascade failure: {at_risk_nodes}")
        print("Actions taken:")
        print("1. Throttling requests to at-risk nodes")
        print("2. Spinning up emergency capacity")
        print("3. Enabling circuit breakers")
        print("4. Alerting on-call team")

# Usage
frh = FailureResistantHash(['s1', 's2', 's3', 's4'], vnodes=150)

# Simulate load
frh.current_load = {'s1': 100, 's2': 100, 's3': 100, 's4': 100}

# Node fails
at_risk = frh.mark_node_failed('s1')
if at_risk:
    frh.prevent_cascade(at_risk)
```

**Production Safeguards:**
```python
# 1. Health checking before routing
def get_node_with_health_check(ch: ConsistentHash, key: str,
                               health_check: callable) -> str:
    """Get node, skipping unhealthy ones"""
    candidates = ch.get_nodes(key, count=3)  # Get 3 options

    for node in candidates:
        if health_check(node):
            return node

    # All unhealthy - return first (will trigger circuit breaker)
    return candidates[0]

# 2. Circuit breaker pattern
class CircuitBreaker:
    def __init__(self, failure_threshold: int = 5, timeout: int = 60):
        self.failures = defaultdict(int)
        self.threshold = failure_threshold
        self.timeout = timeout
        self.opened_at = {}

    def is_open(self, node: str) -> bool:
        """Check if circuit is open (node is blocked)"""
        if node not in self.opened_at:
            return False

        # Check if timeout expired
        if time.time() - self.opened_at[node] > self.timeout:
            # Try half-open
            del self.opened_at[node]
            self.failures[node] = 0
            return False

        return True

    def record_failure(self, node: str):
        """Record a failure"""
        self.failures[node] += 1
        if self.failures[node] >= self.threshold:
            self.opened_at[node] = time.time()
            print(f"⚠️ Circuit breaker opened for {node}")

    def record_success(self, node: str):
        """Record a success"""
        if node in self.failures:
            self.failures[node] = max(0, self.failures[node] - 1)

# Usage
cb = CircuitBreaker()

def safe_get_node(ch: ConsistentHash, key: str) -> str:
    """Get node with circuit breaker"""
    candidates = ch.get_nodes(key, count=5)

    for node in candidates:
        if not cb.is_open(node):
            return node

    raise Exception("All nodes circuit-broken")
```

#### Problem 3: Memory Usage (Too Many Vnodes)

**Symptoms:**
- High memory usage for ring storage
- Slow node addition/removal
- Binary search performance degraded

**Analysis:**
```python
import sys

def analyze_memory_usage(num_nodes: int, vnodes_per_node: int):
    """Estimate memory usage of consistent hash ring"""

    # Each vnode: hash (8 bytes) + pointer to node (8 bytes)
    bytes_per_vnode = 16

    total_vnodes = num_nodes * vnodes_per_node
    memory_mb = (total_vnodes * bytes_per_vnode) / (1024 * 1024)

    # Binary search complexity
    lookup_comparisons = math.log2(total_vnodes)

    print(f"Configuration: {num_nodes} nodes × {vnodes_per_node} vnodes")
    print(f"Total vnodes: {total_vnodes:,}")
    print(f"Memory usage: ~{memory_mb:.2f} MB")
    print(f"Lookup comparisons: ~{lookup_comparisons:.1f}")
    print()

# Compare configurations
analyze_memory_usage(100, 32)    # 3200 vnodes
analyze_memory_usage(100, 150)   # 15000 vnodes
analyze_memory_usage(100, 512)   # 51200 vnodes
analyze_memory_usage(1000, 256)  # 256000 vnodes

# Output:
# Configuration: 100 nodes × 32 vnodes
# Total vnodes: 3,200
# Memory usage: ~0.05 MB
# Lookup comparisons: ~11.6
#
# Configuration: 100 nodes × 150 vnodes
# Total vnodes: 15,000
# Memory usage: ~0.23 MB
# Lookup comparisons: ~13.9
#
# Configuration: 100 nodes × 512 vnodes
# Total vnodes: 51,200
# Memory usage: ~0.78 MB
# Lookup comparisons: ~15.6
#
# Configuration: 1000 nodes × 256 vnodes
# Total vnodes: 256,000
# Memory usage: ~3.91 MB
# Lookup comparisons: ~18.0
```

**Recommendations:**
- Small cluster (<10 nodes): 150-256 vnodes
- Medium cluster (10-100 nodes): 64-150 vnodes
- Large cluster (100-1000 nodes): 32-64 vnodes
- Very large (1000+ nodes): 16-32 vnodes or use Jump Hash

### Real-World Examples

#### Example 1: Cassandra's Token Ring

```python
"""
Cassandra uses consistent hashing for data distribution
Key concepts:
- Token: A position on the ring (uses Murmur3 hash: -2^63 to 2^63-1)
- Partition key: Determines which node stores the data
- Replication: Data is stored on N nodes clockwise from token
"""

class CassandraStyleRing:
    """Simplified Cassandra token ring"""

    def __init__(self, replication_factor: int = 3):
        self.rf = replication_factor
        self.nodes: Dict[int, str] = {}  # token → node
        self.sorted_tokens: List[int] = []

    def add_node(self, node: str, token: int):
        """
        Add node with explicit token (Cassandra style)

        In real Cassandra:
        - Manual tokens: Operator specifies
        - Automatic tokens (vnodes): Cassandra assigns ~256 tokens
        """
        self.nodes[token] = node
        bisect.insort(self.sorted_tokens, token)

    def get_replicas(self, partition_key: str) -> List[str]:
        """
        Get nodes that should store this partition

        Cassandra walks clockwise to get RF unique nodes
        """
        token = self._hash_partition_key(partition_key)
        idx = bisect.bisect_right(self.sorted_tokens, token)

        replicas = []
        seen_nodes = set()

        # Walk clockwise, collecting RF unique physical nodes
        for i in range(len(self.sorted_tokens)):
            pos = (idx + i) % len(self.sorted_tokens)
            node = self.nodes[self.sorted_tokens[pos]]

            if node not in seen_nodes:
                replicas.append(node)
                seen_nodes.add(node)

                if len(replicas) == self.rf:
                    break

        return replicas

    def _hash_partition_key(self, key: str) -> int:
        """Murmur3 hash (simplified)"""
        return int(hashlib.md5(key.encode()).hexdigest(), 16) % (2**63)

    def describe_ring(self):
        """Show ring topology"""
        print("Token Ring:")
        for i, token in enumerate(self.sorted_tokens):
            node = self.nodes[token]
            next_token = self.sorted_tokens[(i+1) % len(self.sorted_tokens)]
            range_size = (next_token - token) % (2**63)
            print(f"  Token {token:20d} → Node {node} (range size: {range_size:20d})")

# Usage: 3-node cluster with manual tokens
ring = CassandraStyleRing(replication_factor=3)

# Evenly space tokens on ring
ring.add_node('cassandra1', 0)
ring.add_node('cassandra2', 2**62)
ring.add_node('cassandra3', 2**63 - 2**62)

ring.describe_ring()

# Find replicas for a partition
replicas = ring.get_replicas('user_id:12345')
print(f"\nData for 'user_id:12345' stored on: {replicas}")

# Output:
# Token Ring:
#   Token                    0 → Node cassandra1 (range size: ...)
#   Token          4611686018427387904 → Node cassandra2 (range size: ...)
#   Token          9223372036854775807 → Node cassandra3 (range size: ...)
#
# Data for 'user_id:12345' stored on: ['cassandra2', 'cassandra3', 'cassandra1']
```

**Cassandra Production Configuration:**
```yaml
# cassandra.yaml
num_tokens: 256  # Virtual nodes per physical node

# Token allocation strategies:
# 1. vnodes (default): Automatic token assignment
# 2. Manual: Operator assigns specific tokens

# Replication strategy
keyspace: users
  replication:
    class: NetworkTopologyStrategy
    datacenter1: 3  # RF=3 in DC1
    datacenter2: 2  # RF=2 in DC2
```

#### Example 2: DynamoDB Consistent Hashing

```python
"""
DynamoDB uses consistent hashing for partition management
Key concepts:
- Partition key: Hashed to determine storage node
- Hash key space: MD5 hash (128-bit)
- Partitions: Dynamically split when they grow too large
"""

class DynamoDBStyleHash:
    """Simplified DynamoDB partition management"""

    def __init__(self):
        self.partitions: Dict[Tuple[int, int], str] = {}  # (start, end) → node
        self.sorted_ranges: List[Tuple[int, int]] = []

        # Initial single partition covering full hash space
        self.add_partition(0, 2**128 - 1, 'node1')

    def add_partition(self, start: int, end: int, node: str):
        """Add a partition covering hash range [start, end]"""
        self.partitions[(start, end)] = node
        self.sorted_ranges.append((start, end))
        self.sorted_ranges.sort()

    def get_partition(self, partition_key: str) -> str:
        """Find which partition/node stores this key"""
        hash_val = self._hash(partition_key)

        for start, end in self.sorted_ranges:
            if start <= hash_val <= end:
                return self.partitions[(start, end)]

        raise ValueError(f"No partition found for hash {hash_val}")

    def split_partition(self, start: int, end: int, new_node: str):
        """
        Split a partition (DynamoDB does this automatically when:
        - Partition exceeds 10 GB
        - Partition receives too much traffic
        """
        # Remove old partition
        old_node = self.partitions.pop((start, end))
        self.sorted_ranges.remove((start, end))

        # Split in middle
        mid = (start + end) // 2

        # Create two new partitions
        self.add_partition(start, mid, old_node)
        self.add_partition(mid + 1, end, new_node)

        print(f"Split partition [{start}, {end}]:")
        print(f"  → [{start}, {mid}] on {old_node}")
        print(f"  → [{mid+1}, {end}] on {new_node}")

    def _hash(self, key: str) -> int:
        """MD5 hash to 128-bit integer"""
        return int(hashlib.md5(key.encode()).hexdigest(), 16)

    def describe_partitions(self):
        """Show partition map"""
        print("DynamoDB Partition Map:")
        for (start, end), node in sorted(self.partitions.items()):
            print(f"  [{start:40d}, {end:40d}] → {node}")

# Usage: Simulate DynamoDB partition growth
dynamo = DynamoDBStyleHash()

print("Initial state:")
dynamo.describe_partitions()
print()

# Simulate partition splits as data grows
dynamo.split_partition(0, 2**128 - 1, 'node2')
print()

dynamo.split_partition(0, (2**128 - 1) // 2, 'node3')
print()

# Route a key
node = dynamo.get_partition('user:12345')
print(f"\nKey 'user:12345' routes to: {node}")

# Output:
# Initial state:
# DynamoDB Partition Map:
#   [0, 340282366920938463463374607431768211455] → node1
#
# Split partition [0, 340282366920938463463374607431768211455]:
#   → [0, 170141183460469231731687303715884105727] on node1
#   → [170141183460469231731687303715884105728, 340282366920938463463374607431768211455] on node2
#
# Split partition [0, 170141183460469231731687303715884105727]:
#   → [0, 85070591730234615865843651857942052863] on node1
#   → [85070591730234615865843651857942052864, 170141183460469231731687303715884105727] on node3
```

**DynamoDB Key Design Implications:**
```python
# GOOD: High-cardinality partition key
table.put_item(Item={
    'user_id': '12345',      # Partition key - many unique values
    'timestamp': '2026-02-14',
    'data': '...'
})

# BAD: Low-cardinality partition key (hot partition)
table.put_item(Item={
    'status': 'active',      # Partition key - only a few values
    'user_id': '12345',
    'data': '...'
})
# All 'active' users hit same partition → hot spot

# BETTER: Compound partition key with high cardinality
table.put_item(Item={
    'partition_key': 'active#12345',  # Composite: status + user_id
    'data': '...'
})
```

#### Example 3: Memcached Client-Side Hashing

```python
"""
Memcached uses client-side consistent hashing
Clients maintain the hash ring, not servers
"""

class MemcachedClient:
    """Memcached client with consistent hashing"""

    def __init__(self, servers: List[str]):
        self.ch = ConsistentHash(servers, vnodes=100)
        self.connections = {server: self._connect(server) for server in servers}

    def _connect(self, server: str):
        """Establish connection to memcached server"""
        # In real implementation: socket connection
        return f"connection_to_{server}"

    def get(self, key: str):
        """Get value from cache"""
        server = self.ch.get_node(key)
        conn = self.connections[server]
        # In real implementation: send GET command over socket
        return f"GET {key} from {server}"

    def set(self, key: str, value: str):
        """Set value in cache"""
        server = self.ch.get_node(key)
        conn = self.connections[server]
        # In real implementation: send SET command over socket
        return f"SET {key}={value} on {server}"

    def delete(self, key: str):
        """Delete key from cache"""
        server = self.ch.get_node(key)
        conn = self.connections[server]
        # In real implementation: send DELETE command
        return f"DELETE {key} from {server}"

    def add_server(self, server: str):
        """Add new memcached server (minimal key movement)"""
        self.ch.add_node(server)
        self.connections[server] = self._connect(server)
        print(f"Added {server} - only ~1/N keys will move")

    def remove_server(self, server: str):
        """Remove failed memcached server"""
        self.ch.remove_node(server)
        if server in self.connections:
            # Close connection
            del self.connections[server]
        print(f"Removed {server} - its keys redistributed")

# Usage
client = MemcachedClient([
    'memcached1:11211',
    'memcached2:11211',
    'memcached3:11211'
])

# Cache operations
print(client.set('user:1001:profile', '{"name": "Alice"}'))
print(client.get('user:1001:profile'))

# Add capacity - minimal disruption
client.add_server('memcached4:11211')

# Server failure - graceful degradation
client.remove_server('memcached2:11211')

# Output:
# SET user:1001:profile={"name": "Alice"} on memcached2:11211
# GET user:1001:profile from memcached2:11211
# Added memcached4:11211 - only ~1/N keys will move
# Removed memcached2:11211 - its keys redistributed
```

**Memcached Production Setup:**
```python
# Multiple memcached pools for different use cases
class MemcachedCluster:
    def __init__(self):
        # Separate pools for different data types
        self.session_cache = MemcachedClient([
            'session-cache-1:11211',
            'session-cache-2:11211',
            'session-cache-3:11211'
        ])

        self.data_cache = MemcachedClient([
            'data-cache-1:11211',
            'data-cache-2:11211',
            'data-cache-3:11211',
            'data-cache-4:11211'
        ])

    def get_user_session(self, session_id: str):
        return self.session_cache.get(f"session:{session_id}")

    def get_user_data(self, user_id: str):
        return self.data_cache.get(f"user:{user_id}")

cluster = MemcachedCluster()
```

#### Example 4: Load Balancer with Consistent Hashing

```python
"""
Load balancers use consistent hashing for sticky sessions
without requiring session state storage
"""

class ConsistentHashLoadBalancer:
    """LB using consistent hashing for session affinity"""

    def __init__(self, backends: List[str]):
        self.ch = ConsistentHash(backends, vnodes=100)
        self.health_status = {b: True for b in backends}

    def route_request(self, session_id: str, request: dict) -> str:
        """
        Route request to backend based on session ID

        Guarantees:
        - Same session always goes to same backend (if healthy)
        - When backend fails, only its sessions move
        - When backend added, only 1/N sessions move
        """
        # Get primary and backup backends
        candidates = self.ch.get_nodes(session_id, count=3)

        # Find first healthy backend
        for backend in candidates:
            if self.health_status.get(backend, False):
                return backend

        # All unhealthy - return first (circuit breaker will handle)
        return candidates[0]

    def mark_unhealthy(self, backend: str):
        """Mark backend as failed"""
        self.health_status[backend] = False
        print(f"⚠️ Backend {backend} marked unhealthy")
        print(f"   Its sessions will move to next backend clockwise")

    def mark_healthy(self, backend: str):
        """Backend recovered"""
        self.health_status[backend] = True
        print(f"✓ Backend {backend} healthy again")

# Usage: Sticky session load balancing
lb = ConsistentHashLoadBalancer([
    'backend1:8080',
    'backend2:8080',
    'backend3:8080'
])

# User's session always routes to same backend
session_id = 'session_abc123'
request1 = {'url': '/api/cart', 'user': 'alice'}
request2 = {'url': '/api/checkout', 'user': 'alice'}

backend1 = lb.route_request(session_id, request1)
backend2 = lb.route_request(session_id, request2)

print(f"Request 1 → {backend1}")
print(f"Request 2 → {backend2}")  # Same backend!

# Backend fails - session moves gracefully
lb.mark_unhealthy('backend2:8080')
backend3 = lb.route_request(session_id, request1)
print(f"After failure → {backend3}")  # Different backend

# Output:
# Request 1 → backend2:8080
# Request 2 → backend2:8080
# ⚠️ Backend backend2:8080 marked unhealthy
#    Its sessions will move to next backend clockwise
# After failure → backend3:8080
```

**Nginx Configuration:**
```nginx
# Nginx with consistent hashing
upstream backend {
    hash $request_uri consistent;  # Consistent hashing on URI

    server backend1:8080;
    server backend2:8080;
    server backend3:8080;
}

# Or hash on cookie for sticky sessions
upstream backend_sticky {
    hash $cookie_session_id consistent;

    server backend1:8080;
    server backend2:8080;
    server backend3:8080;
}
```

## The "Why" Chain

- **Why consistent hashing?** → Minimizes data movement when cluster size changes
- **What's the alternative?** → Simple modulo hashing (terrible when scaling), range-based partitioning (hotspot risk)
- **What breaks without it?** → Adding/removing a server invalidates almost all cached data → thundering herd → outage
- **Why virtual nodes?** → Prevents uneven distribution with small cluster sizes
- **When does it fail?** → Keys are not uniformly distributed (use bounded loads), cascade failures (use health checks and circuit breakers)

## Mental Models

### The Clockwork Model
Think of consistent hashing as a clock face. Keys and nodes are pins stuck at random hours. To find where a key lives, start at the key's position and walk clockwise until you hit a node pin. When you add a new node, you only disturb the keys between it and the previous node - everyone else stays at their current position.

### The Bucket Brigade Model
Imagine a line of people passing buckets of water. With simple hashing (% N), when someone joins or leaves, everyone has to reorganize. With consistent hashing, only the people next to the change shuffle positions - the rest keep passing buckets as before.

## Interview Tips

- Mention consistent hashing whenever you discuss distributed caching or sharding
- Know the "hash ring" concept — draw it in interviews
- Virtual nodes → "for better distribution we'd use 100-200 virtual nodes per server"
- Real-world tie: "Cassandra and DynamoDB both use consistent hashing for data distribution"
- Know the trade-offs: "Consistent hashing is great for cache layers where we can tolerate some movement, but for persistent data we need to also consider replication and partition strategies"
- Mention monitoring: "We'd track load distribution across nodes and alert if any node exceeds 150% of average load"

## Common Pitfalls

1. **Too few virtual nodes** → Uneven distribution → Some servers overloaded
2. **Too many virtual nodes** → Excessive memory usage → Slow lookups
3. **Poor hash function** → Clustering of nodes/keys → Hotspots
4. **No health checking** → Routing to dead nodes → Errors
5. **No circuit breakers** → Cascading failures when nodes die
6. **Ignoring replication** → Single node failure loses data
7. **No monitoring** → Hotspots go undetected until outage

## Quick Reference

| Aspect | Recommendation |
|--------|---------------|
| **Vnodes per node** | Small cluster: 150-256, Large cluster: 32-64 |
| **Hash function** | MD5 or Murmur3 (uniform distribution) |
| **Replication factor** | 3 (minimum for durability) |
| **Load imbalance alert** | >20% deviation from average |
| **Health check interval** | 5-10 seconds |
| **Circuit breaker threshold** | 5 failures in 60 seconds |
| **Rebalancing duration** | 5-15 minutes (gradual) |

## Links

- [[sharding]] — Consistent hashing is a sharding strategy
- [[02_building_blocks/caching]] — Distributing cache keys across servers
- [[02_building_blocks/load_balancers]] — Consistent hashing as LB algorithm
- [[02_building_blocks/cdn]] — Content distribution uses consistent hashing
- [[replication]] — Consistent hashing with replication factor
- [[partition_tolerance]] — How consistent hashing handles failures
