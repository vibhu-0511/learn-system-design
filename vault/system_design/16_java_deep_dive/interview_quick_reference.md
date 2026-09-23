#java #interview #cheatsheet #reference

# Java Interview Quick Reference

> One-stop revision sheet — scan this before any interview. Links to detailed files for depth.

---

## Collections Cheat Sheet → [[collections_internals]]

```
Data Structure     Internal          Get     Add      Remove   Thread-Safe?
────────────────────────────────────────────────────────────────────────────
ArrayList          Dynamic array     O(1)    O(1)*    O(n)     No
LinkedList         Doubly linked     O(n)    O(1)     O(1)**   No
HashMap            Array+LL/Tree     O(1)    O(1)     O(1)     No
TreeMap            Red-Black Tree    O(logn) O(logn)  O(logn)  No
LinkedHashMap      HashMap+DLL       O(1)    O(1)     O(1)     No
ConcurrentHashMap  Node+CAS          O(1)    O(1)     O(1)     Yes
HashSet            HashMap wrapper   O(1)    O(1)     O(1)     No
TreeSet            TreeMap wrapper   O(logn) O(logn)  O(logn)  No
PriorityQueue      Binary heap       O(1)†   O(logn)  O(logn)  No
ArrayDeque         Circular array    O(1)‡   O(1)     O(1)     No

* amortized  ** if at node  † peek only  ‡ head/tail only
```

**Quick decisions:**
```
Fast key-value          → HashMap
Sorted keys             → TreeMap (floorKey, ceilingKey!)
Thread-safe map         → ConcurrentHashMap
Unique elements         → HashSet
Stack/Queue             → ArrayDeque (NOT Stack class)
Min/Max tracking        → PriorityQueue
LRU Cache               → LinkedHashMap(accessOrder=true)
```

---

## Concurrency Cheat Sheet → [[concurrency_and_threading]]

```
Need                              → Use
──────────────────────────────────────────────
Simple lock                       → synchronized
tryLock / fairness                → ReentrantLock
Boolean flag between threads      → volatile
Atomic counter                    → AtomicInteger
Fixed thread pool                 → Executors.newFixedThreadPool(n)
Async pipeline                    → CompletableFuture
Wait for N tasks                  → CountDownLatch
N threads sync at barrier         → CyclicBarrier
Limit concurrent access           → Semaphore
Per-thread storage                → ThreadLocal (ALWAYS remove!)
Millions of I/O tasks             → Virtual Threads (Java 21)
```

**Pool sizing:** `CPU cores × (1 + wait_time / compute_time)`
- CPU-bound: pool = CPU cores
- I/O-bound: pool = CPU cores × 10-50

---

## Streams Cheat Sheet → [[streams_and_functional]]

```
Source → filter → map → sorted → collect → Result
         (lazy)   (lazy)  (lazy)   (triggers!)

Key operations:
  filter(predicate)         Keep matching elements
  map(function)             Transform elements
  flatMap(function)         Flatten nested structures
  sorted()                  Sort (natural or custom)
  distinct()                Remove duplicates
  collect(Collectors.x())   Gather results
  reduce(identity, op)      Combine into single value
  groupingBy(classifier)    SQL GROUP BY equivalent
  toList()                  Java 16+ immutable list
```

**Optional rules:**
```
orElse("default")           Eager (always evaluates)
orElseGet(() -> compute())  Lazy (only if empty) ← prefer for expensive ops
orElseThrow()               Throw NoSuchElementException
map(fn)                     Transform if present
flatMap(fn)                 When fn returns Optional
```

---

## JVM Cheat Sheet → [[jvm_and_memory]]

```
Area        Contains                Per-Thread?  Error
──────────────────────────────────────────────────────
Stack       Local vars, frames      Yes          StackOverflowError
Heap        All objects             No (shared)  OutOfMemoryError: heap
Metaspace   Class metadata          No (shared)  OutOfMemoryError: Metaspace
Eden        New objects             No           (Minor GC)
Old Gen     Long-lived objects      No           (Full GC)
```

**Key JVM flags:**
```
-Xms512m       Initial heap (set = Xmx in prod)
-Xmx4g         Max heap
-Xss512k       Thread stack size
-XX:+UseG1GC   G1 collector (default)
-XX:+UseZGC    Ultra-low latency (<10ms pause)
```

**GC: G1 (default)** → region-based, targets pause time
**GC: ZGC** → ultra-low latency, handles TB heaps

