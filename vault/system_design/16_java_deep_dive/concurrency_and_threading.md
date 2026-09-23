#java #concurrency #threading #interview

# Concurrency and Threading

> How Java handles multiple things at once — the most asked topic at SDE-2 interviews.

---

## Definitions

| Term | Meaning |
|------|---------|
| **Thread** | Lightweight unit of execution within a process — has its own stack but shares heap |
| **Process** | An independent program with its own memory space |
| **Concurrency** | Multiple tasks making progress (may not be simultaneous — interleaving) |
| **Parallelism** | Multiple tasks running at the exact same time (requires multiple CPU cores) |
| **Race Condition** | Bug where outcome depends on unpredictable timing of thread execution |
| **Critical Section** | Code that accesses shared mutable state — must be protected |
| **Mutex/Lock** | Mechanism that ensures only one thread enters a critical section at a time |
| **Deadlock** | Two threads each waiting for the other's lock — both stuck forever |
| **volatile** | Keyword that ensures a variable is always read from main memory, not CPU cache |
| **CAS** | Compare-And-Swap — atomic CPU instruction: "change X to Y only if X is currently Z" |
| **Thread Pool** | Group of reusable threads that execute tasks from a queue |
| **Future** | Placeholder for a result that will be available later |
| **Monitor** | Java's built-in synchronization mechanism (every object has one) |

---

## Why Concurrency?

```
Without concurrency:
┌─────────────────────────────────────────────┐
│ Thread 1: [Handle Request A][Handle Request B][Handle Request C] │
└─────────────────────────────────────────────┘
→ Users wait in line. Request C waits for A and B to finish.

With concurrency:
┌─────────────────────────────┐
│ Thread 1: [Handle Request A] │
│ Thread 2: [Handle Request B] │
│ Thread 3: [Handle Request C] │
└─────────────────────────────┘
→ All requests handled simultaneously.
```

### Concurrency vs Parallelism

```
Concurrency (1 CPU core):          Parallelism (4 CPU cores):
  ┌─┐┌─┐┌─┐┌─┐┌─┐┌─┐               ┌───────┐
  │A││B││A││B││A││B│               Core 1: │  A    │
  └─┘└─┘└─┘└─┘└─┘└─┘               Core 2: │  B    │
  Interleaving (fast switching)      Core 3: │  C    │
  LOOKS simultaneous                 Core 4: │  D    │
  but isn't really                           └───────┘
                                     Actually simultaneous
```

---

## Thread Basics

### Creating Threads

```java
// Method 1: Extend Thread (avoid — can't extend other classes)
class MyThread extends Thread {
    public void run() {
        System.out.println("Thread: " + Thread.currentThread().getName());
    }
}
new MyThread().start();

// Method 2: Implement Runnable (preferred — more flexible)
Runnable task = () -> System.out.println("Running in: " + Thread.currentThread().getName());
new Thread(task).start();

// Method 3: Callable (when you need a return value)
Callable<Integer> callable = () -> {
    Thread.sleep(1000);
    return 42;
};
```

### Thread Lifecycle

```
              start()
  NEW ──────────────→ RUNNABLE ←──────── RUNNING
                        ↑  ↓               ↓
                        │  │ synchronized   │
                        │  ↓ (lock busy)    │ run() completes
                        │ BLOCKED           │ or exception
                        │  ↑               ↓
                        │  │         TERMINATED
                        │  │
                  notify()│
                        │  │ wait()
                        │  ↓
                       WAITING
                        │  ↑
                        │  │ sleep(ms)
                        │  ↓
                    TIMED_WAITING

States:
- NEW: Thread created but start() not called yet
- RUNNABLE: Ready to run or currently running
- BLOCKED: Waiting to acquire a lock (synchronized)
- WAITING: Waiting indefinitely (wait(), join())
- TIMED_WAITING: Waiting with timeout (sleep(), wait(ms))
- TERMINATED: run() completed or exception thrown
```

### Key Thread Methods

```java
Thread t = new Thread(() -> {
    // work...
});

t.start();               // Start thread (calls run() in new thread)
// t.run();              // ❌ DON'T: runs in CURRENT thread, not new one!

t.join();                // Current thread WAITS for t to finish
t.join(5000);            // Wait max 5 seconds

Thread.sleep(1000);      // Pause current thread for 1 second
Thread.yield();          // Hint: let other threads run (rarely used)
t.interrupt();           // Request thread to stop (sets interrupt flag)
t.isInterrupted();       // Check if interrupted
Thread.currentThread();  // Get reference to current thread

// Daemon threads: die when all user threads finish
t.setDaemon(true);       // Must be set BEFORE start()
// Use for: background tasks (GC is a daemon thread)
// ⚠️ Daemon threads may not complete their work!
```

