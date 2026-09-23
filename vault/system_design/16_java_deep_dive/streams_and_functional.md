#java #streams #functional #interview

# Streams and Functional Java

> Write cleaner, more readable code with streams, lambdas, Optional, and records.

---

## Definitions

| Term | Meaning |
|------|---------|
| **Lambda** | Anonymous function — shorthand for single-method interfaces: `(x) -> x * 2` |
| **Functional Interface** | Interface with exactly ONE abstract method — can be used as lambda target |
| **Stream** | Pipeline of operations on data — NOT a data structure, processes elements lazily |
| **Lazy Evaluation** | Operations aren't executed until a terminal operation is called |
| **Terminal Operation** | Triggers stream processing and produces a result (collect, forEach, reduce) |
| **Intermediate Operation** | Transforms stream but doesn't trigger processing (filter, map, sorted) |
| **Collector** | Accumulates stream elements into a result (list, set, map, grouping) |
| **Optional** | Container that may or may not hold a value — replacement for null |
| **Record** | Immutable data carrier class with auto-generated constructor, getters, equals, hashCode |
| **Method Reference** | Shorthand for lambda that just calls a method: `String::length` |

---

## Why Functional Programming in Java?

```java
// IMPERATIVE (how to do it — step by step):
List<String> names = new ArrayList<>();
for (Person p : people) {
    if (p.age() >= 18) {
        names.add(p.name().toUpperCase());
    }
}
Collections.sort(names);

// DECLARATIVE (what to do — describe the result):
List<String> names = people.stream()
    .filter(p -> p.age() >= 18)
    .map(p -> p.name().toUpperCase())
    .sorted()
    .toList();

// Same result, but:
// ✅ More readable (reads like English)
// ✅ Less code
// ✅ No mutation (no mutable ArrayList)
// ✅ Easy to parallelize (just add .parallel())
```

---

## Lambda Expressions

### Syntax

```java
// Full form
(int a, int b) -> { return a + b; }

// Types inferred
(a, b) -> { return a + b; }

// Single expression (no braces, no return)
(a, b) -> a + b

// Single parameter (no parentheses needed)
x -> x * 2

// No parameters
() -> System.out.println("Hello")
```

### Built-in Functional Interfaces

```java
import java.util.function.*;

// Function<T, R>: takes T, returns R (transform)
Function<String, Integer> length = s -> s.length();
length.apply("hello");  // 5

// Predicate<T>: takes T, returns boolean (test)
Predicate<Integer> isEven = n -> n % 2 == 0;
isEven.test(4);  // true

// Consumer<T>: takes T, returns nothing (action)
Consumer<String> print = s -> System.out.println(s);
print.accept("hello");  // prints "hello"

// Supplier<T>: takes nothing, returns T (factory)
Supplier<String> greeting = () -> "Hello World";
greeting.get();  // "Hello World"

// BiFunction<T, U, R>: takes T and U, returns R
BiFunction<String, String, String> concat = (a, b) -> a + b;
concat.apply("Hello", " World");  // "Hello World"

// UnaryOperator<T>: Function<T, T> (same type in and out)
UnaryOperator<String> upper = s -> s.toUpperCase();

// BinaryOperator<T>: BiFunction<T, T, T>
BinaryOperator<Integer> add = (a, b) -> a + b;
```

---

## Method References

```java
// 4 types of method references:

// 1. Static method: ClassName::staticMethod
Function<String, Integer> parse = Integer::parseInt;
// Same as: s -> Integer.parseInt(s)

// 2. Instance method on object: object::method
String str = "hello";
Supplier<Integer> len = str::length;
// Same as: () -> str.length()

// 3. Instance method on parameter: ClassName::instanceMethod
Function<String, Integer> getLen = String::length;
// Same as: s -> s.length()

// 4. Constructor: ClassName::new
Supplier<ArrayList<String>> factory = ArrayList::new;
// Same as: () -> new ArrayList<>()

// When to use: lambda just calls a method with same params
list.stream().map(s -> s.length())      // Lambda
list.stream().map(String::length)        // Method reference (cleaner)
```

---

## Stream API

### What Is a Stream?

