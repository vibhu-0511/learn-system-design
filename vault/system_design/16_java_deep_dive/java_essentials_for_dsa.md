#java #dsa #essentials #interview

# Java Essentials for DSA

> Everything you need to solve DSA problems in Java — from syntax to idioms.

---

## Definitions

| Term | Meaning |
|------|---------|
| **Primitive** | Basic data type stored directly on the stack (int, long, char, boolean, double, float, byte, short) |
| **Wrapper Class** | Object version of a primitive (Integer, Long, Character, Boolean) — needed for collections |
| **Autoboxing** | Automatic conversion from primitive → wrapper (int → Integer) |
| **Unboxing** | Automatic conversion from wrapper → primitive (Integer → int) |
| **Immutable** | Cannot be changed after creation (String, Integer, records) |
| **StringBuilder** | Mutable string — use when building strings in loops |
| **Comparator** | External comparison logic — defines custom sort order |
| **Comparable** | Internal comparison logic — defines natural order of a class |
| **Generics** | Type parameters (List<Integer>) — type safety without casting |
| **Iterable** | Interface that allows for-each loop iteration |
| **Iterator** | Object that walks through a collection element by element |

---

## Java Type System

### Why This Matters for DSA
Every DSA problem needs you to choose the right types. Wrong choice = overflow bugs, TLE, or runtime errors.

### Primitives (stored on stack — fast)

```java
// Type      Size     Range                          Default
int          4 bytes  -2,147,483,648 to 2,147,483,647   0
long         8 bytes  -9.2 × 10^18 to 9.2 × 10^18      0L
double       8 bytes  ±1.7 × 10^308                     0.0
float        4 bytes  ±3.4 × 10^38                      0.0f
char         2 bytes  0 to 65,535 (Unicode)             '\u0000'
boolean      1 bit    true or false                      false
byte         1 byte   -128 to 127                        0
short        2 bytes  -32,768 to 32,767                  0
```

### Wrapper Classes (stored on heap — needed for collections)

```java
// Primitive → Wrapper
int     → Integer
long    → Long
double  → Double
char    → Character
boolean → Boolean

// Collections CANNOT hold primitives
List<int> list;     // ❌ COMPILE ERROR
List<Integer> list; // ✅ Works
```

### Autoboxing and Unboxing

```java
// Autoboxing: primitive → wrapper (automatic)
Integer x = 42;           // int 42 → Integer.valueOf(42)
List<Integer> list = new ArrayList<>();
list.add(5);              // int 5 → Integer.valueOf(5) automatically

// Unboxing: wrapper → primitive (automatic)
int y = x;                // Integer → int automatically
int sum = list.get(0) + 1; // Integer → int, then add

// ⚠️ DANGER: unboxing null → NullPointerException
Integer nullVal = null;
int crash = nullVal;       // 💥 NullPointerException at runtime!
```

### Type Casting

```java
// Widening (safe — no data loss): smaller → larger
int i = 100;
long l = i;          // int → long (automatic)
double d = i;        // int → double (automatic, becomes 100.0)

// Narrowing (dangerous — data loss): larger → smaller
long big = 3_000_000_000L;
int small = (int) big;    // ⚠️ Overflow! Result: -1294967296

// Common DSA trap: integer overflow
int a = 1_000_000;
int b = 1_000_000;
int product = a * b;      // 💥 Overflow! Result: -727379968
long safe = (long) a * b; // ✅ Cast BEFORE multiplication
```

---

## Strings

### Why Strings Are Special in Java

```
Problem: You need to manipulate text in almost every DSA problem.
Key insight: Java strings are IMMUTABLE — every "modification" creates a NEW string.
```

### String Basics

```java
// Creation
String s1 = "hello";                // String pool (reused)
String s2 = new String("hello");    // New object on heap (avoid this)
String s3 = "hello";                // Same object as s1 (from pool)

// Immutability — strings NEVER change
String name = "hello";
name.toUpperCase();    // Returns "HELLO" but name is still "hello"!
name = name.toUpperCase();  // Now name = "HELLO" (reassigned, not mutated)
```