---

## Spring Boot Cheat Sheet → [[spring_boot_production]]

```
Layer           Annotation        Responsibility
Controller      @RestController   HTTP, validation, response
Service         @Service          Business logic, @Transactional
Repository      @Repository       Data access, JPA queries
Config          @Configuration    Bean definitions, profiles
```

**Key annotations:**
```
@GetMapping, @PostMapping, @PutMapping, @DeleteMapping
@PathVariable, @RequestParam, @RequestBody
@Valid + @NotNull, @NotBlank, @Size, @Email
@Transactional (public methods only!)
@ControllerAdvice + @ExceptionHandler (global error handling)
```

---

## Exception Cheat Sheet → [[exception_handling_and_optional]]

```
Checked (must handle):    IOException, SQLException → recoverable
Unchecked (runtime):      NPE, IllegalArgument → programming errors
Error (don't catch):      OOM, StackOverflow → JVM problems

Modern practice: prefer unchecked (Spring does this)
Resource cleanup: always use try-with-resources
```

---

## Design Patterns Cheat Sheet → [[design_patterns_in_java]]

```
Pattern          One-liner                          Java/Spring Example
──────────────────────────────────────────────────────────────────────────
Singleton        One instance                       Spring beans (default)
Builder          Step-by-step construction          HttpClient.newBuilder()
Factory          Create without coupling            Calendar.getInstance()
Adapter          Convert interface                  Arrays.asList()
Decorator        Wrap for extra behavior            BufferedInputStream
Facade           Simplify complex system            JdbcTemplate
Proxy            Control access / caching           @Transactional
Strategy         Swappable algorithms               Comparator
Observer         Event notification                 @EventListener
State            Behavior per state                 Order state machine
Command          Encapsulate actions                Runnable, Callable
Template Method  Fixed structure, variable steps    HttpServlet.doGet()
```

---

## Top 30 Interview Questions

### Collections (10)

| # | Question | Quick Answer |
|---|----------|-------------|
| 1 | How does HashMap work? | Array of buckets, hash → index, linked list/tree for collisions |
| 2 | What happens on hash collision? | Linked list (8+ → tree). equals() compares in bucket. |
| 3 | HashMap vs ConcurrentHashMap? | CHM: node-level CAS locking, no null keys, atomic compute |
| 4 | When does HashMap treeify? | 8+ entries in one bucket → red-black tree (Java 8+) |
| 5 | How to implement LRU cache? | LinkedHashMap with accessOrder=true + removeEldestEntry |
| 6 | ArrayList vs LinkedList? | ArrayList wins 95%: cache-friendly, O(1) random access |
| 7 | equals-hashCode contract? | If equals() true → hashCode MUST be same. Reverse not required. |
| 8 | fail-fast vs fail-safe? | HashMap iterator: fails on modification. CHM: works on snapshot. |
| 9 | How does PriorityQueue work? | Binary min-heap as array. O(log n) add/remove, O(1) peek. |
| 10 | TreeMap key methods? | floorKey, ceilingKey, subMap — O(log n), red-black tree |

### Concurrency (10)

| # | Question | Quick Answer |
|---|----------|-------------|
| 11 | volatile vs synchronized? | volatile: visibility. synchronized: visibility + atomicity + mutual exclusion |
| 12 | What is deadlock? How to prevent? | Circular lock dependency. Fix: acquire locks in same order always |
| 13 | synchronized vs ReentrantLock? | Lock adds: tryLock, fairness, multiple conditions, interruptible |
| 14 | How does CAS work? | CPU instruction: "change X→Y only if X==expected". Retry on fail. |
| 15 | CompletableFuture vs Future? | CF: chainable (thenApply, thenCompose), non-blocking, composable |
| 16 | CountDownLatch vs CyclicBarrier? | CDL: one waits for N (one-time). CB: N wait for each other (reusable) |
| 17 | What are Virtual Threads? | JVM-managed lightweight threads (~1KB). For I/O-bound work. Java 21. |
| 18 | Thread pool sizing? | CPU-bound: cores. I/O-bound: cores × (1 + wait/compute) |
| 19 | ThreadLocal danger? | With thread pools: leak if not removed. ALWAYS call remove(). |
| 20 | start() vs run()? | start() → new thread. run() → same thread (just a method call!) |

### JVM, Spring, Patterns (10)