```
NOT a data structure. It's a PIPELINE:

Source → [Intermediate Operations...] → Terminal Operation → Result

  List<Person>  →  filter  →  map  →  sorted  →  collect  →  List<String>
                   (lazy)     (lazy)   (lazy)     (triggers!)

Key properties:
1. Lazy: intermediate operations don't execute until terminal
2. Single-use: a stream can only be consumed once
3. Non-mutating: doesn't change the source collection
```

### Creating Streams

```java
// From collection
List<String> list = List.of("a", "b", "c");
Stream<String> s1 = list.stream();

// From values
Stream<String> s2 = Stream.of("a", "b", "c");

// From array
int[] arr = {1, 2, 3};
IntStream s3 = Arrays.stream(arr);

// Range
IntStream.range(0, 10);      // 0, 1, 2, ..., 9
IntStream.rangeClosed(1, 10); // 1, 2, 3, ..., 10

// Generate/Iterate
Stream.generate(() -> "hello").limit(5);      // 5 "hello"s
Stream.iterate(0, n -> n + 2).limit(5);       // 0, 2, 4, 6, 8
Stream.iterate(0, n -> n < 10, n -> n + 2);   // 0, 2, 4, 6, 8 (Java 9+)
```

### Intermediate Operations

```java
List<String> words = List.of("hello", "world", "hi", "hey", "java", "hello");

// filter: keep elements matching condition
words.stream().filter(w -> w.startsWith("h"))
// → "hello", "hi", "hey", "hello"

// map: transform each element
words.stream().map(String::toUpperCase)
// → "HELLO", "WORLD", "HI", "HEY", "JAVA", "HELLO"

// map to different type
words.stream().map(String::length)
// → 5, 5, 2, 3, 4, 5

// flatMap: flatten nested structures
List<List<Integer>> nested = List.of(List.of(1,2), List.of(3,4), List.of(5));
nested.stream().flatMap(Collection::stream)
// → 1, 2, 3, 4, 5

// distinct: remove duplicates (uses equals/hashCode)
words.stream().distinct()
// → "hello", "world", "hi", "hey", "java"

// sorted: natural order or custom
words.stream().sorted()
// → "hello", "hello", "hey", "hi", "java", "world"
words.stream().sorted(Comparator.comparing(String::length))
// → "hi", "hey", "java", "hello", "world", "hello"

// peek: debug/logging (DON'T use for side effects)
words.stream().peek(w -> System.out.println("Processing: " + w))

// limit / skip: pagination
words.stream().skip(2).limit(3)
// → "hi", "hey", "java" (skip first 2, take next 3)

// takeWhile / dropWhile (Java 9+)
List.of(1, 2, 3, 4, 1, 2).stream().takeWhile(n -> n < 4)
// → 1, 2, 3 (stops at first false)
```

### Terminal Operations

```java
// collect: gather into collection (most common)
List<String> result = stream.collect(Collectors.toList());
List<String> result = stream.toList();  // Java 16+ (immutable)
Set<String> set = stream.collect(Collectors.toSet());

// forEach: iterate (avoid when possible — not functional)
stream.forEach(System.out::println);

// reduce: combine into single value
int sum = IntStream.of(1, 2, 3, 4, 5).reduce(0, Integer::sum);
// 0 + 1 + 2 + 3 + 4 + 5 = 15

Optional<String> longest = words.stream()
    .reduce((a, b) -> a.length() >= b.length() ? a : b);

// count, min, max
long count = stream.count();
Optional<String> min = stream.min(Comparator.naturalOrder());

// findFirst / findAny
Optional<String> first = stream.filter(w -> w.length() > 3).findFirst();

// anyMatch / allMatch / noneMatch
boolean hasLong = stream.anyMatch(w -> w.length() > 10);
boolean allShort = stream.allMatch(w -> w.length() < 20);

// toArray
String[] arr = stream.toArray(String[]::new);
```

---

## Collectors Deep Dive