---

## The Shared State Problem

### Why Synchronization Matters

```java
// Two threads incrementing a shared counter
class Counter {
    int count = 0;  // Shared state

    void increment() {
        count++;  // NOT atomic! Actually 3 steps:
                  // 1. READ count from memory
                  // 2. ADD 1
                  // 3. WRITE back to memory
    }
}

// Without synchronization:
Counter c = new Counter();
Thread t1 = new Thread(() -> { for (int i = 0; i < 100000; i++) c.increment(); });
Thread t2 = new Thread(() -> { for (int i = 0; i < 100000; i++) c.increment(); });
t1.start(); t2.start(); t1.join(); t2.join();
System.out.println(c.count);  // Expected: 200000, Actual: ~156789 (random!)
```

```
Why? Race condition:

Thread 1                 Thread 2               count (in memory)
────────                 ────────               ─────
READ count (= 5)                                5
                         READ count (= 5)       5
ADD 1 (= 6)                                     5
                         ADD 1 (= 6)            5
WRITE 6                                          6
                         WRITE 6                 6  ← Lost update!
                                                    Should be 7!
```

---

## synchronized Keyword

### How It Works

```java
// synchronized method: locks on 'this' object
class Counter {
    int count = 0;

    synchronized void increment() {  // Only 1 thread can execute at a time
        count++;
    }
}

// synchronized block: locks on specific object (more control)
class Counter {
    int count = 0;
    private final Object lock = new Object();

    void increment() {
        synchronized (lock) {  // Only lock the critical section
            count++;
        }
        // Other code can run concurrently (not locked)
    }
}

// static synchronized: locks on the Class object
class Counter {
    static int count = 0;

    static synchronized void increment() {  // Locks Counter.class
        count++;
    }
}
```

### Monitor: Java's Built-in Lock

```
Every Java object has:
┌──────────────────────┐
│      Object          │
├──────────────────────┤
│  Mark Word:          │
│  - Lock state        │
│  - Owner thread ID   │
│  - Wait set          │
├──────────────────────┤
│  Actual data         │
└──────────────────────┘

synchronized(obj) {
  // Acquires obj's monitor lock
  // Only one thread at a time
}
// Releases lock automatically (even on exception)
```

### wait() and notify()

```java
// Producer-Consumer with synchronized
class SharedQueue {
    private final Queue<Integer> queue = new LinkedList<>();
    private final int capacity = 10;

    synchronized void produce(int item) throws InterruptedException {
        while (queue.size() == capacity) {
            wait();  // Release lock, wait until notified
        }
        queue.add(item);
        notifyAll();  // Wake up consumers
    }

    synchronized int consume() throws InterruptedException {
        while (queue.isEmpty()) {
            wait();  // Release lock, wait until notified
        }
        int item = queue.poll();
        notifyAll();  // Wake up producers
        return item;
    }
}
```

---

## Locks (java.util.concurrent.locks)

### Why: synchronized Is Limited

```
synchronized limitations:
1. Can't try to acquire lock without blocking (no tryLock)
2. Can't interrupt a thread waiting for lock
3. No fairness control (some threads may starve)
4. Can't have multiple conditions
5. Lock released only when block exits (can't release manually)

ReentrantLock fixes ALL of these.
```

### ReentrantLock

```java
import java.util.concurrent.locks.ReentrantLock;

class Counter {
    private int count = 0;
    private final ReentrantLock lock = new ReentrantLock();

    void increment() {
        lock.lock();          // Acquire lock
        try {
            count++;
        } finally {
            lock.unlock();    // ALWAYS unlock in finally!
        }
    }

    void tryIncrement() {
        if (lock.tryLock()) {        // Try without blocking
            try {
                count++;
            } finally {
                lock.unlock();
            }
        } else {
            System.out.println("Lock busy, skipping");
        }
    }
}

// Fair lock: threads acquire in FIFO order (slightly slower)
ReentrantLock fairLock = new ReentrantLock(true);
```

### ReadWriteLock

```java
// Multiple readers OR one writer (not both)
ReadWriteLock rwLock = new ReentrantReadWriteLock();

// Read lock: multiple threads can hold simultaneously
rwLock.readLock().lock();
try {
    return data;  // Multiple readers OK
} finally {
    rwLock.readLock().unlock();
}

// Write lock: exclusive — blocks all readers and writers
rwLock.writeLock().lock();
try {
    data = newValue;  // Only one writer
} finally {
    rwLock.writeLock().unlock();
}

// Use when: reads >> writes (e.g., cache, config)
```

