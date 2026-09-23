#java #jvm #memory #gc #interview

# JVM and Memory Management

> How Java manages memory — what happens behind `new Object()`, and why your app runs out of memory.

---

## Definitions

| Term | Meaning |
|------|---------|
| **JVM** | Java Virtual Machine — runs Java bytecode on any platform |
| **Bytecode** | Intermediate code (.class files) that JVM interprets/compiles |
| **Heap** | Shared memory area where ALL objects live — managed by garbage collector |
| **Stack** | Per-thread memory for method calls, local variables — LIFO structure |
| **Garbage Collection** | Automatic memory reclamation — JVM finds and frees unused objects |
| **GC Root** | Starting points for reachability analysis (local vars, static vars, active threads) |
| **Young Generation** | Heap area for new objects — most objects die here (fast GC) |
| **Old Generation** | Heap area for long-lived objects — slower GC |
| **Metaspace** | Memory for class metadata (replaced PermGen in Java 8) |
| **JIT** | Just-In-Time compiler — compiles hot bytecode to native machine code at runtime |
| **Stop-the-World** | GC pause where ALL application threads are stopped |

---

## JVM Architecture

```
Your Code                     JVM                          OS
─────────                     ───                          ──
Source.java
    │
    ▼ (javac compiler)
Source.class (bytecode)
    │
    ▼
┌─────────────────────────────────────────┐
│              JVM                         │
│                                          │
│  ┌──────────────┐                        │
│  │ Class Loader  │ Loads .class files     │
│  └──────┬───────┘                        │
│         ▼                                │
│  ┌──────────────────────────────────┐    │
│  │     Runtime Data Areas           │    │
│  │ ┌──────┐ ┌──────┐ ┌──────────┐  │    │
│  │ │ Heap │ │Stack │ │Metaspace │  │    │
│  │ │(shared)│(per   │ │(classes) │  │    │
│  │ │       │thread) │ │          │  │    │
│  │ └──────┘ └──────┘ └──────────┘  │    │
│  └──────────────────────────────────┘    │
│         ▼                                │   ┌────────┐
│  ┌──────────────┐                        │──→│  CPU   │
│  │  Execution   │                        │   └────────┘
│  │  Engine      │                        │
│  │ Interpreter  │                        │
│  │ JIT Compiler │                        │
│  └──────────────┘                        │
└──────────────────────────────────────────┘
```

---

## Memory Layout

```
┌──────────────────────────────────────────────────────────┐
│                      JVM Memory                           │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                    HEAP (shared)                     │  │
│  │                                                     │  │
│  │  ┌─────────────────────────────────┐  ┌───────────┐│  │
│  │  │        Young Generation         │  │    Old    ││  │
│  │  │  ┌──────┐ ┌─────┐ ┌─────┐      │  │Generation ││  │
│  │  │  │ Eden │ │ S0  │ │ S1  │      │  │           ││  │
│  │  │  │      │ │(from)│ │(to) │      │  │ Long-lived││  │
│  │  │  │ New  │ │     │ │     │      │  │ objects   ││  │
│  │  │  │objects│ │Survi│ │Survi│      │  │           ││  │
│  │  │  └──────┘ └─────┘ └─────┘      │  └───────────┘│  │
│  │  └─────────────────────────────────┘               │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │   Stack      │  │   Stack      │  │   Metaspace     │ │
│  │  (Thread 1)  │  │  (Thread 2)  │  │  (Class data)   │ │
│  │              │  │              │  │                  │ │
│  │ ┌──────────┐│  │ ┌──────────┐│  │ Class metadata   │ │
│  │ │ Frame 3  ││  │ │ Frame 2  ││  │ Method data      │ │
│  │ │(current) ││  │ │(current) ││  │ Constant pool    │ │
│  │ ├──────────┤│  │ ├──────────┤│  │                  │ │
│  │ │ Frame 2  ││  │ │ Frame 1  ││  │ Auto-grows       │ │
│  │ ├──────────┤│  │ └──────────┘│  │ (no PermGen)     │ │
│  │ │ Frame 1  ││  │              │  │                  │ │
│  │ │ (main)   ││  │              │  │                  │ │
│  │ └──────────┘│  │              │  │                  │ │
│  └──────────────┘  └──────────────┘  └─────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

### Stack (Per Thread)

```
Each method call creates a STACK FRAME:
┌────────────────────┐
│ Frame: doWork()    │ ← Current method
│ - local vars       │
│ - operand stack    │
│ - return address   │
├────────────────────┤
│ Frame: process()   │ ← Called doWork()
│ - local vars       │
├────────────────────┤
│ Frame: main()      │ ← Called process()
│ - local vars       │
│ - args             │
└────────────────────┘