### Essential String Methods for DSA

```java
String s = "Hello World";

// Length and access
s.length();                  // 11
s.charAt(0);                 // 'H'
s.isEmpty();                 // false
s.isBlank();                 // false (Java 11+)

// Searching
s.indexOf('o');              // 4 (first occurrence)
s.lastIndexOf('o');          // 7
s.contains("World");         // true
s.startsWith("Hello");       // true
s.endsWith("World");         // true

// Extracting
s.substring(6);              // "World"
s.substring(0, 5);           // "Hello" (start inclusive, end exclusive)
s.toCharArray();             // char[] {'H','e','l','l','o',' ','W','o','r','l','d'}

// Transforming
s.toLowerCase();             // "hello world"
s.toUpperCase();             // "HELLO WORLD"
s.trim();                    // Remove leading/trailing whitespace
s.strip();                   // Same but Unicode-aware (Java 11+)
s.replace('l', 'x');         // "Hexxo Worxd"
s.replaceAll("[aeiou]", ""); // "Hll Wrld" (regex)

// Splitting
"a,b,c".split(",");         // String[] {"a", "b", "c"}
"hello".split("");           // String[] {"h", "e", "l", "l", "o"}

// Comparing
"abc".equals("abc");         // true ✅
"abc" == "abc";              // true (pool) but UNRELIABLE — avoid
"abc".compareTo("abd");      // -1 (lexicographic comparison)
"abc".equalsIgnoreCase("ABC"); // true

// Conversion
String.valueOf(42);          // "42"
String.valueOf(true);        // "true"
Integer.parseInt("42");      // 42
Integer.parseInt("ff", 16);  // 255 (hex to int)
```

### StringBuilder — Use for String Building in Loops

```gpt 
When Java sees:

result += i;

It actually converts it to something like this:

result = new StringBuilder(result)  
            .append(i)  
            .toString();

So **every iteration does these steps**:

1️⃣ Create new `StringBuilder`  
2️⃣ Copy old `result` string into it  
3️⃣ Append `i`  
4️⃣ Convert back to `String`  
5️⃣ Create new `String` object
```

```java
// ❌ BAD: String concatenation in loop → O(n²) because new String each time
String result = "";
for (int i = 0; i < 100000; i++) {
    result += i;  // Creates new String object EVERY iteration!
}

// ✅ GOOD: StringBuilder → O(n)
StringBuilder sb = new StringBuilder();
for (int i = 0; i < 100000; i++) {
    sb.append(i);
}
String result = sb.toString();

// Common StringBuilder methods
sb.append("hello");          // Add to end
sb.insert(0, "start");       // Insert at position
sb.delete(0, 5);             // Delete range
sb.reverse();                // Reverse in-place
sb.charAt(0);                // Get character
sb.length();                 // Current length
sb.toString();               // Convert to String
```

### char Arithmetic

```java
// Characters are numbers! 'a' = 97, 'A' = 65, '0' = 48
char c = 'a';
int num = c - 'a';          // 0 (position in alphabet)
char next = (char)(c + 1);  // 'b'
boolean isLower = c >= 'a' && c <= 'z';  // true
boolean isDigit = c >= '0' && c <= '9';  // false

// Convert digit char to int
char digit = '7';
int val = digit - '0';      // 7 (NOT 55!)

// Frequency array for lowercase letters
int[] freq = new int[26];
for (char ch : "hello".toCharArray()) {
    freq[ch - 'a']++;
}
// freq[7] = 1 (h), freq[4] = 1 (e), freq[11] = 2 (l), freq[14] = 1 (o)
```

---

## Arrays

### Declaration and Initialization

```java
// Declaration
int[] arr = new int[5];              // [0, 0, 0, 0, 0] (default: 0)
boolean[] flags = new boolean[3];    // [false, false, false]
String[] names = new String[3];      // [null, null, null]

// With values
int[] arr = {1, 2, 3, 4, 5};
int[] arr = new int[]{1, 2, 3, 4, 5};

// 2D arrays
int[][] grid = new int[3][4];       // 3 rows, 4 columns
int[][] grid = {{1,2,3}, {4,5,6}}; // 2 rows, 3 columns

// Jagged array (rows of different lengths)
int[][] jagged = new int[3][];
jagged[0] = new int[]{1, 2};
jagged[1] = new int[]{3, 4, 5};
jagged[2] = new int[]{6};
```