---

## volatile Keyword

### The CPU Cache Problem

```
Without volatile:
┌─────────┐    ┌─────────┐    ┌─────────────┐
│ Thread 1 │    │ Thread 2 │    │ Main Memory │
│ CPU Cache│    │ CPU Cache│    │             │
│ flag=true│    │ flag=fals│    │  flag=true  │
└─────────┘    └─────────┘    └─────────────┘
Thread 2 might never see the update! (reads from its own cache)

With volatile:
┌─────────┐    ┌─────────┐    ┌─────────────┐
│ Thread 1 │    │ Thread 2 │    │ Main Memory │
│ (bypass) │    │ (bypass) │    │  flag=true  │
└─────────┘    └─────────┘    └─────────────┘
Every read goes to main memory. Every write goes to main memory.
```

```java
// Common use: stop flag
class Worker implements Runnable {
    private volatile boolean running = true;  // volatile = visible to all threads

    public void run() {
        while (running) {  // Always reads latest value
            // do work
        }
    }

    public void stop() {
        running = false;  // Immediately visible to run() thread
    }
}
```

### volatile Does NOT Make Compound Operations Atomic

```java
volatile int count = 0;

// ❌ NOT THREAD-SAFE: count++ is still 3 operations
count++;  // READ + INCREMENT + WRITE — not atomic even with volatile!

// ✅ For atomic increments: use AtomicInteger
AtomicInteger count = new AtomicInteger(0);
count.incrementAndGet();  // Truly atomic
```

---

## Atomic Classes

### Why: volatile + Atomicity Combined

```java
import java.util.concurrent.atomic.*;

// AtomicInteger: thread-safe integer without locks
AtomicInteger counter = new AtomicInteger(0);
counter.incrementAndGet();     // atomic ++counter
counter.decrementAndGet();     // atomic --counter
counter.addAndGet(5);          // atomic counter += 5
counter.compareAndSet(5, 10);  // If counter==5, set to 10 (CAS)
counter.get();                 // Read current value

// AtomicReference: thread-safe reference
AtomicReference<String> ref = new AtomicReference<>("hello");
ref.compareAndSet("hello", "world");  // Atomic swap

// AtomicBoolean
AtomicBoolean flag = new AtomicBoolean(false);
flag.compareAndSet(false, true);  // Atomic: set true only if currently false
```

### How CAS Works

```
Compare-And-Swap (hardware-level atomic operation):

CAS(memory_location, expected_value, new_value):
  1. Read current value at memory_location
  2. If current == expected: write new_value → return true
  3. If current != expected: do nothing → return false
  All 3 steps are ONE atomic CPU instruction!

Example: AtomicInteger.incrementAndGet()
  Loop:
    1. Read current value (e.g., 5)
    2. CAS(count, 5, 6)
    3. If succeeded → return 6
    4. If failed (another thread changed it) → retry from step 1
```

---

## ExecutorService (Thread Pools)

### Why: Don't Create Threads Manually

```
Problem with new Thread():
- Creating a thread costs ~1ms + ~1MB stack memory
- 10,000 requests → 10,000 threads → 10GB memory → crash
- No reuse — thread dies after task completes

Thread pool solution:
- Create N threads once
- Tasks go into a queue
- Threads pick tasks from queue, execute, pick next
- Threads are REUSED
```

```
Visual: Thread Pool
┌──────────────────────────────────────────┐
│              Task Queue                   │
│  [Task1] [Task2] [Task3] [Task4] [Task5] │
└──────────────────┬───────────────────────┘
                   │
       ┌───────────┼───────────┐
       ▼           ▼           ▼
   ┌────────┐  ┌────────┐  ┌────────┐
   │Thread 1│  │Thread 2│  │Thread 3│
   │ (busy) │  │ (idle) │  │ (busy) │
   └────────┘  └────────┘  └────────┘
```

### Types of Thread Pools