Key facts:
- Each thread gets its OWN stack (not shared)
- Default size: ~512KB-1MB per thread (-Xss to change)
- LIFO: last method called = first to return
- StackOverflowError: too many frames (deep recursion)
- Stores: primitives, references (NOT objects — those are on heap)
```

### Heap (Shared)

```
ALL objects live on the heap. Variables just hold REFERENCES to them.

Stack:                          Heap:
┌──────────────┐               ┌────────────────┐
│ int x = 42   │ (value)       │                │
│ String s ─────────────────── │→ "hello"       │
│ int[] arr ───────────────── │→ [1, 2, 3]     │
│ Person p ────────────────── │→ Person{name,age}│
└──────────────┘               └────────────────┘

Key facts:
- Shared by ALL threads (needs synchronization for concurrent access)
- Managed by garbage collector
- -Xms: initial heap size (e.g., -Xms256m)
- -Xmx: maximum heap size (e.g., -Xmx4g)
- OutOfMemoryError: heap is full, GC can't free enough memory
```

---

## Object Lifecycle

```
1. ALLOCATION          2. USAGE              3. ELIGIBLE          4. COLLECTED
   new Person()           person.getName()      person = null;       GC runs
   ↓                      ↓                     ↓                    ↓
   Allocated in           Referenced from        No more live         Memory
   Eden space             stack/other objects    references           reclaimed

   ┌──────┐              ┌──────┐              ┌──────┐
   │Object│ ←── ref      │Object│ ←── ref      │Object│ ←── (none)
   └──────┘              └──────┘              └──────┘
   In Eden               In use                Ready for GC
```

---

## Garbage Collection

### Why GC Exists

```
C/C++ (manual memory management):
  malloc() → use → free()
  Problems: forget free() → leak, double free() → crash, use after free() → bug

Java (automatic GC):
  new → use → forget about it → GC handles it
  You NEVER call free(). GC figures out what's unreachable and cleans up.
```

### How GC Finds Garbage: Reachability Analysis

```
GC Roots (starting points):
- Local variables on thread stacks
- Static variables
- Active threads
- JNI references

GC traces from roots → marks everything reachable → sweeps everything else

GC Root ──→ Object A ──→ Object B
                          ↓
                        Object C

Object D (not reachable from any root → GARBAGE → collected!)
Object E → Object F (circular reference but no root → BOTH garbage!)
```

### Generational Garbage Collection

```
Key insight: MOST objects die young ("infant mortality")

Typical object lifespan:
  98% of objects: created, used briefly, become garbage (temporary variables)
  2% of objects: live for the entire application (caches, singletons)

So: scan young objects frequently (cheap), old objects rarely (expensive)
```

```
Object journey through generations:

1. new Object() → allocated in EDEN
2. Eden fills up → Minor GC:
   - Mark live objects in Eden
   - Copy them to Survivor S0 (age = 1)
   - Clear Eden completely

3. Next Minor GC:
   - Mark live in Eden + S0
   - Copy all live to S1 (age++)
   - Clear Eden + S0

4. Objects bounce between S0 and S1, age increases each GC

5. When age reaches threshold (default 15):
   - Promoted to Old Generation

6. Old Generation fills up → Major GC (Full GC):
   - Scans EVERYTHING (young + old)
   - Much slower, longer pause
   - Avoid frequent Full GCs!
```

```
Eden    S0      S1      Old Gen
┌─────┐┌─────┐┌─────┐  ┌─────────────┐
│A B C││     ││     │  │             │  1. New objects in Eden
└─────┘└─────┘└─────┘  └─────────────┘

┌─────┐┌─────┐┌─────┐  ┌─────────────┐
│     ││A(1) ││     │  │             │  2. Minor GC: B,C dead. A survives → S0
└─────┘└─────┘└─────┘  └─────────────┘

┌─────┐┌─────┐┌─────┐  ┌─────────────┐
│D E F││A(1) ││     │  │             │  3. New objects in Eden
└─────┘└─────┘└─────┘  └─────────────┘

┌─────┐┌─────┐┌─────┐  ┌─────────────┐
│     ││     ││A(2) │  │             │  4. Minor GC: D,E,F dead. A→S1 (age 2)
└─────┘└─────┘│F(1) │  │             │     F survived too
              └─────┘  └─────────────┘

... after 15 Minor GCs ...

┌─────┐┌─────┐┌─────┐  ┌─────────────┐
│     ││     ││     │  │  A(15)      │  5. A promoted to Old Gen
└─────┘└─────┘└─────┘  └─────────────┘
```

---

## GC Algorithms

### G1 GC (Default since Java 9)

```
Region-based: heap divided into equal-size regions (~1-32MB each)

