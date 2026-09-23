#java #collections #internals #interview

# Collections Internals

> How Java collections work under the hood — what interviewers actually ask.

---

## Definitions

| Term | Meaning |
|------|---------|
| **Hash Table** | Data structure that maps keys to values using a hash function for O(1) lookup |
| **Hash Function** | Converts a key into an integer (hash code) used to find the storage location |
| **Bucket** | A slot in the internal array where entries are stored |
| **Collision** | When two different keys hash to the same bucket |
| **Load Factor** | Ratio of entries to buckets (default 0.75) — triggers resize when exceeded |
| **Rehashing** | Creating a larger array and re-distributing all entries when load factor exceeded |
| **Treeification** | Converting a linked list bucket to a red-black tree when it has 8+ entries (Java 8+) |
| **Red-Black Tree** | Self-balancing binary search tree — guarantees O(log n) operations |
| **CAS** | Compare-And-Swap — atomic CPU operation used by ConcurrentHashMap |
| **Amortized** | Average cost over many operations (e.g., ArrayList.add is amortized O(1)) |

---

## HashMap Deep Dive

### Why HashMap Exists

```
Problem: You have a phone book with 1 million contacts.
         Finding "Alice" by searching one-by-one = O(n) = slow.

Solution: Convert "Alice" → number (hash) → go directly to that slot = O(1).
         Like looking up a word in a dictionary by first letter.
```

### Internal Structure

```
HashMap internally is: Node<K,V>[] table (array of linked lists / trees)

Index:     [0]        [1]        [2]        [3]        [4]    ...   [15]
            |          |          |          |          |
           null     ("Bob",25)   null    ("Alice",30)  null
                       |
                   ("Eve",28)   ← Collision: Bob and Eve hash to same bucket
                       |
                      null
```

```java
// Simplified internal Node
static class Node<K,V> {
    final int hash;      // Cached hash code
    final K key;
    V value;
    Node<K,V> next;      // Link to next node in bucket (for collisions)
}
```

### What Happens When You Call map.put("Alice", 30)

```
Step 1: Calculate hash
        hashCode = "Alice".hashCode()  → 63476538

Step 2: Spread/Perturbation (reduce collisions)
        hash = hashCode ^ (hashCode >>> 16)  → mixed bits

Step 3: Find bucket index
        index = hash & (table.length - 1)    → e.g., 3
        (This is why capacity is always power of 2: makes & work like %)

Step 4: Check bucket
        If empty → create new Node, put it there
        If occupied → walk the linked list:
            If key.equals(existingKey) → update value
            Else → append to end of list

Step 5: Check if resize needed
        if (++size > capacity * loadFactor) resize()
```

```
Visual: put("Alice",30) then put("Bob",25) then put("Eve",28) where Bob & Eve collide

STEP 1: put("Alice", 30)
[0:null] [1:null] [2:null] [3: Alice→30] [4:null] ... [15:null]

STEP 2: put("Bob", 25)  → hashes to index 1
[0:null] [1: Bob→25] [2:null] [3: Alice→30] [4:null] ... [15:null]

STEP 3: put("Eve", 28)  → hashes to index 1 (collision with Bob!)
[0:null] [1: Bob→25 → Eve→28] [2:null] [3: Alice→30] [4:null] ... [15:null]
                 ↑ linked list
```

### Treeification (Java 8+)

```
When a bucket has 8+ entries in a linked list:
  Linked list → Red-Black Tree

Why? Linked list search = O(n), Tree search = O(log n)

Bucket with 8+ collisions:

BEFORE (linked list):            AFTER (red-black tree):
  A → B → C → D → E →               D
  F → G → H → I                    /   \
  Search: O(n) = O(9)            B       F
                                 / \     / \
                                A   C   E   H
                                           / \
                                          G   I
                                Search: O(log n) = O(3.2)

De-treeification: When bucket shrinks to 6 entries → back to linked list
```

### Resize (Rehashing)

```
When: size > capacity × loadFactor (default: 16 × 0.75 = 12 entries)
What happens:
  1. Create new array of DOUBLE the size (16 → 32)
  2. Recalculate bucket index for EVERY entry
  3. Move entries to new positions

Before resize (capacity = 4):
[0: A] [1: B→C] [2: null] [3: D]

After resize (capacity = 8):
[0: A] [1: B] [2: null] [3: null] [4: null] [5: C] [6: null] [7: D]

Entries move because index = hash & (newCapacity - 1) gives different results

Cost: O(n) — all entries rehashed
This is why: capacity is power of 2, and loadFactor = 0.75 balances memory vs collisions
```