```java
List<Person> people = List.of(
    new Person("Alice", 30, "Engineering"),
    new Person("Bob", 25, "Marketing"),
    new Person("Charlie", 35, "Engineering"),
    new Person("Diana", 28, "Marketing"),
    new Person("Eve", 32, "Engineering")
);

// toMap (key, value)
Map<String, Integer> nameToAge = people.stream()
    .collect(Collectors.toMap(Person::name, Person::age));
// {Alice=30, Bob=25, Charlie=35, Diana=28, Eve=32}

// ⚠️ toMap with duplicate keys → IllegalStateException!
// Fix: provide merge function
Map<String, Integer> deptCount = people.stream()
    .collect(Collectors.toMap(Person::dept, p -> 1, Integer::sum));

// groupingBy (SQL GROUP BY equivalent) — MOST USEFUL
Map<String, List<Person>> byDept = people.stream()
    .collect(Collectors.groupingBy(Person::dept));
// {Engineering=[Alice,Charlie,Eve], Marketing=[Bob,Diana]}

// groupingBy with downstream collector
Map<String, Long> countByDept = people.stream()
    .collect(Collectors.groupingBy(Person::dept, Collectors.counting()));
// {Engineering=3, Marketing=2}

Map<String, Double> avgAgeByDept = people.stream()
    .collect(Collectors.groupingBy(Person::dept, Collectors.averagingInt(Person::age)));
// {Engineering=32.33, Marketing=26.5}

Map<String, Optional<Person>> oldestByDept = people.stream()
    .collect(Collectors.groupingBy(Person::dept,
        Collectors.maxBy(Comparator.comparingInt(Person::age))));

// partitioningBy (split into true/false)
Map<Boolean, List<Person>> seniorOrNot = people.stream()
    .collect(Collectors.partitioningBy(p -> p.age() >= 30));
// {true=[Alice,Charlie,Eve], false=[Bob,Diana]}

// joining
String names = people.stream()
    .map(Person::name)
    .collect(Collectors.joining(", ", "[", "]"));
// "[Alice, Bob, Charlie, Diana, Eve]"
```

---

## Optional

### Why: The Billion-Dollar Mistake

```java
// Without Optional: null checks everywhere
String city = null;
if (user != null) {
    Address address = user.getAddress();
    if (address != null) {
        city = address.getCity();
        if (city != null) {
            city = city.toUpperCase();
        }
    }
}

// With Optional: clean chain
String city = Optional.ofNullable(user)
    .map(User::getAddress)
    .map(Address::getCity)
    .map(String::toUpperCase)
    .orElse("UNKNOWN");
```

### Creating Optional

```java
Optional<String> opt1 = Optional.of("hello");        // Value MUST be non-null
Optional<String> opt2 = Optional.ofNullable(null);    // Handles null safely
Optional<String> opt3 = Optional.empty();             // Explicitly empty

// ⚠️ Optional.of(null) → NullPointerException! Use ofNullable for maybe-null.
```

### Using Optional

```java
Optional<String> opt = Optional.of("hello");

// Extracting value
opt.get();                          // "hello" (⚠️ DANGEROUS if empty!)
opt.orElse("default");              // "hello" (or "default" if empty)
opt.orElseGet(() -> compute());     // Lazy default (only computed if empty)
opt.orElseThrow();                  // "hello" or NoSuchElementException
opt.orElseThrow(() -> new RuntimeException("not found"));

// Transforming
opt.map(String::toUpperCase);       // Optional["HELLO"]
opt.filter(s -> s.length() > 3);    // Optional["hello"]
opt.flatMap(s -> findUser(s));      // When function returns Optional

// Conditional action
opt.ifPresent(System.out::println);                    // Print if present
opt.ifPresentOrElse(System.out::println, () -> log("empty")); // Java 9+

// Chaining
opt.or(() -> Optional.of("backup"));  // Alternative Optional (Java 9+)
```

### When To Use Optional

```
✅ USE as method return type:
  Optional<User> findUserById(int id)

❌ DON'T USE as method parameter:
  void save(Optional<User> user)  // Confusing API — just use @Nullable

❌ DON'T USE as class field:
  class User { Optional<String> email; }  // Not serializable, overhead

❌ DON'T USE for collections (use empty collection instead):
  Optional<List<User>>  →  just return List.of()
```

---

## Records (Java 16+)

