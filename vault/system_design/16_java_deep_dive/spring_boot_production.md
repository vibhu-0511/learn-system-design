#java #spring #springboot #interview

# Spring Boot Production

> Everything you need to build production APIs and ace machine coding rounds.

---

## Definitions

| Term | Meaning |
|------|---------|
| **Spring Boot** | Opinionated framework for building Java web apps — auto-configures everything |
| **Dependency Injection (DI)** | Framework creates and wires objects for you — you declare what you need |
| **IoC Container** | Spring manages object lifecycle (creation → injection → destruction) |
| **Bean** | An object managed by Spring's IoC container |
| **Auto-Configuration** | Spring detects classpath libraries and configures them automatically |
| **@Component** | Tells Spring: "manage this class as a bean" |
| **@Autowired** | Tells Spring: "inject the dependency here" |
| **@RestController** | Class that handles HTTP requests and returns JSON |
| **@Transactional** | Wraps method in database transaction (auto-commit/rollback) |
| **JPA** | Java Persistence API — standard for ORM (object-relational mapping) |
| **HikariCP** | Default connection pool in Spring Boot — fastest Java connection pool |
| **Actuator** | Production monitoring endpoints built into Spring Boot |

---

## Why Spring Boot?

```
WITHOUT Spring Boot:
1. Choose web server (Tomcat? Jetty?)
2. Configure web.xml
3. Set up DispatcherServlet
4. Configure connection pool manually
5. Wire up Jackson for JSON
6. Set up transaction manager
7. Configure security filters
... 100+ decisions before writing any business logic

WITH Spring Boot:
1. Add dependencies
2. Write @RestController
3. Run
Spring Boot makes ALL those decisions for you (auto-configuration).
```

---

## Dependency Injection

### Why DI Exists

```java
// ❌ WITHOUT DI: tight coupling
class OrderService {
    private EmailService emailService = new EmailService();  // Creates its own dependency
    private PaymentGateway payment = new StripeGateway();    // Hardcoded to Stripe!

    // Can't test with mock email service
    // Can't switch to PayPal without changing this class
}

// ✅ WITH DI: loose coupling
class OrderService {
    private final EmailService emailService;      // Just declares what it needs
    private final PaymentGateway paymentGateway;

    OrderService(EmailService email, PaymentGateway payment) {  // Spring injects
        this.emailService = email;
        this.paymentGateway = payment;
    }
    // Can inject mock in tests!
    // Can swap Stripe for PayPal without touching OrderService
}
```

### Bean Stereotypes

```java
@Component          // Generic Spring-managed bean
@Service            // Business logic layer (same as @Component, semantic meaning)
@Repository         // Data access layer (adds exception translation)
@Controller         // Web MVC controller (returns views)
@RestController     // REST API controller (returns JSON) = @Controller + @ResponseBody
@Configuration      // Class that defines @Bean methods
```

### Injection Types

```java
// ✅ BEST: Constructor injection (recommended)
@Service
class OrderService {
    private final UserRepository userRepo;
    private final EmailService emailService;

    // Spring auto-injects (no @Autowired needed with single constructor)
    OrderService(UserRepository userRepo, EmailService emailService) {
        this.userRepo = userRepo;
        this.emailService = emailService;
    }
}
// Why best: immutable, testable, clear dependencies, no partial construction

// ❌ AVOID: Field injection
@Service
class OrderService {
    @Autowired
    private UserRepository userRepo;  // Can't be final, hard to test
}
```

### Bean Lifecycle

```
1. Instantiate (constructor)
2. Populate properties (inject dependencies)
3. BeanPostProcessor (pre-init)
4. @PostConstruct method
5. InitializingBean.afterPropertiesSet()
6. Ready for use
... application runs ...
7. @PreDestroy method
8. DisposableBean.destroy()
9. Bean destroyed
```

```java
@Service
class CacheService {
    @PostConstruct
    void init() {
        // Called after all dependencies injected
        loadCache();
    }

    @PreDestroy
    void cleanup() {
        // Called before bean destroyed
        flushCache();
    }
}
```

---

## Building REST APIs

### Complete CRUD Example