### Time Complexity

```
Operation    Average    Worst (list)    Worst (tree, Java 8+)
get()        O(1)       O(n)            O(log n)
put()        O(1)       O(n)            O(log n)
remove()     O(1)       O(n)            O(log n)
containsKey  O(1)       O(n)            O(log n)
```

### The equals-hashCode Contract

```java
// RULE: If a.equals(b) is true, then a.hashCode() == b.hashCode() MUST be true
// But: same hashCode does NOT mean equals (collisions exist)

// ❌ BROKEN: Override equals but not hashCode
class Person {
    String name;

    @Override
    public boolean equals(Object o) {
        return this.name.equals(((Person)o).name);
    }
    // No hashCode override! Uses default Object.hashCode() (memory address)
}

Person p1 = new Person("Alice");
Person p2 = new Person("Alice");
map.put(p1, "data");
map.get(p2);  // null! Different hashCode → different bucket → not found

// ✅ CORRECT: Override both
@Override
public int hashCode() {
    return Objects.hash(name);
}
```

---

## ConcurrentHashMap

### Why: HashMap Is NOT Thread-Safe

```java
// Two threads adding to HashMap simultaneously:
// Thread 1: map.put("A", 1)
// Thread 2: map.put("B", 2)

// Possible disasters:
// 1. Lost update: one put overwrites the other
// 2. Corrupted structure: linked list becomes circular → infinite loop (Java 7)
// 3. Size wrong: concurrent increments lose count
```

### How ConcurrentHashMap Works

```
Java 7: Segment-based locking
┌────────────────────────────────────────────────┐
│ Segment[0]  Segment[1]  Segment[2]  Segment[3] │
│ [lock]      [lock]      [lock]      [lock]      │
│ [buckets]   [buckets]   [buckets]   [buckets]   │
└────────────────────────────────────────────────┘
→ 16 segments, each with its own lock
→ 16 threads can write simultaneously (to different segments)

Java 8+: Node-level CAS + synchronized on bucket head
┌──────────────────────────────────────────┐
│ [0]     [1]     [2]     [3]    ...  [15] │
│  ↓       ↓       ↓       ↓               │
│ null   Node A  null   Node B             │
│        [sync]         [sync]             │
└──────────────────────────────────────────┘
→ Lock ONLY the bucket being modified
→ CAS for empty buckets (no lock needed)
→ Much finer granularity than Java 7
```

```java
// Thread-safe compound operations
ConcurrentHashMap<String, Integer> map = new ConcurrentHashMap<>();

// ❌ WRONG: not atomic (check-then-act race condition)
if (!map.containsKey("count")) {
    map.put("count", 1);    // Another thread might put between check and put
}

// ✅ CORRECT: atomic compound operations
map.putIfAbsent("count", 1);                  // Atomic
map.compute("count", (k, v) -> v == null ? 1 : v + 1);  // Atomic
map.merge("count", 1, Integer::sum);           // Atomic increment
```

### Comparison

```
                     HashMap    ConcurrentHashMap   Hashtable   synchronizedMap
Thread-safe?         ❌ No      ✅ Yes              ✅ Yes      ✅ Yes
Null key?            ✅ Yes     ❌ No               ❌ No       ✅ Yes
Null value?          ✅ Yes     ❌ No               ❌ No       ✅ Yes
Lock granularity     N/A        Bucket-level        Entire map  Entire map
Performance          Fastest    Fast (concurrent)   Slow        Slow
Atomic compounds     ❌ No      ✅ compute/merge    ❌ No       ❌ No
When to use          Single     Multi-threaded      Never       Never
                     thread     (prefer this)       (legacy)    (use CHM)
```

---

## LinkedHashMap

### Why: HashMap Doesn't Preserve Order

```java
// HashMap: iteration order is UNPREDICTABLE
Map<String, Integer> hashMap = new HashMap<>();
hashMap.put("banana", 2);
hashMap.put("apple", 1);
hashMap.put("cherry", 3);
// Might print in ANY order: cherry, apple, banana

// LinkedHashMap: preserves INSERTION order
Map<String, Integer> linkedMap = new LinkedHashMap<>();
linkedMap.put("banana", 2);
linkedMap.put("apple", 1);
linkedMap.put("cherry", 3);
// Always prints: banana, apple, cherry
```

### Internal Structure

```
Regular HashMap:
[0: cherry→3] [1: null] [2: banana→2] [3: null] [4: apple→1]
(No ordering information)

LinkedHashMap (adds doubly-linked list):
[0: cherry→3] [1: null] [2: banana→2] [3: null] [4: apple→1]

Plus a linked list threading through entries:
HEAD → banana→2 ←→ apple→1 ←→ cherry→3 → TAIL
       (first inserted)                    (last inserted)
```