┌────┬────┬────┬────┬────┬────┬────┬────┐
│ E  │ E  │ S  │ O  │ O  │ E  │ H  │ O  │
│den │den │urv │ld  │ld  │den │uge │ld  │
└────┴────┴────┴────┴────┴────┴────┴────┘

E = Eden, S = Survivor, O = Old, H = Humongous (large objects)

Key features:
- Targets pause time: -XX:MaxGCPauseMillis=200 (default)
- Collects regions with most garbage first ("Garbage First")
- Concurrent marking (happens while app runs)
- Predictable pauses (unlike CMS)
```

### Algorithm Comparison

```
Algorithm     Throughput   Latency    Use When                    Flag
──────────────────────────────────────────────────────────────────────
Serial        Low          High       Small heaps (<100MB)        -XX:+UseSerialGC
Parallel      High         Medium     Batch processing            -XX:+UseParallelGC
G1 (default)  High         Low-Med    General purpose             -XX:+UseG1GC
ZGC           Medium       Ultra-Low  Large heaps, <10ms pause    -XX:+UseZGC
Shenandoah    Medium       Ultra-Low  Similar to ZGC              -XX:+UseShenandoahGC

For interviews: know G1 (default) and ZGC (modern low-latency).
```

### ZGC (Java 15+)

```
Ultra-low latency: pause times < 10ms regardless of heap size

How: uses colored pointers and load barriers
- Marking and compacting happen CONCURRENTLY with application
- No stop-the-world for most GC work
- Can handle terabyte heaps

Use when: latency-sensitive applications (trading, real-time systems)
```

---

## Memory Leaks in Java

### Yes, Java CAN Have Memory Leaks

```
"Memory leak" in Java = objects are reachable but no longer needed

GC can only collect UNREACHABLE objects. If you hold a reference
to something you'll never use → it's a leak.
```

### Common Causes

```java
// 1. Static collections that grow forever
class Cache {
    static final Map<String, Object> cache = new HashMap<>();

    static void add(String key, Object value) {
        cache.put(key, value);  // Never removed → grows forever!
    }
}

// 2. Listeners/callbacks not removed
button.addActionListener(listener);
// If you never remove the listener, the listener object (and everything
// it references) can never be GC'd

// 3. ThreadLocal not cleaned up in thread pools
ThreadLocal<byte[]> buffer = new ThreadLocal<>();
executor.submit(() -> {
    buffer.set(new byte[1024 * 1024]);  // 1MB
    // Forgot buffer.remove()!
    // Thread goes back to pool → buffer stays → 1MB leaked per task
});

// 4. Inner classes hold reference to outer class
class Outer {
    byte[] largeData = new byte[10_000_000];

    class Inner {
        // Inner implicitly holds reference to Outer
        // Even if Outer is no longer needed, Inner keeps it alive
    }
}
// Fix: use static inner class (no implicit reference)

// 5. Unclosed resources
Connection conn = dataSource.getConnection();
// If you never close conn → connection object + buffers leaked
// Fix: try-with-resources
```

---

## String Pool

```java
// String literals go into a pool (area in heap) for reuse:
String s1 = "hello";        // Goes to pool
String s2 = "hello";        // Reuses same pool object
System.out.println(s1 == s2);  // true (same object!)

String s3 = new String("hello");  // Creates NEW object on heap (not pool)
System.out.println(s1 == s3);     // false (different objects!)
System.out.println(s1.equals(s3)); // true (same content)

// intern(): explicitly add to pool
String s4 = s3.intern();    // Returns pool version
System.out.println(s1 == s4);  // true (both point to pool)

// ⚠️ new String("hello") creates TWO objects:
// 1. "hello" literal in pool (if not already there)
// 2. new String object on heap
```

---

## JIT Compilation

```
JVM starts by INTERPRETING bytecode (slow but instant start).
As methods get called repeatedly, JIT compiles them to native code (fast execution).

Cold start → Warm up → Peak performance

