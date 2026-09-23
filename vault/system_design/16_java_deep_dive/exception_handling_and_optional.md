#java #exceptions #optional #interview

# Exception Handling and Optional

> How Java handles errors and null — two things that break every application.

---

## Definitions

| Term | Meaning |
|------|---------|
| **Exception** | An event that disrupts normal program flow — can be caught and handled |
| **Error** | Serious JVM problem (OutOfMemoryError) — usually can't recover |
| **Checked Exception** | Compiler forces you to handle it (try-catch or throws) — recoverable situations |
| **Unchecked Exception** | RuntimeException — compiler doesn't force handling — programming errors |
| **try-with-resources** | Automatically closes resources (files, connections) when block exits |
| **Optional** | Container that may or may not hold a value — null-safe alternative |
| **AutoCloseable** | Interface that enables try-with-resources (defines close() method) |

---

## Exception Hierarchy

```
                         Throwable
                        /          \
                    Error          Exception
                   (DON'T catch)     /          \
                    |           Checked      RuntimeException
                    |           Exception    (Unchecked)
                    |              |              |
              OutOfMemoryError  IOException    NullPointerException
              StackOverflowError SQLException  IllegalArgumentException
              NoClassDefFound   ClassNotFound  ArrayIndexOutOfBounds
                                              ClassCastException
                                              UnsupportedOperationException
                                              ConcurrentModificationException
```

### Checked vs Unchecked — When to Use

```
Checked (extends Exception):
  → Recoverable conditions outside programmer's control
  → Caller CAN do something about it
  → Examples: file not found, network down, invalid SQL
  → Modern preference: AVOID, use unchecked instead (Spring does this)

Unchecked (extends RuntimeException):
  → Programming errors or unrecoverable conditions
  → Caller usually CAN'T do much about it
  → Examples: null pointer, bad argument, illegal state
  → Modern preference: USE THIS for domain exceptions too
```

---

## try-catch-finally

```java
// Basic structure
try {
    riskyOperation();
} catch (IOException e) {
    // Handle I/O error
    log.error("IO failed", e);
} catch (SQLException e) {
    // Handle SQL error
    log.error("SQL failed", e);
} finally {
    // ALWAYS runs (even after return, even after exception)
    cleanup();
}

// Multi-catch (Java 7+): handle multiple exceptions the same way
try {
    riskyOperation();
} catch (IOException | SQLException e) {
    log.error("Operation failed", e);
}

// ⚠️ Order matters: specific BEFORE general
try {
    riskyOperation();
} catch (Exception e) {        // ❌ Too broad — catches everything
    // ...
} catch (IOException e) {      // ❌ Unreachable! Compiler error
    // ...
}

// ✅ Correct order
try {
    riskyOperation();
} catch (FileNotFoundException e) {  // Specific first
    // handle file not found
} catch (IOException e) {            // Then broader
    // handle other I/O errors
}
```

---

## try-with-resources (Java 7+)

### Why: Forgetting to Close = Resource Leak

```java
// ❌ OLD WAY: messy and error-prone
BufferedReader reader = null;
try {
    reader = new BufferedReader(new FileReader("file.txt"));
    String line = reader.readLine();
} catch (IOException e) {
    log.error("Read failed", e);
} finally {
    if (reader != null) {
        try {
            reader.close();  // What if THIS throws?
        } catch (IOException e) {
            // Swallowed exception!
        }
    }
}

// ✅ NEW WAY: try-with-resources (clean, safe, handles suppressed exceptions)
try (BufferedReader reader = new BufferedReader(new FileReader("file.txt"))) {
    String line = reader.readLine();
} catch (IOException e) {
    log.error("Read failed", e);
}
// reader.close() called AUTOMATICALLY, even on exception

// Multiple resources
try (Connection conn = dataSource.getConnection();
     PreparedStatement stmt = conn.prepareStatement(sql);
     ResultSet rs = stmt.executeQuery()) {
    while (rs.next()) {
        // process results
    }
}  // All three closed in REVERSE order: rs → stmt → conn
```