### LRU Cache in 5 Lines

```java
// accessOrder=true: most recently accessed moves to end
// removeEldestEntry: auto-remove oldest when full

class LRUCache<K, V> extends LinkedHashMap<K, V> {
    private final int capacity;

    LRUCache(int capacity) {
        super(capacity, 0.75f, true);  // true = access-order
        this.capacity = capacity;
    }

    @Override
    protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
        return size() > capacity;  // Remove oldest when over capacity
    }
}

// Usage
LRUCache<String, Integer> cache = new LRUCache<>(3);
cache.put("a", 1);  // {a=1}
cache.put("b", 2);  // {a=1, b=2}
cache.put("c", 3);  // {a=1, b=2, c=3}
cache.get("a");      // Access "a" → moves to end: {b=2, c=3, a=1}
cache.put("d", 4);   // Over capacity! Remove eldest "b": {c=3, a=1, d=4}
```

---

## TreeMap / TreeSet

### Why: When You Need Sorted Keys

```
HashMap: unordered, O(1) — use when you just need fast lookup
TreeMap: sorted by key, O(log n) — use when you need ordering or range queries
```

### Internal: Red-Black Tree

```
TreeMap stores entries in a self-balancing binary search tree:

            put(5), put(3), put(7), put(1), put(4)

                      5 (BLACK)
                    /           \
               3 (RED)         7 (BLACK)
              /      \
          1 (BLACK)  4 (BLACK)

In-order traversal gives sorted keys: 1, 3, 4, 5, 7

Properties of Red-Black Tree:
1. Every node is red or black
2. Root is always black
3. No two adjacent red nodes
4. Every path from root to null has same number of black nodes
→ Guarantees height ≤ 2 × log(n) → O(log n) operations
```

### Key Methods (Super Useful in DSA)

```java
TreeMap<Integer, String> map = new TreeMap<>();
map.put(10, "ten"); map.put(20, "twenty"); map.put(30, "thirty");
map.put(40, "forty"); map.put(50, "fifty");

map.firstKey();          // 10 (minimum key)
map.lastKey();           // 50 (maximum key)
map.floorKey(25);        // 20 (largest key ≤ 25)
map.ceilingKey(25);      // 30 (smallest key ≥ 25)
map.lowerKey(30);        // 20 (largest key < 30)
map.higherKey(30);       // 40 (smallest key > 30)
map.subMap(20, 40);      // {20=twenty, 30=thirty} (20 inclusive, 40 exclusive)
map.headMap(30);         // {10=ten, 20=twenty} (keys < 30)
map.tailMap(30);         // {30=thirty, 40=forty, 50=fifty} (keys ≥ 30)

// TreeSet — same but for unique sorted elements
TreeSet<Integer> set = new TreeSet<>(List.of(10, 20, 30, 40, 50));
set.floor(25);           // 20
set.ceiling(25);         // 30
```

---

## ArrayList Internals

### Why: Arrays Are Fixed Size

```
Problem: You need a list that grows as you add elements.
Array: int[] arr = new int[10]; — size is FIXED at creation.
ArrayList: wraps an array and handles resizing automatically.
```

### How It Works

```java
// Internal structure (simplified)
class ArrayList<E> {
    Object[] elementData;  // The actual array
    int size;              // Number of elements (not array length!)
}
```

### Growth Strategy

```
Initial capacity: 10 (default)
Growth: 50% increase each time (newCapacity = oldCapacity + oldCapacity >> 1)

add() calls:
Size:  0 → Array: [_, _, _, _, _, _, _, _, _, _]  (capacity 10)
Size: 10 → FULL! Resize to 15
Size: 15 → FULL! Resize to 22
Size: 22 → FULL! Resize to 33
Size: 33 → FULL! Resize to 49
...

Resize process:
1. Create new array of 1.5× size
2. System.arraycopy() all elements to new array
3. Point elementData to new array
4. Old array becomes garbage (GC'd)
```

### Why ArrayList Beats LinkedList

```
                   ArrayList          LinkedList
get(index)         O(1) direct        O(n) traverse
add(end)           O(1) amortized     O(1)
add(middle)        O(n) shift         O(1) if at node*
remove(middle)     O(n) shift         O(1) if at node*
Memory per element ~4 bytes           ~24 bytes (prev + next + data + object header)
CPU Cache          ✅ Contiguous      ❌ Scattered in heap

* Finding the node to insert/remove at is O(n) in LinkedList too!

In practice: ArrayList wins 95% of the time.
Use LinkedList only when you need frequent add/remove at BOTH ends (use ArrayDeque instead).
```