### Array Utility Methods

```java
import java.util.Arrays;

int[] arr = {5, 3, 1, 4, 2};

// Sort (dual-pivot quicksort for primitives, TimSort for objects)
Arrays.sort(arr);                    // [1, 2, 3, 4, 5] — modifies in place
Arrays.sort(arr, 1, 4);             // Sort index 1 to 3 only

// Fill
Arrays.fill(arr, -1);               // [-1, -1, -1, -1, -1]
Arrays.fill(arr, 0, 3, 0);          // [0, 0, 0, -1, -1]

// Copy
int[] copy = Arrays.copyOf(arr, arr.length);
int[] partial = Arrays.copyOfRange(arr, 1, 4);  // index 1 to 3

// Search (array MUST be sorted first)
int idx = Arrays.binarySearch(arr, 3);  // Returns index or negative

// Compare
Arrays.equals(arr1, arr2);           // true if same content
Arrays.deepEquals(grid1, grid2);     // For 2D arrays

// Print
System.out.println(Arrays.toString(arr));      // [1, 2, 3, 4, 5]
System.out.println(Arrays.deepToString(grid)); // [[1,2],[3,4]]

// Stream from array
Arrays.stream(arr).sum();                       // Sum all elements
Arrays.stream(arr).max().getAsInt();            // Maximum
```

### 2D Array Iteration

```java
int[][] grid = {{1,2,3}, {4,5,6}, {7,8,9}};
int rows = grid.length;        // 3
int cols = grid[0].length;     // 3

// Standard iteration
for (int i = 0; i < rows; i++) {
    for (int j = 0; j < cols; j++) {
        System.out.print(grid[i][j] + " ");
    }
}

// 4-directional movement (BFS/DFS on grid)
int[] dx = {-1, 1, 0, 0};     // up, down, left, right
int[] dy = {0, 0, -1, 1};
for (int d = 0; d < 4; d++) {
    int nx = x + dx[d];
    int ny = y + dy[d];
    if (nx >= 0 && nx < rows && ny >= 0 && ny < cols) {
        // valid neighbor at grid[nx][ny]
    }
}

// 8-directional movement (including diagonals)
int[] dx = {-1, -1, -1, 0, 0, 1, 1, 1};
int[] dy = {-1, 0, 1, -1, 1, -1, 0, 1};
```

---

## Collections for DSA

### Visual: When To Use What

```
Need fast lookup by key?
├── Yes → HashMap (O(1) avg)
│         Need sorted keys? → TreeMap (O(log n))
│         Need insertion order? → LinkedHashMap (O(1))
└── No
    Need unique elements?
    ├── Yes → HashSet (O(1))
    │         Need sorted? → TreeSet (O(log n))
    └── No
        Need ordered list?
        ├── Yes → ArrayList (O(1) random access)
        └── No
            Need min/max quickly?
            ├── Yes → PriorityQueue (O(log n) add/remove, O(1) peek)
            └── No
                Need stack or queue?
                └── ArrayDeque (O(1) for both)
```

### ArrayList

```java
List<Integer> list = new ArrayList<>();

// Add
list.add(10);              // [10]
list.add(20);              // [10, 20]
list.add(1, 15);           // [10, 15, 20] — insert at index 1

// Access
list.get(0);               // 10 — O(1)
list.set(0, 100);          // [100, 15, 20]
list.size();               // 3

// Remove
list.remove(0);            // Remove by index → [15, 20]
list.remove(Integer.valueOf(20)); // Remove by value → [15]

// Search
list.contains(15);         // true — O(n)
list.indexOf(15);          // 0

// Sort
Collections.sort(list);                    // Natural order
list.sort(Comparator.reverseOrder());      // Descending
list.sort((a, b) -> a - b);               // Custom ascending

// Convert
int[] arr = list.stream().mapToInt(i -> i).toArray();  // List → array
List<Integer> fromArr = Arrays.stream(arr).boxed().toList(); // array → List

// Initialize with values
List<Integer> list = new ArrayList<>(List.of(1, 2, 3));
List<Integer> list = new ArrayList<>(Arrays.asList(1, 2, 3));
```