```java
// Entity
@Entity
@Table(name = "users")
class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    private LocalDateTime createdAt = LocalDateTime.now();

    // Constructors, getters, setters
    protected User() {}
    public User(String name, String email) {
        this.name = name;
        this.email = email;
    }
    // getters...
}

// DTOs (Records!)
record CreateUserRequest(@NotBlank String name, @Email @NotBlank String email) {}
record UpdateUserRequest(String name, String email) {}
record UserResponse(Long id, String name, String email, LocalDateTime createdAt) {
    static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getName(),
                               user.getEmail(), user.getCreatedAt());
    }
}

// Repository
interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
}

// Service
@Service
class UserService {
    private final UserRepository repository;

    UserService(UserRepository repository) {
        this.repository = repository;
    }

    public UserResponse create(CreateUserRequest request) {
        if (repository.existsByEmail(request.email())) {
            throw new ConflictException("Email already exists: " + request.email());
        }
        User user = new User(request.name(), request.email());
        return UserResponse.from(repository.save(user));
    }

    public UserResponse findById(Long id) {
        return repository.findById(id)
            .map(UserResponse::from)
            .orElseThrow(() -> new ResourceNotFoundException("User", id));
    }

    public List<UserResponse> findAll() {
        return repository.findAll().stream()
            .map(UserResponse::from)
            .toList();
    }

    public UserResponse update(Long id, UpdateUserRequest request) {
        User user = repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User", id));
        if (request.name() != null) user.setName(request.name());
        if (request.email() != null) user.setEmail(request.email());
        return UserResponse.from(repository.save(user));
    }

    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("User", id);
        }
        repository.deleteById(id);
    }
}

// Controller
@RestController
@RequestMapping("/api/users")
class UserController {
    private final UserService service;

    UserController(UserService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    UserResponse create(@Valid @RequestBody CreateUserRequest request) {
        return service.create(request);
    }

    @GetMapping("/{id}")
    UserResponse findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @GetMapping
    List<UserResponse> findAll() {
        return service.findAll();
    }

    @PutMapping("/{id}")
    UserResponse update(@PathVariable Long id, @RequestBody UpdateUserRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
```

### Request Flow

```
Client → HTTP Request
    │
    ▼
Embedded Tomcat (port 8080)
    │
    ▼
Filter Chain (Security, CORS, Logging)
    │
    ▼
DispatcherServlet (routes to correct controller)
    │
    ▼
@RestController method
    │
    ▼
@Service (business logic)
    │
    ▼
@Repository (database access via JPA)
    │
    ▼
HikariCP Connection Pool → Database
    │
    ▼
Response serialized to JSON (Jackson)
    │
    ▼
Client ← HTTP Response
```

---

## @Transactional

### How It Works

```
Spring creates a PROXY around your bean:

Client → Proxy → Your Service
         │
         ├── Begin transaction
         ├── Call your method
         ├── If success → COMMIT
         └── If RuntimeException → ROLLBACK

The proxy intercepts method calls and wraps them in transactions.
```

```java
@Service
class TransferService {
    @Transactional
    public void transfer(Long fromId, Long toId, BigDecimal amount) {
        Account from = accountRepo.findById(fromId).orElseThrow();
        Account to = accountRepo.findById(toId).orElseThrow();

        from.debit(amount);
        to.credit(amount);

        accountRepo.save(from);
        accountRepo.save(to);
        // If ANY exception here → ALL changes rolled back (both debit and credit)
    }
}
```

### Key Rules

```
Rollback behavior:
- RuntimeException (unchecked) → ROLLBACK ✅
- Checked Exception → NO ROLLBACK ❌ (surprising!)
- To rollback on checked: @Transactional(rollbackFor = Exception.class)

Propagation:
- REQUIRED (default): join existing transaction or create new
- REQUIRES_NEW: always create new transaction (suspends existing)
- NESTED: create savepoint within existing transaction
```

---

## Connection Pooling (HikariCP)

```
Without pool:                        With pool (HikariCP):
Request → Create connection (5ms)    Request → Borrow from pool (0.1ms)
Request → Use connection              Request → Use connection
Request → Close connection            Request → Return to pool

Every request: 5ms overhead           Near-zero overhead!
1000 req/s × 5ms = 5 seconds wasted  Pool manages 10-20 connections
```

```yaml
# application.yml — production HikariCP settings
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/mydb
    username: app_user
    password: ${DB_PASSWORD}
    hikari:
      maximum-pool-size: 20        # Max connections
      minimum-idle: 5              # Keep at least 5 ready
      connection-timeout: 30000    # Wait 30s for connection
      idle-timeout: 600000         # Close idle after 10 min
      max-lifetime: 1800000        # Recreate after 30 min
      leak-detection-threshold: 60000  # Warn if connection held >60s
```

---

## Profiles and Configuration

```yaml
# application.yml (default)
spring:
  profiles:
    active: dev

# application-dev.yml
spring:
  datasource:
    url: jdbc:h2:mem:testdb
  jpa:
    show-sql: true

# application-prod.yml
spring:
  datasource:
    url: jdbc:postgresql://prod-db:5432/mydb
  jpa:
    show-sql: false
```

```java
// Profile-specific beans
@Configuration
class StorageConfig {
    @Bean
    @Profile("dev")
    StorageService localStorage() {
        return new LocalStorageService();  // Local filesystem in dev
    }

    @Bean
    @Profile("prod")
    StorageService s3Storage() {
        return new S3StorageService();  // S3 in production
    }
}
```

---

## Spring Boot Actuator