---

## PriorityQueue Internals

### Why: Get Min/Max Efficiently

```
Problem: You have a stream of numbers and need the smallest one at any time.
Sorted array: O(n) to insert, O(1) to get min
PriorityQueue: O(log n) to insert, O(1) to get min ← Best
```

### Binary Heap as Array

```
PriorityQueue uses a binary min-heap stored as an array:

Tree view:              Array view:
       1                [1, 3, 2, 7, 5, 4, 6]
      / \               idx: 0  1  2  3  4  5  6
     3   2
    / \ / \             Parent of i: (i - 1) / 2
   7  5 4  6            Left child:  2 * i + 1
                        Right child: 2 * i + 2

Heap property: parent ≤ both children (min-heap)
```

### Operations

```
offer(element) — Add element: O(log n)
  1. Add to END of array
  2. "Sift up": swap with parent until heap property restored

         1                   1                   1
        / \    add(0)       / \    sift up      / \
       3   2   ──────→    3   2   ──────→     0   2
      / \                / \ /               / \ /
     7  5              7  5 0              7  5 3
                       [added at end]      [0 swapped up to root... wait]

                         0                 ← 0 is new min
                        / \
                       3   1
                      / \ /
                     7  5 2

poll() — Remove min: O(log n)
  1. Remove root (index 0)
  2. Move LAST element to root
  3. "Sift down": swap with smaller child until heap property restored
```

---

## ArrayDeque Internals

### Why: Faster Than Stack and LinkedList

```
Java's Stack class extends Vector (synchronized, slow).
LinkedList has pointer chasing overhead.
ArrayDeque: circular array — O(1) for both ends, cache-friendly.
```

### Circular Array

```
Internal: Object[] elements with head and tail pointers

After push(A), push(B), push(C):
elements: [A, B, C, _, _, _, _, _]
           ↑head      ↑tail

After offer(D) from queue end:
elements: [A, B, C, D, _, _, _, _]
           ↑head         ↑tail

After poll() from queue front:
elements: [_, B, C, D, _, _, _, _]
              ↑head      ↑tail

Circular wrap-around:
elements: [G, H, _, _, _, E, F, _]
                  ↑tail   ↑head
→ Head and tail wrap around the array
→ When full: resize to 2× capacity
```

---

## Immutable Collections (Java 9+)

```java
// Create immutable collections
List<Integer> list = List.of(1, 2, 3);         // Immutable list
Set<String> set = Set.of("a", "b", "c");       // Immutable set
Map<String, Integer> map = Map.of("a", 1, "b", 2); // Immutable map

list.add(4);   // ❌ UnsupportedOperationException!
list.set(0, 9); // ❌ UnsupportedOperationException!

// Mutable copy
List<Integer> mutable = new ArrayList<>(List.of(1, 2, 3));
mutable.add(4);  // ✅ Works

// Collections.unmodifiableList vs List.copyOf
List<Integer> original = new ArrayList<>(List.of(1, 2, 3));

List<Integer> view = Collections.unmodifiableList(original);
// view reflects changes to original (it's a VIEW)

List<Integer> copy = List.copyOf(original);
// copy is independent (it's a COPY)

original.add(4);
System.out.println(view);  // [1, 2, 3, 4] ← Changed!
System.out.println(copy);  // [1, 2, 3]     ← Independent
```

---

## Common Interview Traps

### 1. HashMap with Mutable Keys

```java
List<Integer> key = new ArrayList<>(List.of(1, 2));
Map<List<Integer>, String> map = new HashMap<>();
map.put(key, "hello");
map.get(key);      // "hello" ✅

key.add(3);        // Mutate the key! hashCode changes!
map.get(key);      // null ❌ Lost forever! (looks in wrong bucket)

// Fix: use immutable keys (String, Integer, record, List.of())
```

### 2. PriorityQueue Is NOT Sorted Iteration

```java
PriorityQueue<Integer> pq = new PriorityQueue<>(List.of(5, 1, 3, 2, 4));

// ❌ WRONG: for-each does NOT give sorted order
for (int n : pq) {
    System.out.print(n + " ");  // 1 2 3 5 4 ← NOT fully sorted!
}

// ✅ CORRECT: poll() gives sorted order
while (!pq.isEmpty()) {
    System.out.print(pq.poll() + " ");  // 1 2 3 4 5 ✅
}
```