### HashMap

```java
Map<String, Integer> map = new HashMap<>();

// Put and get
map.put("apple", 3);
map.put("banana", 5);
map.get("apple");          // 3
map.get("grape");          // null (key doesn't exist)
map.getOrDefault("grape", 0);  // 0 (default if missing) ← VERY USEFUL

// Check and remove
map.containsKey("apple");  // true
map.containsValue(3);      // true
map.remove("banana");      // Removes entry
map.size();                // 1

// Iteration
for (Map.Entry<String, Integer> entry : map.entrySet()) {
    System.out.println(entry.getKey() + ": " + entry.getValue());
}
for (String key : map.keySet()) { ... }
for (int val : map.values()) { ... }

// ⭐ Frequency counting (most common DSA pattern)
int[] nums = {1, 2, 2, 3, 3, 3};
Map<Integer, Integer> freq = new HashMap<>();
for (int n : nums) {
    freq.merge(n, 1, Integer::sum);  // Cleanest way
    // OR: freq.put(n, freq.getOrDefault(n, 0) + 1);
}
// {1=1, 2=2, 3=3}

// Compute patterns
map.computeIfAbsent("key", k -> new ArrayList<>()).add("value");
// Creates list if key missing, then adds to it — perfect for grouping
```

### HashSet

```java
Set<Integer> set = new HashSet<>();

set.add(1);                // true (added)
set.add(1);                // false (already exists)
set.contains(1);           // true — O(1)
set.remove(1);             // true (removed)
set.size();                // 0

// ⭐ Common DSA use: find duplicates
int[] nums = {1, 2, 3, 2, 1};
Set<Integer> seen = new HashSet<>();
for (int n : nums) {
    if (!seen.add(n)) {
        System.out.println("Duplicate: " + n);
    }
}

// Set operations
Set<Integer> a = new HashSet<>(List.of(1, 2, 3));
Set<Integer> b = new HashSet<>(List.of(2, 3, 4));
a.retainAll(b);            // Intersection: {2, 3}
a.addAll(b);               // Union: {1, 2, 3, 4}
a.removeAll(b);            // Difference: {1}
```

### TreeMap / TreeSet

```java
TreeMap<Integer, String> map = new TreeMap<>();
map.put(5, "five");
map.put(1, "one");
map.put(3, "three");
// Automatically sorted by key: {1=one, 3=three, 5=five}

// ⭐ Range queries — incredibly useful in DSA
map.firstKey();            // 1 (smallest)
map.lastKey();             // 5 (largest)
map.floorKey(4);           // 3 (largest key ≤ 4)
map.ceilingKey(2);         // 3 (smallest key ≥ 2)
map.lowerKey(3);           // 1 (largest key < 3)
map.higherKey(3);          // 5 (smallest key > 3)
map.subMap(1, 5);          // {1=one, 3=three} (1 inclusive, 5 exclusive)

// TreeSet — sorted unique elements
TreeSet<Integer> set = new TreeSet<>();
set.add(5); set.add(1); set.add(3);
// {1, 3, 5}
set.floor(4);              // 3
set.ceiling(2);            // 3
```

### PriorityQueue (Min-Heap)

```java
// Min-heap (default — smallest element first)
PriorityQueue<Integer> minHeap = new PriorityQueue<>();
minHeap.offer(5);
minHeap.offer(1);
minHeap.offer(3);
minHeap.peek();            // 1 (smallest, doesn't remove)
minHeap.poll();            // 1 (removes smallest)
minHeap.poll();            // 3
minHeap.size();            // 1

// Max-heap (largest element first)
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Comparator.reverseOrder());
maxHeap.offer(5);
maxHeap.offer(1);
maxHeap.offer(3);
maxHeap.poll();            // 5 (largest)

// Custom comparator: sort by second element of int[]
PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[1] - b[1]);
pq.offer(new int[]{1, 5});
pq.offer(new int[]{2, 1});
pq.poll();                 // [2, 1] (smallest second element)

// ⭐ Top K pattern
// Find K largest elements: use min-heap of size K
PriorityQueue<Integer> heap = new PriorityQueue<>();
for (int n : nums) {
    heap.offer(n);
    if (heap.size() > k) heap.poll();  // Remove smallest
}
// Heap now contains K largest elements
```