### AutoCloseable Interface

```java
// Any class implementing AutoCloseable works with try-with-resources
class MyResource implements AutoCloseable {
    @Override
    public void close() {
        System.out.println("Resource closed!");
    }
}

try (MyResource r = new MyResource()) {
    // use r
}  // "Resource closed!" printed automatically
```

---

## Custom Exceptions

### When to Create

```
Create custom exceptions when:
1. You need domain-specific error types (UserNotFoundException)
2. You want to include extra context (error code, field name)
3. You want different HTTP status codes in APIs

DON'T create custom exceptions for:
1. Generic errors (just use IllegalArgumentException)
2. Each method (too many exception classes)
```

### Exception Hierarchy for APIs

```java
// Base exception
public class AppException extends RuntimeException {
    private final String errorCode;

    public AppException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
    }

    public AppException(String message, String errorCode, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
    }

    public String getErrorCode() { return errorCode; }
}

// Specific exceptions
public class ResourceNotFoundException extends AppException {
    public ResourceNotFoundException(String resource, Object id) {
        super(resource + " not found with id: " + id, "NOT_FOUND");
    }
}

public class BadRequestException extends AppException {
    public BadRequestException(String message) {
        super(message, "BAD_REQUEST");
    }
}

public class ConflictException extends AppException {
    public ConflictException(String message) {
        super(message, "CONFLICT");
    }
}

// Usage
public User findById(Long id) {
    return userRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("User", id));
}
```

---

## Exception Handling in Spring Boot APIs