```java
import java.util.concurrent.*;

// 1. FixedThreadPool: exactly N threads
// Use for: known concurrency level (e.g., database connections)
ExecutorService fixed = Executors.newFixedThreadPool(4);

// 2. CachedThreadPool: creates threads as needed, reuses idle ones
// Use for: many short-lived tasks
ExecutorService cached = Executors.newCachedThreadPool();

// 3. SingleThreadExecutor: exactly 1 thread (tasks run sequentially)
// Use for: sequential task processing, event loop
ExecutorService single = Executors.newSingleThreadExecutor();

// 4. ScheduledThreadPool: delayed or periodic tasks
ScheduledExecutorService scheduled = Executors.newScheduledThreadPool(2);
scheduled.schedule(() -> System.out.println("delayed"), 5, TimeUnit.SECONDS);
scheduled.scheduleAtFixedRate(() -> System.out.println("periodic"), 0, 1, TimeUnit.SECONDS);

// 5. WorkStealingPool (Java 8+): work-stealing fork-join pool
ExecutorService stealing = Executors.newWorkStealingPool();
```

### Using ExecutorService

```java
ExecutorService executor = Executors.newFixedThreadPool(4);

// Submit task (Runnable — no return value)
executor.execute(() -> System.out.println("Task running"));

// Submit task (Callable — with return value)
Future<Integer> future = executor.submit(() -> {
    Thread.sleep(1000);
    return 42;
});

// Get result (blocks until ready)
int result = future.get();             // Blocks indefinitely
int result = future.get(5, TimeUnit.SECONDS);  // Blocks max 5s

// Proper shutdown
executor.shutdown();                  // Stop accepting new tasks, finish existing
// executor.shutdownNow();           // Interrupt running tasks (use with caution)
executor.awaitTermination(10, TimeUnit.SECONDS);  // Wait for completion
```

### Thread Pool Sizing Formula

```
Optimal pool size = CPU cores × (1 + Wait time / Compute time)

CPU-bound tasks (computation):
  pool size ≈ CPU cores (e.g., 8 cores → 8 threads)

I/O-bound tasks (network, database):
  pool size ≈ CPU cores × (1 + 50) = much larger
  (because threads spend most time waiting)

Example: 8 cores, tasks spend 90% time waiting for DB
  pool size = 8 × (1 + 0.9/0.1) = 8 × 10 = 80 threads
```

---

## CompletableFuture

### Why: Future.get() Blocks

```java
// Problem with Future:
Future<String> future = executor.submit(() -> callAPI());
String result = future.get();  // ❌ BLOCKS current thread until done!
// Can't chain operations, can't combine futures easily

// CompletableFuture: chain async operations without blocking
CompletableFuture.supplyAsync(() -> callAPI())
    .thenApply(result -> parse(result))
    .thenAccept(parsed -> save(parsed))
    .exceptionally(error -> { log(error); return null; });
// ✅ Non-blocking! Each step runs when previous completes.
```

### Key Operations

```java
// Create
CompletableFuture<String> cf = CompletableFuture.supplyAsync(() -> "Hello");

// Transform (like map)
CompletableFuture<Integer> length = cf.thenApply(s -> s.length());

// Chain async calls (like flatMap)
CompletableFuture<String> chained = cf.thenCompose(s ->
    CompletableFuture.supplyAsync(() -> s + " World")
);

// Combine two independent futures
CompletableFuture<String> f1 = CompletableFuture.supplyAsync(() -> "Hello");
CompletableFuture<String> f2 = CompletableFuture.supplyAsync(() -> "World");
CompletableFuture<String> combined = f1.thenCombine(f2, (a, b) -> a + " " + b);

// Wait for ALL futures
CompletableFuture<Void> all = CompletableFuture.allOf(f1, f2, f3);
all.thenRun(() -> System.out.println("All done!"));

// Wait for FIRST completed
CompletableFuture<Object> any = CompletableFuture.anyOf(f1, f2, f3);

// Error handling
cf.exceptionally(ex -> "default")           // On error, return default
  .thenAccept(System.out::println);

cf.handle((result, error) -> {              // Handle both success and error
    if (error != null) return "error: " + error.getMessage();
    return result;
});
```

### Real-World: Call 3 APIs in Parallel

```java
// Without CompletableFuture: sequential, 3 seconds total
String user = getUser(userId);          // 1 second
String orders = getOrders(userId);      // 1 second
String recommendations = getRecs(userId); // 1 second

// With CompletableFuture: parallel, 1 second total!
CompletableFuture<String> userFuture = CompletableFuture.supplyAsync(() -> getUser(userId));
CompletableFuture<String> ordersFuture = CompletableFuture.supplyAsync(() -> getOrders(userId));
CompletableFuture<String> recsFuture = CompletableFuture.supplyAsync(() -> getRecs(userId));

CompletableFuture.allOf(userFuture, ordersFuture, recsFuture).join();

String user = userFuture.get();
String orders = ordersFuture.get();
String recs = recsFuture.get();
```