### ArrayDeque (Stack + Queue)

```java
// As a Stack (LIFO)
Deque<Integer> stack = new ArrayDeque<>();
stack.push(1);             // [1]
stack.push(2);             // [2, 1]
stack.push(3);             // [3, 2, 1]
stack.peek();              // 3 (top, doesn't remove)
stack.pop();               // 3 (removes top)
stack.isEmpty();           // false

// As a Queue (FIFO)
Deque<Integer> queue = new ArrayDeque<>();
queue.offer(1);            // [1]
queue.offer(2);            // [1, 2]
queue.offer(3);            // [1, 2, 3]
queue.peek();              // 1 (front)
queue.poll();              // 1 (removes front)

// ⚠️ NEVER use Stack class — it's legacy and slow
// Stack<Integer> stack = new Stack<>();  // ❌ DON'T
// Deque<Integer> stack = new ArrayDeque<>();  // ✅ DO
```

---

## Comparator and Comparable

### Comparable — Natural Ordering

```java
// Your class defines its own natural order
public record Student(String name, int grade) implements Comparable<Student> {
    @Override
    public int compareTo(Student other) {
        return Integer.compare(this.grade, other.grade);  // Sort by grade
    }
}

List<Student> students = new ArrayList<>(List.of(
    new Student("Alice", 90),
    new Student("Bob", 75)
));
Collections.sort(students);  // Uses compareTo → sorted by grade
```

### Comparator — Custom Ordering

```java
// Lambda syntax (most common in DSA)
List<int[]> intervals = new ArrayList<>();
intervals.add(new int[]{3, 5});
intervals.add(new int[]{1, 4});
intervals.add(new int[]{2, 6});

// Sort by first element
intervals.sort((a, b) -> a[0] - b[0]);
// Result: [1,4], [2,6], [3,5]

// Sort by first element, then by second element descending
intervals.sort((a, b) -> a[0] != b[0] ? a[0] - b[0] : b[1] - a[1]);

// Using Comparator methods (cleaner for multi-field)
students.sort(Comparator.comparing(Student::grade)
                        .thenComparing(Student::name));

// Sort by frequency (common DSA pattern)
Map<Integer, Integer> freq = new HashMap<>();
for (int n : nums) freq.merge(n, 1, Integer::sum);
Arrays.sort(boxedArr, (a, b) -> freq.get(a) - freq.get(b));

// ⚠️ TRAP: (a - b) can overflow for large ints!
// ❌ (a, b) -> a - b            // Overflow if a=MAX, b=-1
// ✅ (a, b) -> Integer.compare(a, b)  // Safe
```

---

## Input/Output for DSA

### Scanner (Simple but Slow)

```java
import java.util.Scanner;

Scanner sc = new Scanner(System.in);
int n = sc.nextInt();          // Read integer
long l = sc.nextLong();        // Read long
double d = sc.nextDouble();    // Read double
String word = sc.next();       // Read word (no spaces)
String line = sc.nextLine();   // Read full line
sc.close();
```

### BufferedReader (Fast — Use for Large Inputs)

```java
import java.io.*;
import java.util.*;

BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
StringTokenizer st = new StringTokenizer(br.readLine());

int n = Integer.parseInt(st.nextToken());
int m = Integer.parseInt(st.nextToken());

// Read array on one line
st = new StringTokenizer(br.readLine());
int[] arr = new int[n];
for (int i = 0; i < n; i++) {
    arr[i] = Integer.parseInt(st.nextToken());
}

// Fast output
PrintWriter pw = new PrintWriter(new BufferedWriter(new OutputStreamWriter(System.out)));
pw.println("answer: " + result);
pw.flush();
pw.close();
```