```java
// Before records: TONS of boilerplate
class Point {
    private final int x;
    private final int y;
    Point(int x, int y) { this.x = x; this.y = y; }
    int x() { return x; }
    int y() { return y; }
    public boolean equals(Object o) { /* 10 lines */ }
    public int hashCode() { return Objects.hash(x, y); }
    public String toString() { return "Point[x=" + x + ", y=" + y + "]"; }
}

// With records: ONE line!
record Point(int x, int y) {}

// Auto-generated: constructor, getters (x(), y()), equals, hashCode, toString
Point p = new Point(3, 4);
p.x();           // 3
p.y();           // 4
p.toString();    // "Point[x=3, y=4]"

// Compact constructor (for validation)
record Person(String name, int age) {
    Person {  // No parameter list — "compact canonical constructor"
        if (age < 0) throw new IllegalArgumentException("Age can't be negative");
        name = name.strip();  // Normalize
    }
}

// Records as DTOs in APIs
record CreateUserRequest(@NotBlank String name, @Email String email) {}
record UserResponse(long id, String name, String email, LocalDateTime createdAt) {}

// Records in streams (clean data transformation)
record NameAge(String name, int age) {}
List<NameAge> result = people.stream()
    .map(p -> new NameAge(p.name(), p.age()))
    .toList();
```

---

## Parallel Streams

```java
// Just add .parallelStream() or .parallel()
long sum = list.parallelStream()
    .filter(n -> n > 0)
    .mapToLong(n -> n)
    .sum();

// When parallel streams HELP:
// ✅ Large dataset (100,000+ elements)
// ✅ CPU-bound operations (computation)
// ✅ No shared mutable state
// ✅ Order doesn't matter

// When parallel streams HURT:
// ❌ Small dataset (overhead > benefit)
// ❌ I/O-bound (threads block, no speedup)
// ❌ Shared mutable state (race conditions!)
// ❌ Ordered operations (sorted, forEachOrdered)

// ⚠️ DANGER: shared mutable state
List<Integer> result = new ArrayList<>();  // NOT thread-safe!
stream.parallel().forEach(result::add);     // 💥 Race condition!

// ✅ Use collect instead
List<Integer> result = stream.parallel().collect(Collectors.toList());
```

---

## Common Interview Traps

### 1. Stream Reuse

```java
Stream<String> stream = list.stream().filter(s -> s.length() > 3);
stream.count();  // Works
stream.toList(); // 💥 IllegalStateException: stream has already been operated upon
```

### 2. orElse vs orElseGet

```java
// orElse: ALWAYS evaluates the argument
Optional.of("hello").orElse(expensiveMethod());
// expensiveMethod() runs even though value is present!

// orElseGet: lazy — only evaluates if empty
Optional.of("hello").orElseGet(() -> expensiveMethod());
// expensiveMethod() does NOT run (value is present)
```

### 3. Parallel Stream + Mutable State

```java
// ❌ BROKEN: ArrayList is not thread-safe
List<Integer> result = new ArrayList<>();
IntStream.range(0, 10000).parallel().forEach(result::add);
// result.size() might be < 10000 (lost elements due to race condition)

// ✅ CORRECT: use collect
List<Integer> result = IntStream.range(0, 10000).parallel()
    .boxed().collect(Collectors.toList());
```

### 4. flatMap with null

```java
// ❌ If function returns null → NullPointerException
stream.flatMap(s -> null);  // 💥 NPE

// ✅ Return empty stream for "no results"
stream.flatMap(s -> s.isEmpty() ? Stream.empty() : Stream.of(s));
```

### 5. collect(toMap) with Duplicate Keys

```java
// ❌ Throws IllegalStateException if duplicate keys
people.stream().collect(Collectors.toMap(Person::dept, Person::name));
// Two people in Engineering → 💥

// ✅ Provide merge function
people.stream().collect(Collectors.toMap(Person::dept, Person::name, (a, b) -> a + "," + b));
```

---

## When To Use What

```
Need                              → Use This
Transform collection              → stream().map().collect()
Filter collection                 → stream().filter().collect()
Group elements                    → Collectors.groupingBy()
Null-safe return value            → Optional<T>
Immutable data carrier            → record
Simple iteration                  → for-each (or forEach only if needed)
Large CPU-bound parallel work     → parallelStream()
Flatten nested collections        → flatMap()
Aggregate (sum, count, avg)       → IntStream or Collectors
Combine multiple values           → reduce()
```

---

## Links

- [[java_essentials_for_dsa]] — Basic collection usage for DSA
- [[collections_internals]] — How collections work under the hood
- [[exception_handling_and_optional]] — Optional deep dive, exception patterns
- [[spring_boot_production]] — Streams in service layer code
- [[interview_quick_reference]] — Quick revision cheat sheet