### 3. ArrayList remove() Ambiguity with Integer

```java
List<Integer> list = new ArrayList<>(List.of(10, 20, 30));

list.remove(1);              // Removes index 1 → [10, 30] (removes 20)
list.remove(Integer.valueOf(10)); // Removes value 10 → [30]

// ⚠️ remove(1) treats 1 as INDEX, not value!
// Use Integer.valueOf(x) to remove by VALUE
```

### 4. null Handling Differences

```java
HashMap<String, String> hm = new HashMap<>();
hm.put(null, "value");     // ✅ Allows null key
hm.put("key", null);       // ✅ Allows null value

ConcurrentHashMap<String, String> chm = new ConcurrentHashMap<>();
chm.put(null, "value");    // ❌ NullPointerException!
chm.put("key", null);      // ❌ NullPointerException!

TreeMap<String, String> tm = new TreeMap<>();
tm.put(null, "value");     // ❌ NullPointerException! (can't compare null)
```

### 5. fail-fast vs fail-safe Iterators

```java
// fail-fast (HashMap, ArrayList): throws ConcurrentModificationException
Map<String, Integer> map = new HashMap<>();
map.put("a", 1); map.put("b", 2);
for (String key : map.keySet()) {
    map.remove(key);  // 💥 ConcurrentModificationException
}

// fail-safe (ConcurrentHashMap): works on a copy, no exception
ConcurrentHashMap<String, Integer> cmap = new ConcurrentHashMap<>();
cmap.put("a", 1); cmap.put("b", 2);
for (String key : cmap.keySet()) {
    cmap.remove(key);  // ✅ No exception (works on snapshot)
}
```

### 6. Arrays.sort Stability

```java
// Arrays.sort(primitives): Dual-pivot Quicksort → NOT stable
// Arrays.sort(objects): TimSort → stable
// Collections.sort(): TimSort → stable

// "Stable" means: equal elements keep their original relative order
// Matters when: sorting by one field, then by another
```

### 7. TreeMap Requires Comparable

```java
class Person {
    String name;
}

TreeMap<Person, String> map = new TreeMap<>();
map.put(new Person(), "data");  // 💥 ClassCastException!
// Person doesn't implement Comparable — TreeMap can't sort!

// Fix: implement Comparable OR provide Comparator
TreeMap<Person, String> map = new TreeMap<>(Comparator.comparing(p -> p.name));
```

---

## When To Use What — Decision Matrix

```
Data Structure     Internal         Best For                    Avoid When
─────────────────────────────────────────────────────────────────────────────
HashMap            Hash table       Fast key-value lookup       Need ordering
ConcurrentHashMap  Hash + CAS       Multi-threaded map          Single thread (use HashMap)
LinkedHashMap      Hash + DLL       Insertion order, LRU cache  Don't need order
TreeMap            Red-Black Tree   Sorted keys, range queries  Don't need sorting
ArrayList          Dynamic array    Random access, iteration    Frequent insert at middle
LinkedList         Doubly linked    Almost nothing (use Deque)  Random access
ArrayDeque         Circular array   Stack, Queue, Deque         Need random access
PriorityQueue      Binary heap      Min/Max tracking            Need sorted iteration
HashSet            HashMap wrapper  Unique elements             Need ordering
TreeSet            TreeMap wrapper  Sorted unique elements      Don't need sorting
```

### Complexity Cheat Sheet

```
                   add       get/contains   remove    Notes
ArrayList          O(1)*     O(1)           O(n)      *amortized, O(n) at middle
LinkedList         O(1)      O(n)           O(1)**    **if already at node
HashMap            O(1)*     O(1)           O(1)      *amortized (resize)
TreeMap            O(log n)  O(log n)       O(log n)  Always balanced
HashSet            O(1)      O(1)           O(1)      Same as HashMap
TreeSet            O(log n)  O(log n)       O(log n)  Same as TreeMap
PriorityQueue      O(log n)  O(n)           O(log n)  O(1) peek only
ArrayDeque         O(1)      O(n)           O(1)**    **from head/tail
ConcurrentHashMap  O(1)      O(1)           O(1)      Thread-safe
```

---

## Links

- [[java_essentials_for_dsa]] — Quick reference for DSA usage of collections
- [[concurrency_and_threading]] — ConcurrentHashMap in context, thread-safe patterns
- [[jvm_and_memory]] — How objects are stored in heap memory
- [[streams_and_functional]] — Stream operations on collections
- [[design_patterns_in_java]] — Iterator, Decorator patterns in collections
- [[interview_quick_reference]] — Quick revision cheat sheet