### Fast I/O Template

```java
import java.io.*;
import java.util.*;

public class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int t = Integer.parseInt(br.readLine().trim());  // Test cases

        StringBuilder sb = new StringBuilder();
        while (t-- > 0) {
            StringTokenizer st = new StringTokenizer(br.readLine());
            int n = Integer.parseInt(st.nextToken());

            int[] arr = new int[n];
            st = new StringTokenizer(br.readLine());
            for (int i = 0; i < n; i++) {
                arr[i] = Integer.parseInt(st.nextToken());
            }

            // Solve
            sb.append(solve(arr)).append("\n");
        }
        System.out.print(sb);
    }
}
```

---

## Common DSA Idioms in Java

### Two Pointers

```java
// Opposite direction: two sum in sorted array
int left = 0, right = arr.length - 1;
while (left < right) {
    int sum = arr[left] + arr[right];
    if (sum == target) return new int[]{left, right};
    else if (sum < target) left++;
    else right--;
}

// Same direction: remove duplicates in-place
int slow = 0;
for (int fast = 1; fast < arr.length; fast++) {
    if (arr[fast] != arr[slow]) {
        arr[++slow] = arr[fast];
    }
}
// Length of unique array: slow + 1
```

### Sliding Window

```java
// Fixed window of size k: maximum sum
int windowSum = 0;
for (int i = 0; i < k; i++) windowSum += arr[i];  // First window
int maxSum = windowSum;
for (int i = k; i < arr.length; i++) {
    windowSum += arr[i] - arr[i - k];  // Slide: add right, remove left
    maxSum = Math.max(maxSum, windowSum);
}

// Variable window: smallest subarray with sum >= target
int left = 0, currentSum = 0, minLen = Integer.MAX_VALUE;
for (int right = 0; right < arr.length; right++) {
    currentSum += arr[right];
    while (currentSum >= target) {
        minLen = Math.min(minLen, right - left + 1);
        currentSum -= arr[left++];
    }
}
```

### BFS Template (Graph/Grid)

```java
// BFS on grid
Deque<int[]> queue = new ArrayDeque<>();
boolean[][] visited = new boolean[rows][cols];
queue.offer(new int[]{startRow, startCol});
visited[startRow][startCol] = true;

int[] dx = {-1, 1, 0, 0};
int[] dy = {0, 0, -1, 1};
int level = 0;

while (!queue.isEmpty()) {
    int size = queue.size();  // Process level by level
    for (int i = 0; i < size; i++) {
        int[] curr = queue.poll();
        int x = curr[0], y = curr[1];

        for (int d = 0; d < 4; d++) {
            int nx = x + dx[d], ny = y + dy[d];
            if (nx >= 0 && nx < rows && ny >= 0 && ny < cols
                && !visited[nx][ny] && grid[nx][ny] != 0) {
                visited[nx][ny] = true;
                queue.offer(new int[]{nx, ny});
            }
        }
    }
    level++;
}
```

### DFS Template

```java
// DFS recursive on grid
void dfs(int[][] grid, boolean[][] visited, int x, int y) {
    if (x < 0 || x >= grid.length || y < 0 || y >= grid[0].length) return;
    if (visited[x][y] || grid[x][y] == 0) return;

    visited[x][y] = true;
    int[] dx = {-1, 1, 0, 0};
    int[] dy = {0, 0, -1, 1};
    for (int d = 0; d < 4; d++) {
        dfs(grid, visited, x + dx[d], y + dy[d]);
    }
}

// DFS iterative with stack
Deque<int[]> stack = new ArrayDeque<>();
stack.push(new int[]{startRow, startCol});
while (!stack.isEmpty()) {
    int[] curr = stack.pop();
    // Process curr...
    // Push neighbors...
}
```

### Binary Search Template