---

## Synchronization Utilities

### CountDownLatch: Wait for N Tasks

```java
// "Main thread waits until 3 workers finish"
CountDownLatch latch = new CountDownLatch(3);

for (int i = 0; i < 3; i++) {
    executor.submit(() -> {
        doWork();
        latch.countDown();  // Signal: "I'm done" (count: 3→2→1→0)
    });
}

latch.await();  // Main thread blocks until count reaches 0
System.out.println("All 3 workers done!");

// ⚠️ One-time use: can't reset count. Use CyclicBarrier for reusable.
```

### CyclicBarrier: N Threads Wait for Each Other

```java
// "3 threads do Phase 1, ALL wait, then do Phase 2"
CyclicBarrier barrier = new CyclicBarrier(3, () -> {
    System.out.println("All threads reached barrier!");
});

for (int i = 0; i < 3; i++) {
    executor.submit(() -> {
        doPhase1();
        barrier.await();   // Wait for all 3 threads
        doPhase2();
        barrier.await();   // Can reuse! (cyclic)
        doPhase3();
    });
}
```

### Semaphore: Limit Concurrent Access

```java
// "Only 3 threads can access the database simultaneously"
Semaphore semaphore = new Semaphore(3);

void accessDatabase() throws InterruptedException {
    semaphore.acquire();  // Wait if 3 threads already inside
    try {
        // Only 3 threads here at any time
        queryDatabase();
    } finally {
        semaphore.release();  // Allow another thread in
    }
}
```

### Comparison

```
                 CountDownLatch        CyclicBarrier          Semaphore
What it does     Wait for N events     N threads sync up      Limit N concurrent
Reusable?        ❌ No (one-time)      ✅ Yes (cyclic)        ✅ Yes
Who waits?       One thread            All N threads          Any thread
Use case         "Wait for init"       "Phase sync"           "Connection pool"
```

---

## Virtual Threads (Java 21)

### Why: Traditional Threads Are Expensive

```
Traditional thread (Platform thread):
- 1 Java thread = 1 OS thread
- Each OS thread: ~1MB stack memory
- 10,000 threads = 10GB RAM
- Context switching is expensive

Virtual thread:
- Lightweight, managed by JVM (not OS)
- ~1KB stack memory (grows as needed)
- 1,000,000 virtual threads = feasible
- Scheduled onto a small pool of platform threads
```

```java
// Creating virtual threads
Thread.ofVirtual().start(() -> {
    System.out.println("Virtual thread: " + Thread.currentThread());
});

// Virtual thread executor (one virtual thread per task)
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    for (int i = 0; i < 100_000; i++) {
        executor.submit(() -> {
            Thread.sleep(1000);  // Blocking is CHEAP with virtual threads
            return "done";
        });
    }
}  // Auto-shutdown

// When to use:
// ✅ I/O-bound tasks (HTTP calls, DB queries) — blocking is cheap
// ❌ CPU-bound tasks (computation) — no benefit, use platform threads
```

---

## ThreadLocal

### Why: Per-Thread Storage

```java
// Problem: passing user context through 10 method calls is ugly
void handleRequest(User user) {
    service.doSomething(user);  // Pass user everywhere?
    // repository.save(user, data);
    // logger.log(user, message);
}

// Solution: ThreadLocal stores value per-thread
ThreadLocal<User> currentUser = new ThreadLocal<>();

void handleRequest(User user) {
    currentUser.set(user);      // Set for this thread
    service.doSomething();       // No need to pass user!
    currentUser.remove();        // ⚠️ ALWAYS remove after use!
}

void doSomething() {
    User user = currentUser.get();  // Gets this thread's value
}
```

### Memory Leak with Thread Pools

```
⚠️ DANGER: ThreadLocal + Thread Pool = Memory Leak

Thread pool reuses threads. If you don't remove(), the value stays
even when the thread handles a different request.

Thread 1: handles User A → sets ThreadLocal → DOESN'T remove
Thread 1: handles User B → ThreadLocal still has User A's data! 💥

ALWAYS:
try {
    threadLocal.set(value);
    // work
} finally {
    threadLocal.remove();  // CRITICAL!
}
```

---

## Common Interview Traps

### 1. start() vs run()

```java
Thread t = new Thread(() -> System.out.println(Thread.currentThread().getName()));

t.start();  // ✅ Runs in NEW thread: "Thread-0"
t.run();    // ❌ Runs in CURRENT thread: "main" — just a normal method call!
```

