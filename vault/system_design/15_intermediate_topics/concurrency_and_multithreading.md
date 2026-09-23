#system-design #intermediate #java #concurrency

# Concurrency & Multithreading — What Every Java Developer Must Know

> Critical for Indian product company interviews. Flipkart, Swiggy, PhonePe test this heavily.

---

## Why This Matters for System Design

Every building block you've learned (databases, caches, queues) deals with concurrency internally. Understanding concurrency means understanding WHY systems behave the way they do under load.

---

## Thread Safety Fundamentals

### Race Condition

Two threads modifying shared state without synchronization:

```java
// BROKEN: Race condition
public class Counter {
    private int count = 0;

    public void increment() {
        count++;  // NOT atomic! Read → Increment → Write (3 steps)
    }
}

// Thread A reads count=5, Thread B reads count=5
// Thread A writes count=6, Thread B writes count=6
// Expected: 7. Actual: 6. Lost update!
```

### Fix 1: synchronized

```java
public class Counter {
    private int count = 0;

    public synchronized void increment() {
        count++;  // Only one thread enters at a time
    }
}
```

### Fix 2: AtomicInteger (Better — lock-free)

```java
public class Counter {
    private final AtomicInteger count = new AtomicInteger(0);

    public void increment() {
        count.incrementAndGet();  // CAS (Compare-And-Swap) — hardware-level atomic
    }
}
```

### Fix 3: ConcurrentHashMap

```java
// BROKEN: HashMap is not thread-safe
Map<String, Integer> map = new HashMap<>();

// FIXED: ConcurrentHashMap — lock striping (locks segments, not entire map)
Map<String, Integer> map = new ConcurrentHashMap<>();
map.compute("key", (k, v) -> v == null ? 1 : v + 1);  // Atomic read-modify-write
```

---

## Java Concurrency Toolkit

### ExecutorService (Thread Pool)

Never create threads manually. Use pools:

```java
// Fixed pool: exactly 10 threads (web server handling requests)
ExecutorService pool = Executors.newFixedThreadPool(10);

// Cached pool: grows as needed, reuses idle threads (short-lived tasks)
ExecutorService pool = Executors.newCachedThreadPool();

// Scheduled: run tasks at intervals (health checks, cleanup)
ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(2);
scheduler.scheduleAtFixedRate(() -> cleanupExpired(), 0, 1, TimeUnit.MINUTES);

// Submit tasks
Future<String> result = pool.submit(() -> {
    return fetchFromDatabase(userId);
});
String value = result.get(5, TimeUnit.SECONDS);  // Block with timeout
```

### CompletableFuture (Async Composition)

```java
// Chain async operations (like JavaScript Promises)
CompletableFuture<OrderResponse> response =
    CompletableFuture.supplyAsync(() -> validateOrder(request))
        .thenApplyAsync(order -> reserveInventory(order))
        .thenApplyAsync(order -> processPayment(order))
        .thenApplyAsync(order -> confirmOrder(order))
        .exceptionally(ex -> handleFailure(ex));

// Fan-out: parallel calls to multiple services
CompletableFuture<User> userFuture = CompletableFuture.supplyAsync(() -> getUser(id));
CompletableFuture<List<Order>> ordersFuture = CompletableFuture.supplyAsync(() -> getOrders(id));
CompletableFuture<List<Recommendation>> recsFuture = CompletableFuture.supplyAsync(() -> getRecs(id));

// Wait for all, combine results
CompletableFuture.allOf(userFuture, ordersFuture, recsFuture).join();
return new Dashboard(userFuture.get(), ordersFuture.get(), recsFuture.get());
```

### ReadWriteLock (Multiple Readers, Single Writer)

```java
private final ReadWriteLock lock = new ReentrantReadWriteLock();
private Map<String, Object> cache = new HashMap<>();

public Object get(String key) {
    lock.readLock().lock();  // Multiple threads can read simultaneously
    try {
        return cache.get(key);
    } finally {
        lock.readLock().unlock();
    }
}

public void put(String key, Object value) {
    lock.writeLock().lock();  // Only one writer, blocks all readers
    try {
        cache.put(key, value);
    } finally {
        lock.writeLock().unlock();
    }
}
```

### BlockingQueue (Producer-Consumer)

```java
BlockingQueue<Job> queue = new LinkedBlockingQueue<>(1000);  // Bounded!

// Producer
queue.put(new Job("process_image", payload));  // Blocks if queue full (backpressure!)

// Consumer
Job job = queue.take();  // Blocks if queue empty (waits for work)
process(job);
```

---

## Concurrency Patterns in System Design

| Pattern | Where Used | Java Tool |
|---------|-----------|-----------|
| Thread pool for request handling | Web servers (Tomcat) | ExecutorService |
| Async fan-out to multiple services | API gateway aggregation | CompletableFuture.allOf() |
| Producer-consumer | Message processing | BlockingQueue |
| Read-write separation | Cache implementations | ReadWriteLock |
| Atomic counters | Rate limiting, metrics | AtomicInteger/Long |
| Lock-free data structures | High-throughput services | ConcurrentHashMap |
| Scheduled tasks | Cleanup, health checks | ScheduledExecutorService |

---

## Deadlock Prevention

```java
// DEADLOCK: Thread A locks resource1 then resource2
//           Thread B locks resource2 then resource1
// They wait for each other forever.

// Prevention: Always lock resources in the SAME ORDER
// If you need lock A and lock B, always acquire A first, then B.
```

## volatile Keyword

```java
private volatile boolean running = true;  // Guarantees visibility across threads

// Without volatile: Thread B might never see Thread A's update (CPU cache)
// With volatile: Every read goes to main memory
```

---

## Interview Questions on Concurrency

| Question | Key Point |
|----------|-----------|
| "Implement a thread-safe singleton" | Double-checked locking with volatile |
| "Design a connection pool" | BlockingQueue + semaphore |
| "How does ConcurrentHashMap work?" | Lock striping (16 segments by default) |
| "Difference between synchronized and Lock?" | Lock supports tryLock, timeout, multiple conditions |
| "What is a deadlock? How to prevent?" | Consistent lock ordering, timeout, tryLock |
| "volatile vs synchronized?" | volatile = visibility only, synchronized = visibility + atomicity |

## Links

- [[../02_building_blocks/caching]] — Redis is single-threaded to AVOID concurrency issues
- [[../03_design_patterns/distributed_locking]] — Locks across multiple servers
- [[../02_building_blocks/databases_sql]] — Connection pooling uses thread pools
- [[../11_lld/examples/lld_parking_lot]] — synchronized in ParkingSpot.assign()