```java
// Standard binary search
int lo = 0, hi = arr.length - 1;
while (lo <= hi) {
    int mid = lo + (hi - lo) / 2;  // ✅ Avoids overflow (not (lo+hi)/2)
    if (arr[mid] == target) return mid;
    else if (arr[mid] < target) lo = mid + 1;
    else hi = mid - 1;
}
return -1;  // Not found

// Binary search on answer (search space)
// "Find minimum X such that condition(X) is true"
int lo = minPossible, hi = maxPossible;
while (lo < hi) {
    int mid = lo + (hi - lo) / 2;
    if (condition(mid)) hi = mid;       // mid might be answer
    else lo = mid + 1;                  // mid is too small
}
return lo;  // First value where condition is true
```

### Graph Representation

```java
// Adjacency list (most common)
int n = 5;  // Number of nodes
List<List<Integer>> graph = new ArrayList<>();
for (int i = 0; i < n; i++) graph.add(new ArrayList<>());

// Add edges
graph.get(0).add(1);  // Edge 0 → 1
graph.get(0).add(2);  // Edge 0 → 2
graph.get(1).add(3);  // Edge 1 → 3

// Weighted graph
List<List<int[]>> graph = new ArrayList<>();
for (int i = 0; i < n; i++) graph.add(new ArrayList<>());
graph.get(0).add(new int[]{1, 5});  // Edge 0 → 1, weight 5

// Using HashMap (when nodes aren't 0-indexed)
Map<String, List<String>> graph = new HashMap<>();
graph.computeIfAbsent("A", k -> new ArrayList<>()).add("B");
```

### Pair / Tuple Workarounds

```java
// Java has no built-in Pair! Here are alternatives:

// 1. int array (simplest for 2 ints)
int[] pair = new int[]{1, 2};

// 2. Map.Entry
Map.Entry<String, Integer> entry = Map.entry("hello", 42);

// 3. Record (cleanest — Java 16+)
record Pair(int first, int second) {}
Pair p = new Pair(1, 2);
p.first();  // 1
p.second(); // 2

// 4. Record with custom methods
record Edge(int to, int weight) implements Comparable<Edge> {
    public int compareTo(Edge other) {
        return Integer.compare(this.weight, other.weight);
    }
}
```

---

## Bit Manipulation

### Basic Operators

```java
// AND: both bits must be 1
5 & 3   // 101 & 011 = 001 = 1

// OR: either bit can be 1
5 | 3   // 101 | 011 = 111 = 7

// XOR: bits must differ
5 ^ 3   // 101 ^ 011 = 110 = 6
a ^ a   // Always 0 (cancel out)
a ^ 0   // Always a (identity)

// NOT: flip all bits
~5      // ~00000101 = 11111010 = -6

// Left shift: multiply by 2^n
5 << 1  // 10 (5 * 2)
5 << 3  // 40 (5 * 8)

// Right shift: divide by 2^n
20 >> 2 // 5 (20 / 4)
```

### Common Bit Tricks

```java
// Check if number is even or odd
(n & 1) == 0  // Even
(n & 1) == 1  // Odd

// Check if power of 2
(n & (n - 1)) == 0 && n > 0

// Get i-th bit
(n >> i) & 1

// Set i-th bit to 1
n | (1 << i)

// Clear i-th bit to 0
n & ~(1 << i)

// Toggle i-th bit
n ^ (1 << i)

// Count set bits
Integer.bitCount(n)

// Swap without temp variable
a ^= b; b ^= a; a ^= b;

// Find the only non-duplicate in array where every element appears twice
int result = 0;
for (int n : arr) result ^= n;  // XOR cancels duplicates
```

### Bitmask for Subsets

```java
// Generate all subsets of array using bitmask
int[] arr = {1, 2, 3};
int n = arr.length;
for (int mask = 0; mask < (1 << n); mask++) {
    List<Integer> subset = new ArrayList<>();
    for (int i = 0; i < n; i++) {
        if ((mask >> i & 1) == 1) {
            subset.add(arr[i]);
        }
    }
    System.out.println(subset);
}
// Output: [], [1], [2], [1,2], [3], [1,3], [2,3], [1,2,3]
```

---

## Common Interview Traps

### 1. Integer Cache: == vs .equals()