| # | Question | Quick Answer |
|---|----------|-------------|
| 21 | JVM memory areas? | Heap (objects), Stack (per-thread), Metaspace (classes) |
| 22 | How does G1 GC work? | Region-based, targets pause time, collects garbage-first regions |
| 23 | Can Java leak memory? | Yes: static collections, unclosed resources, ThreadLocal in pools |
| 24 | What is DI? Why use it? | Framework injects dependencies. Loose coupling, testable, swappable. |
| 25 | @Transactional gotchas? | Private methods: won't work. Self-invocation: bypasses proxy. |
| 26 | Constructor vs field injection? | Constructor: immutable, testable, explicit. Field: hidden dependency. |
| 27 | N+1 query problem? | Lazy loading in loop = N extra queries. Fix: JOIN FETCH. |
| 28 | Strategy vs State pattern? | Strategy: externally injected. State: transitions internally. |
| 29 | Checked vs unchecked exceptions? | Checked: recoverable, must handle. Unchecked: programming errors. |
| 30 | orElse vs orElseGet? | orElse: always evaluates arg. orElseGet: lazy (only when empty). |

---

## Machine Coding Checklist

```
FIRST 5 MINUTES:
□ Spring Boot project (web + jpa + h2 + validation)
□ Package structure: controller/service/repository/model/dto/exception
□ Global exception handler (copy from notes)
□ application.yml with H2

NEXT 10 MINUTES:
□ Identify entities and relationships
□ Define API contracts (endpoints, DTOs)
□ Identify core business logic

NEXT 40-50 MINUTES:
□ Entity classes with JPA annotations
□ Repository interfaces (extends JpaRepository)
□ Service layer (business logic HERE, not in controller)
□ Controller layer (thin — delegates to service)
□ DTOs with validation (@Valid, @NotBlank, @Email)

LAST 10 MINUTES:
□ Test happy path (curl/Postman)
□ Edge cases and error handling
□ Clean up code
```

---

## Top 15 Mistakes That Fail Candidates

1. **Using == instead of .equals()** for String/Integer comparison
2. **NullPointerException** in live coding (not checking null)
3. **Catching generic Exception** instead of specific type
4. **Field injection** instead of constructor injection
5. **Not knowing HashMap internals** (instant rejection at many companies)
6. **Business logic in controller** (should be in service layer)
7. **Everything returns 200** (wrong HTTP status codes)
8. **Ignoring thread safety** in concurrent code
9. **Optional.get() without checking** (NoSuchElementException)
10. **N+1 queries** in JPA (loop of lazy loads)
11. **Mutable shared state without synchronization**
12. **Not knowing any pattern beyond Singleton**
13. **Using raw types** instead of generics (List instead of List<String>)
14. **Not closing resources** (connections, streams, files)
15. **Integer overflow** in binary search: (lo+hi)/2 instead of lo+(hi-lo)/2

---

## DSA Quick Reference (Java-specific) → [[java_essentials_for_dsa]]

```
Sort array:         Arrays.sort(arr)
Sort list:          list.sort(Comparator.comparing(...))
Min heap:           new PriorityQueue<>()
Max heap:           new PriorityQueue<>(Comparator.reverseOrder())
Stack:              new ArrayDeque<>() → push/pop/peek
Queue:              new ArrayDeque<>() → offer/poll/peek
Frequency map:      map.merge(key, 1, Integer::sum)
Custom sort:        (a, b) -> Integer.compare(a[1], b[1])
Binary search:      lo + (hi - lo) / 2
Infinity:           Integer.MAX_VALUE
Pair:               record Pair(int a, int b) {}
Graph adj list:     List<List<Integer>>
String builder:     StringBuilder (for loops!)
Char to int:        ch - 'a' (alphabet) or ch - '0' (digit)
```

---

## Links to Detailed Files

| Topic | File | Lines |
|-------|------|-------|
| DSA Essentials | [[java_essentials_for_dsa]] | ~1,000 |
| Collections Internals | [[collections_internals]] | ~700 |
| Concurrency | [[concurrency_and_threading]] | ~900 |
| Streams & Functional | [[streams_and_functional]] | ~700 |
| JVM & Memory | [[jvm_and_memory]] | ~600 |
| Spring Boot | [[spring_boot_production]] | ~600 |
| Exceptions & Optional | [[exception_handling_and_optional]] | ~600 |
| Design Patterns | [[design_patterns_in_java]] | ~700 |