┌──────────────────────────────────────────────────────┐
│ Execution Speed                                       │
│                                    ┌─────────────────│
│                              ┌─────┘ Peak (JIT'd)    │
│                        ┌─────┘                        │
│ ───────────────────────┘ Warm-up                      │
│ Interpreted (slow)                                    │
│                                                       │
│ Time → ──────────────────────────────────────────── │
└──────────────────────────────────────────────────────┘

Tiered compilation (default):
1. Interpreter (immediate execution)
2. C1 compiler (quick compile, basic optimizations)
3. C2 compiler (aggressive optimization for hot methods)
```

---

## JVM Tuning (Practical)

### Common Flags

```bash
# Heap size
-Xms512m              # Initial heap size (512 MB)
-Xmx4g               # Maximum heap size (4 GB)
# Tip: set Xms = Xmx to avoid resize overhead

# Thread stack size
-Xss512k             # Stack size per thread (default ~512KB-1MB)

# GC selection
-XX:+UseG1GC         # G1 (default in Java 9+)
-XX:+UseZGC          # ZGC (low latency, Java 15+)

# GC tuning
-XX:MaxGCPauseMillis=200   # Target max pause (G1)
-XX:NewRatio=2             # Old:Young ratio (2:1 default)

# Debugging
-XX:+HeapDumpOnOutOfMemoryError  # Dump heap on OOM
-XX:HeapDumpPath=/tmp/heap.hprof # Where to dump
-Xlog:gc*                        # GC logging

# Production example
java -Xms2g -Xmx2g -XX:+UseG1GC -XX:MaxGCPauseMillis=200 \
     -XX:+HeapDumpOnOutOfMemoryError -Xlog:gc* -jar app.jar
```

### Monitoring Tools

```
Tool      What It Does                           Command
jps       List running Java processes            jps -l
jstat     GC statistics                          jstat -gc <pid> 1000
jmap      Heap dump                              jmap -dump:format=b,file=heap.bin <pid>
jstack    Thread dump                            jstack <pid>
jconsole  GUI monitoring                         jconsole
VisualVM  Advanced GUI (heap, threads, profiler) visualvm
```

---

## Common Interview Traps

### 1. "Java Has No Memory Leaks"

```
WRONG. Java can leak memory when objects are:
- Referenced by static collections
- Referenced by unclosed resources
- Referenced by ThreadLocal in thread pools
- Referenced by forgotten listeners/callbacks

GC only collects UNREACHABLE objects.
Objects that are reachable but unused = leak.
```

### 2. finalize() Is NOT a Destructor

```java
// ❌ DON'T rely on finalize()
class Resource {
    @Override
    protected void finalize() {
        // "Clean up" — but:
        // 1. No guarantee WHEN it runs
        // 2. No guarantee IF it runs
        // 3. Deprecated in Java 9, removed in Java 18
    }
}

// ✅ Use try-with-resources + AutoCloseable
class Resource implements AutoCloseable {
    @Override
    public void close() {
        // Guaranteed cleanup
    }
}
try (var r = new Resource()) {
    // use r
}  // close() called automatically
```

### 3. OutOfMemoryError Types

```
java.lang.OutOfMemoryError: Java heap space
→ Heap is full. Increase -Xmx or fix memory leak.

java.lang.OutOfMemoryError: Metaspace
→ Too many classes loaded. Increase -XX:MaxMetaspaceSize. Check classloader leak.

java.lang.OutOfMemoryError: Unable to create native thread
→ Too many threads. Reduce thread count or increase OS limits.

java.lang.OutOfMemoryError: GC overhead limit exceeded
→ GC using >98% CPU time but recovering <2% heap. Increase heap or fix leak.

StackOverflowError is NOT OutOfMemoryError!
→ Stack overflow = too deep recursion. Increase -Xss or fix recursion.
```

### 4. -Xms vs -Xmx

```
-Xms = initial heap size (JVM starts with this)
-Xmx = maximum heap size (JVM grows up to this)

Production tip: set Xms = Xmx
→ Avoids heap resize overhead
→ Application gets predictable memory from start
→ Example: -Xms2g -Xmx2g
```

### 5. String Concatenation in Loops

```java
// Java 9+ compiler optimizes simple concatenation with invokedynamic
String s = "a" + "b" + "c";  // Fine — compiler optimizes

// But in loops, still avoid:
String result = "";
for (int i = 0; i < 100000; i++) {
    result += i;  // Still creates intermediate objects in loop
}

// Use StringBuilder for loops:
StringBuilder sb = new StringBuilder();
for (int i = 0; i < 100000; i++) {
    sb.append(i);
}
```

---

## When To Use What

```
Situation                          → Action
──────────────────────────────────────────────────────
OutOfMemoryError: Heap             → Increase -Xmx or fix leak
OutOfMemoryError: Metaspace        → Check classloader leak
StackOverflowError                 → Fix recursion depth or increase -Xss
High GC pause times                → Switch to ZGC or tune G1
Frequent Full GCs                  → Increase heap or fix Old Gen leak
Thread starvation                  → Check thread pool sizing
Slow startup                      → Expected — JIT warms up
Memory leak suspected              → Take heap dump, analyze with MAT/VisualVM
Production monitoring              → Enable GC logs + Prometheus metrics
```

---

## Links

- [[collections_internals]] — How collections use heap memory
- [[concurrency_and_threading]] — Thread stacks, memory visibility, volatile
- [[spring_boot_production]] — JVM tuning for Spring Boot apps
- [[interview_quick_reference]] — Quick revision cheat sheet
- [[02_building_blocks/monitoring_and_logging]] — Application monitoring