```yaml
# application.yml
management:
  endpoints:
    web:
      exposure:
        include: health, metrics, info, prometheus
  endpoint:
    health:
      show-details: always
```

```
GET /actuator/health     → {"status":"UP","components":{...}}
GET /actuator/metrics    → List of all metrics
GET /actuator/prometheus → Prometheus-formatted metrics
GET /actuator/info       → Application info
```

---

## Machine Coding Round Template

### Project Setup (First 5 Minutes)

```
Use start.spring.io or IntelliJ:

Dependencies:
- Spring Web
- Spring Data JPA
- H2 Database (in-memory for coding round)
- Validation
- Lombok (optional)

Package structure:
src/main/java/com/example/app/
├── controller/
├── service/
├── repository/
├── model/         (entities)
├── dto/           (request/response records)
├── exception/     (custom exceptions + handler)
└── config/        (if needed)
```

### application.yml

```yaml
spring:
  datasource:
    url: jdbc:h2:mem:testdb
    driver-class-name: org.h2.Driver
  jpa:
    hibernate:
      ddl-auto: create-drop
    show-sql: true
  h2:
    console:
      enabled: true
```

### Exception Setup (Copy-Paste Ready)

```java
// exceptions/ResourceNotFoundException.java
class ResourceNotFoundException extends RuntimeException {
    ResourceNotFoundException(String resource, Object id) {
        super(resource + " not found with id: " + id);
    }
}

// exceptions/GlobalExceptionHandler.java
@RestControllerAdvice
class GlobalExceptionHandler {
    record ErrorResponse(int status, String message, LocalDateTime timestamp) {}

    @ExceptionHandler(ResourceNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    ErrorResponse handleNotFound(ResourceNotFoundException ex) {
        return new ErrorResponse(404, ex.getMessage(), LocalDateTime.now());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    ErrorResponse handleValidation(MethodArgumentNotValidException ex) {
        String msg = ex.getBindingResult().getFieldErrors().stream()
            .map(e -> e.getField() + ": " + e.getDefaultMessage())
            .collect(Collectors.joining(", "));
        return new ErrorResponse(400, msg, LocalDateTime.now());
    }
}
```

---

## Common Interview Traps

### 1. @Transactional on Private Method

```java
@Service
class OrderService {
    @Transactional
    private void processOrder() {  // ❌ DOESN'T WORK!
        // Spring proxy can't intercept private methods
    }

    @Transactional
    public void processOrder() {  // ✅ Must be public
        // Spring proxy intercepts this
    }
}
```

### 2. @Transactional Self-Invocation

```java
@Service
class OrderService {
    public void createOrder() {
        // ...
        processPayment();  // ❌ Calls directly, bypasses proxy!
        // Transaction NOT applied to processPayment!
    }

    @Transactional
    public void processPayment() {
        // This won't be in a transaction when called from createOrder!
    }
}
// Fix: inject self, or extract to separate service
```

### 3. Circular Dependency

```java
@Service
class A {
    private final B b;
    A(B b) { this.b = b; }
}

@Service
class B {
    private final A a;
    B(A a) { this.a = a; }
}
// 💥 BeanCurrentlyInCreationException!
// Fix: redesign (extract shared logic) or use @Lazy on one
```

### 4. N+1 Query Problem

```java
// ❌ N+1: 1 query for orders + N queries for items
List<Order> orders = orderRepository.findAll();
for (Order o : orders) {
    o.getItems().size();  // Triggers lazy load query for EACH order!
}

// ✅ Fix: JOIN FETCH
@Query("SELECT o FROM Order o JOIN FETCH o.items")
List<Order> findAllWithItems();
```

### 5. Constructor vs Field Injection

```java
// ❌ Field injection: can't be final, hard to test
@Autowired private UserRepository repo;  // Mutable, hidden dependency

// ✅ Constructor injection: immutable, testable, explicit
private final UserRepository repo;
MyService(UserRepository repo) { this.repo = repo; }
// In test: new MyService(mockRepo) ← easy!
```

---

## When To Use What

```
Layer               Annotation        Responsibility
Controller          @RestController   HTTP handling, validation, response
Service             @Service          Business logic, transactions
Repository          @Repository       Data access, queries
Configuration       @Configuration    Bean definitions, profiles
```

---

## Links

- [[concurrency_and_threading]] — Thread pools, @Async patterns
- [[jvm_and_memory]] — JVM tuning for Spring Boot
- [[exception_handling_and_optional]] — Exception handling patterns
- [[design_patterns_in_java]] — Patterns Spring uses internally
- [[collections_internals]] — Data structures in service code
- [[interview_quick_reference]] — Quick revision cheat sheet
- [[02_building_blocks/api_gateway]] — Gateway patterns
- [[02_building_blocks/caching]] — Caching strategies
- [[02_building_blocks/monitoring_and_logging]] — Production observability