```java
Integer a = 127;
Integer b = 127;
System.out.println(a == b);      // true ← Cached! (-128 to 127)

Integer c = 128;
Integer d = 128;
System.out.println(c == d);      // false ← Different objects!
System.out.println(c.equals(d)); // true ✅ Always use .equals()
```

### 2. String Pool: == vs .equals()

```java
String s1 = "hello";
String s2 = "hello";
System.out.println(s1 == s2);    // true (same pool object)

String s3 = new String("hello");
System.out.println(s1 == s3);    // false (different objects!)
System.out.println(s1.equals(s3)); // true ✅ Always use .equals()
```

### 3. Integer Overflow in Binary Search

```java
// ❌ WRONG: overflows when lo + hi > Integer.MAX_VALUE
int mid = (lo + hi) / 2;

// ✅ CORRECT: no overflow possible
int mid = lo + (hi - lo) / 2;
```

### 4. Array vs ArrayList Performance

```java
// For DSA: prefer int[] over List<Integer> when possible
int[] arr = new int[1000000];     // ~4MB, cache-friendly
List<Integer> list = new ArrayList<>();  // ~16MB (boxing overhead), slower

// Use int[] for:   performance-critical code, DP arrays, frequency arrays
// Use ArrayList for: dynamic sizing, need .add()/.remove(), working with APIs
```

### 5. Modifying Collection During Iteration

```java
List<Integer> list = new ArrayList<>(List.of(1, 2, 3, 4, 5));

// ❌ ConcurrentModificationException
for (int n : list) {
    if (n % 2 == 0) list.remove(Integer.valueOf(n));
}

// ✅ Use iterator
Iterator<Integer> it = list.iterator();
while (it.hasNext()) {
    if (it.next() % 2 == 0) it.remove();
}

// ✅ Or use removeIf
list.removeIf(n -> n % 2 == 0);
```

### 6. Default Values

```java
// Primitives have defaults, wrappers default to null
int x;         // 0 (only in arrays/fields, NOT local variables)
Integer y;     // null
boolean b;     // false
Boolean b2;    // null ← DANGEROUS: unboxing null throws NPE

// Local variables MUST be initialized before use
int x;
System.out.println(x);  // ❌ COMPILE ERROR: variable not initialized
```

### 7. Pass by Value

```java
// Java ALWAYS passes by value — but object references are values!
void modify(int[] arr) {
    arr[0] = 999;    // ✅ Modifies original (reference points to same array)
}

void reassign(int[] arr) {
    arr = new int[]{1, 2, 3};  // ❌ Only changes local reference
}

void modify(int x) {
    x = 999;          // ❌ Only changes local copy
}
```

---

## When To Use What

```
Need                            → Use This               → Time Complexity
──────────────────────────────────────────────────────────────────────────
Fast key-value lookup           → HashMap                 → O(1) avg
Sorted key-value + range query  → TreeMap                 → O(log n)
Unique elements check           → HashSet                 → O(1) avg
Sorted unique elements          → TreeSet                 → O(log n)
Dynamic array / random access   → ArrayList               → O(1) get
Stack (LIFO)                    → ArrayDeque.push/pop     → O(1)
Queue (FIFO)                    → ArrayDeque.offer/poll   → O(1)
Min/Max element quickly         → PriorityQueue           → O(log n) add, O(1) peek
Build string in loop            → StringBuilder           → O(1) amortized append
Fixed-size numeric data         → int[] / long[]          → O(1) access, cache-friendly
Frequency counting              → HashMap + merge         → O(1) per update
Custom sorted order             → Comparator lambda       → O(n log n) sort
Pair of values                  → int[] or record         → O(1)
Graph adjacency list            → List<List<Integer>>     → O(V + E)
```

---

## Links

- [[collections_internals]] — Deep dive into how HashMap, ArrayList, etc. work internally
- [[streams_and_functional]] — Functional programming in Java (streams, lambdas, Optional)
- [[concurrency_and_threading]] — Multi-threading and thread safety
- [[interview_quick_reference]] — Quick revision cheat sheet for all Java topics