### 2. Deadlock

```java
// Thread 1: lock A → lock B
// Thread 2: lock B → lock A
// Both waiting for each other → deadlock!

Object lockA = new Object();
Object lockB = new Object();

// Thread 1
new Thread(() -> {
    synchronized (lockA) {
        Thread.sleep(100);
        synchronized (lockB) { /* work */ }  // Waiting for lockB
    }
}).start();

// Thread 2
new Thread(() -> {
    synchronized (lockB) {
        Thread.sleep(100);
        synchronized (lockA) { /* work */ }  // Waiting for lockA
    }
}).start();

// Prevention: always acquire locks in SAME ORDER
// Both threads: lockA first, then lockB
```

### 3. Double-Checked Locking Without volatile

```java
// Singleton pattern — BROKEN without volatile
class Singleton {
    private static Singleton instance;  // ❌ Missing volatile!

    static Singleton getInstance() {
        if (instance == null) {               // Check 1
            synchronized (Singleton.class) {
                if (instance == null) {        // Check 2
                    instance = new Singleton(); // Not atomic! May return
                }                              // partially constructed object
            }
        }
        return instance;
    }
}

// ✅ FIX: add volatile
private static volatile Singleton instance;
// volatile prevents instruction reordering → object fully constructed before visible
```

### 4. synchronized on Wrong Object

```java
// ❌ WRONG: new Object() each time → different lock each time!
void broken() {
    synchronized (new Object()) {  // Useless! Each call gets different lock
        count++;
    }
}

// ❌ WRONG: Integer pool cache causes shared lock
synchronized (Integer.valueOf(1)) {  // Same object for all threads! Unexpected behavior
    // ...
}

// ✅ CORRECT: lock on a fixed, private object
private final Object lock = new Object();
void correct() {
    synchronized (lock) {
        count++;
    }
}
```

### 5. Thread Pool Exhaustion

```java
// All threads busy waiting for sub-tasks → deadlock
ExecutorService pool = Executors.newFixedThreadPool(2);

pool.submit(() -> {
    Future<?> sub1 = pool.submit(() -> "sub1");  // Uses one of 2 threads
    Future<?> sub2 = pool.submit(() -> "sub2");  // ❌ No threads left!
    sub1.get();  // Blocks waiting for sub1, which is queued behind sub2
    sub2.get();  // sub2 is queued but no thread available
    // DEADLOCK: parent tasks hold threads, sub-tasks need threads
});

// Fix: use separate pools for parent and child tasks
```

### 6. Future.get() Without Timeout

```java
Future<String> future = executor.submit(() -> callSlowAPI());
String result = future.get();  // ❌ Blocks FOREVER if API never responds!

String result = future.get(5, TimeUnit.SECONDS);  // ✅ Timeout after 5s
// Throws TimeoutException if not done in 5 seconds
```

---

## When To Use What

```
Need                                → Use This
────────────────────────────────────────────────────────────
Simple mutual exclusion             → synchronized
tryLock / fairness / conditions     → ReentrantLock
Read-heavy, rare writes            → ReadWriteLock
Boolean flag across threads         → volatile boolean
Atomic counter                      → AtomicInteger
Fixed number of concurrent tasks    → FixedThreadPool
Many short I/O tasks                → CachedThreadPool or VirtualThreads
One task at a time (ordered)        → SingleThreadExecutor
Delayed/periodic tasks              → ScheduledThreadPool
Async pipelines                     → CompletableFuture
Wait for N tasks to complete        → CountDownLatch
N threads sync at barrier           → CyclicBarrier
Limit concurrent resource access    → Semaphore
Per-thread context                  → ThreadLocal (always remove!)
Millions of I/O tasks               → Virtual Threads (Java 21)
Thread-safe map                     → ConcurrentHashMap
Thread-safe queue                   → ConcurrentLinkedQueue
Thread-safe list                    → CopyOnWriteArrayList
```

---

## Links

- [[collections_internals]] — ConcurrentHashMap and thread-safe collections
- [[jvm_and_memory]] — Thread stack, heap, Java Memory Model
- [[spring_boot_production]] — Thread pools in Spring Boot, @Async
- [[design_patterns_in_java]] — Command pattern with Runnable/Callable
- [[interview_quick_reference]] — Quick revision cheat sheet
- [[03_design_patterns/distributed_locking]] — Distributed version of locking
- [[03_design_patterns/leader_election]] — Coordination in distributed systems