### Global Exception Handler

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    // Standard error response
    record ErrorResponse(
        LocalDateTime timestamp,
        int status,
        String error,
        String message,
        String path
    ) {}

    @ExceptionHandler(ResourceNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse handleNotFound(ResourceNotFoundException ex, HttpServletRequest req) {
        return new ErrorResponse(
            LocalDateTime.now(), 404, "Not Found", ex.getMessage(), req.getRequestURI()
        );
    }

    @ExceptionHandler(BadRequestException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleBadRequest(BadRequestException ex, HttpServletRequest req) {
        return new ErrorResponse(
            LocalDateTime.now(), 400, "Bad Request", ex.getMessage(), req.getRequestURI()
        );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleValidation(MethodArgumentNotValidException ex, HttpServletRequest req) {
        String message = ex.getBindingResult().getFieldErrors().stream()
            .map(e -> e.getField() + ": " + e.getDefaultMessage())
            .collect(Collectors.joining(", "));
        return new ErrorResponse(
            LocalDateTime.now(), 400, "Validation Failed", message, req.getRequestURI()
        );
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ErrorResponse handleGeneric(Exception ex, HttpServletRequest req) {
        log.error("Unexpected error", ex);  // Log full stack trace
        return new ErrorResponse(
            LocalDateTime.now(), 500, "Internal Server Error",
            "Something went wrong", req.getRequestURI()  // Don't expose internals!
        );
    }
}
```

### HTTP Status Code Mapping

```
Exception Type              → HTTP Status
──────────────────────────────────────────
Validation error            → 400 Bad Request
Missing auth token          → 401 Unauthorized
No permission               → 403 Forbidden
Resource not found          → 404 Not Found
Duplicate resource          → 409 Conflict
Rate limit exceeded         → 429 Too Many Requests
Unexpected error            → 500 Internal Server Error
Downstream service down     → 502 Bad Gateway / 503 Service Unavailable
```

---

## Exception Best Practices

```java
// 1. Don't catch generic Exception
try { ... }
catch (Exception e) { ... }     // ❌ Catches everything including NPE bugs!
catch (IOException e) { ... }   // ✅ Specific

// 2. Don't swallow exceptions
catch (Exception e) { }         // ❌ Silent failure — impossible to debug
catch (Exception e) {
    log.error("Failed", e);     // ✅ At minimum, log it
}

// 3. Preserve the cause chain
catch (SQLException e) {
    throw new AppException("DB failed");           // ❌ Lost original cause
    throw new AppException("DB failed", "DB_ERR", e);  // ✅ Wraps original
}

// 4. Don't use exceptions for flow control
try {
    int value = map.get(key);   // ❌ Throws NPE if missing
} catch (NullPointerException e) {
    value = defaultValue;
}
// ✅ Use proper API
int value = map.getOrDefault(key, defaultValue);

// 5. Fail fast: validate early
public void transfer(Account from, Account to, BigDecimal amount) {
    Objects.requireNonNull(from, "from account required");
    Objects.requireNonNull(to, "to account required");
    if (amount.compareTo(BigDecimal.ZERO) <= 0) {
        throw new IllegalArgumentException("Amount must be positive");
    }
    // Now do the actual work...
}

// 6. Don't log AND rethrow (double logging)
catch (Exception e) {
    log.error("Failed", e);
    throw e;                    // ❌ Caller might log it again
}
// Either log and handle, OR rethrow — not both
```

---

## Optional Deep Dive

### Creating Optional

```java
// Value is definitely non-null
Optional<String> opt = Optional.of("hello");

// Value might be null
Optional<String> opt = Optional.ofNullable(getUserEmail()); // might return null

// Empty
Optional<String> opt = Optional.empty();

// ⚠️ TRAP:
Optional.of(null);  // 💥 NullPointerException!
```

### Using Optional

```java
Optional<String> opt = findUserEmail(userId);

// ❌ BAD: defeats the purpose
if (opt.isPresent()) {
    String email = opt.get();  // Just null-checking with extra steps!
}

// ✅ GOOD: functional style
String email = opt.orElse("no-reply@example.com");
String email = opt.orElseGet(() -> generateDefaultEmail());
String email = opt.orElseThrow(() -> new ResourceNotFoundException("User", userId));

// Transform
Optional<String> upper = opt.map(String::toUpperCase);

// Chain (when function also returns Optional)
Optional<Address> addr = findUser(userId)
    .flatMap(User::getAddress);  // getAddress returns Optional<Address>

// Filter
Optional<String> longEmail = opt.filter(e -> e.length() > 5);

// Conditional action
opt.ifPresent(email -> sendWelcomeEmail(email));
opt.ifPresentOrElse(
    email -> sendEmail(email),
    () -> log.warn("No email for user")
);
```

### orElse vs orElseGet — THE Interview Trap

```java
// orElse: argument is ALWAYS evaluated
Optional.of("hello").orElse(expensiveComputation());
// expensiveComputation() runs EVEN THOUGH value is present!

// orElseGet: argument is only evaluated when empty
Optional.of("hello").orElseGet(() -> expensiveComputation());
// expensiveComputation() does NOT run (value is present)

// Rule: use orElseGet for anything expensive
// Use orElse only for cheap constants: orElse("default")
```

### Optional Anti-Patterns

```java
// ❌ Optional as parameter
void sendEmail(Optional<String> email) { }
// Confusing: does null Optional mean no email? Does empty Optional?
// ✅ Just use: void sendEmail(@Nullable String email)

// ❌ Optional as field
class User { Optional<String> nickname; }
// Not serializable, memory overhead
// ✅ Just use: @Nullable String nickname

// ❌ Optional.get() without check
opt.get();  // 💥 NoSuchElementException if empty
// ✅ Use orElse, orElseThrow, ifPresent instead

// ❌ Returning Optional of collection
Optional<List<User>> findUsers()  // Confusing
// ✅ Return empty collection: List<User> findUsers() → return List.of()
```

---

## Null Safety Patterns

```java
// Objects.requireNonNull: fail-fast null check
public User(String name, String email) {
    this.name = Objects.requireNonNull(name, "name is required");
    this.email = Objects.requireNonNull(email, "email is required");
}

// Empty collections instead of null
public List<Order> getOrders(Long userId) {
    List<Order> orders = repository.findByUserId(userId);
    return orders != null ? orders : List.of();  // Never return null!
}

// Null Object Pattern
interface NotificationService {
    void send(String message);
}

class EmailNotification implements NotificationService {
    public void send(String message) { /* send email */ }
}

class NoOpNotification implements NotificationService {
    public void send(String message) { /* do nothing */ }
}
// Use NoOpNotification instead of null → no null checks needed
```

---

## Pattern Matching (Java 17+)

```java
// Before: instanceof + cast
if (shape instanceof Circle) {
    Circle c = (Circle) shape;
    return Math.PI * c.radius() * c.radius();
}

// After: pattern matching for instanceof (Java 16+)
if (shape instanceof Circle c) {
    return Math.PI * c.radius() * c.radius();
}

// Switch with pattern matching (Java 17+ preview, Java 21 final)
String describe(Object obj) {
    return switch (obj) {
        case Integer i -> "Integer: " + i;
        case String s -> "String of length " + s.length();
        case null -> "null";
        default -> "Unknown: " + obj;
    };
}

// Sealed classes + pattern matching = exhaustive checks
sealed interface Shape permits Circle, Rectangle, Triangle {}
record Circle(double radius) implements Shape {}
record Rectangle(double w, double h) implements Shape {}
record Triangle(double a, double b, double c) implements Shape {}

double area(Shape shape) {
    return switch (shape) {
        case Circle c -> Math.PI * c.radius() * c.radius();
        case Rectangle r -> r.w() * r.h();
        case Triangle t -> {
            double s = (t.a() + t.b() + t.c()) / 2;
            yield Math.sqrt(s * (s-t.a()) * (s-t.b()) * (s-t.c()));
        }
    };  // No default needed — compiler knows all cases covered!
}
```

---

## Common Interview Traps

### 1. Checked Exception in Lambda

```java
// ❌ Doesn't compile: lambda can't throw checked exception
list.stream().map(s -> {
    return new URL(s);  // MalformedURLException is checked!
});

// ✅ Workaround: wrap in unchecked
list.stream().map(s -> {
    try {
        return new URL(s);
    } catch (MalformedURLException e) {
        throw new RuntimeException(e);  // Wrap in unchecked
    }
});
```

### 2. finally with return

```java
// ❌ finally return OVERRIDES try return!
int broken() {
    try {
        return 1;
    } finally {
        return 2;  // This wins! Returns 2, not 1
    }
}
// NEVER return from finally block
```

### 3. Catching Error

```java
// ❌ Don't catch Error
try {
    // ...
} catch (OutOfMemoryError e) {
    // App is in an inconsistent state — can't reliably recover
    // GC couldn't free memory — what makes you think YOUR code can?
}
// Let Errors crash the JVM. Fix the root cause.
```

---

## When To Use What

```
Situation                               → Use This
──────────────────────────────────────────────────────────
Recoverable I/O error                   → IOException (checked)
Programming error (bad arg, null)       → IllegalArgumentException (unchecked)
Domain error in API                     → Custom RuntimeException + @ControllerAdvice
Method might not return a value         → Optional<T> as return type
Definitely not null                     → Plain type
Resource that needs closing             → try-with-resources
Type checking + casting                 → Pattern matching (Java 17+)
Null check at method entry              → Objects.requireNonNull()
Return empty collection, not null       → Collections.emptyList() or List.of()
```

---

## Links

- [[streams_and_functional]] — Optional in stream pipelines
- [[spring_boot_production]] — Exception handling in Spring Boot APIs
- [[design_patterns_in_java]] — Null Object Pattern
- [[java_essentials_for_dsa]] — Basic error handling in coding rounds
- [[interview_quick_reference]] — Quick revision cheat sheet
