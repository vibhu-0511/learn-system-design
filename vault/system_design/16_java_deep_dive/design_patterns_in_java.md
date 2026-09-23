#java #design-patterns #lld #interview

# Design Patterns in Java

> 15 patterns every SDE needs — with real problems, Java 17+ code, and where they exist in Spring.

---

## Definitions

| Term | Meaning |
|------|---------|
| **Design Pattern** | Reusable solution to a common software design problem |
| **Creational** | Patterns for creating objects (Singleton, Builder, Factory) |
| **Structural** | Patterns for composing objects (Adapter, Decorator, Proxy, Facade) |
| **Behavioral** | Patterns for object interaction (Strategy, Observer, State, Command) |
| **SOLID** | Five principles for maintainable OOP code |
| **Composition over Inheritance** | Prefer combining objects over extending classes |

---

## Creational Patterns

### 1. Singleton — One Instance Only

**Problem:** Need exactly one instance (config manager, connection pool, logger).

```java
// ✅ BEST: Enum singleton (Josh Bloch's Effective Java recommendation)
enum DatabasePool {
    INSTANCE;
    private final HikariDataSource ds = new HikariDataSource();
    public Connection getConnection() throws SQLException { return ds.getConnection(); }
}
// Cannot be broken by reflection, serialization, or cloning!

// ✅ GOOD: Bill Pugh Holder (lazy, thread-safe, no synchronization overhead)
class Singleton {
    private Singleton() {}
    private static class Holder {
        static final Singleton INSTANCE = new Singleton();
    }
    public static Singleton getInstance() { return Holder.INSTANCE; }
}

// ⚠️ Double-checked locking (correct but complex)
class Singleton {
    private static volatile Singleton instance;  // volatile is REQUIRED!
    private Singleton() {}
    public static Singleton getInstance() {
        if (instance == null) {
            synchronized (Singleton.class) {
                if (instance == null) {
                    instance = new Singleton();
                }
            }
        }
        return instance;
    }
}
```

**Real-world:** Runtime.getRuntime(), Spring beans (default scope = singleton)
**Interview trap:** Singleton broken by reflection, serialization, cloning — enum prevents all three
**Modern take:** DI frameworks (Spring) make Singleton pattern mostly unnecessary

---

### 2. Builder — Step-by-Step Construction

**Problem:** Constructor with 10+ parameters is unreadable and error-prone.

```java
// Record + Builder
record HttpRequest(String url, String method, Map<String, String> headers,
                   String body, int timeout, boolean followRedirects) {

    static class Builder {
        private String url;
        private String method = "GET";
        private final Map<String, String> headers = new HashMap<>();
        private String body;
        private int timeout = 30_000;
        private boolean followRedirects = true;

        Builder(String url) { this.url = url; }  // Required parameter

        Builder method(String method) { this.method = method; return this; }
        Builder header(String key, String value) { headers.put(key, value); return this; }
        Builder body(String body) { this.body = body; return this; }
        Builder timeout(int ms) { this.timeout = ms; return this; }
        Builder followRedirects(boolean follow) { this.followRedirects = follow; return this; }

        HttpRequest build() {
            Objects.requireNonNull(url, "URL is required");
            return new HttpRequest(url, method, Map.copyOf(headers),
                                   body, timeout, followRedirects);
        }
    }
}

// Usage
var request = new HttpRequest.Builder("https://api.example.com")
    .method("POST")
    .header("Content-Type", "application/json")
    .body("{\"name\": \"Alice\"}")
    .timeout(5000)
    .build();
```

**Real-world:** StringBuilder, HttpClient.newBuilder(), Stream.builder()

---

### 3. Factory Method — Create Without Coupling

**Problem:** Code creates objects directly → tightly coupled to concrete classes.

```java
// Interface
interface Notification {
    void send(String message);
}

// Implementations
class EmailNotification implements Notification {
    public void send(String message) { System.out.println("Email: " + message); }
}
class SMSNotification implements Notification {
    public void send(String message) { System.out.println("SMS: " + message); }
}
class PushNotification implements Notification {
    public void send(String message) { System.out.println("Push: " + message); }
}

// Factory
class NotificationFactory {
    static Notification create(String type) {
        return switch (type.toLowerCase()) {
            case "email" -> new EmailNotification();
            case "sms" -> new SMSNotification();
            case "push" -> new PushNotification();
            default -> throw new IllegalArgumentException("Unknown type: " + type);
        };
    }
}

// Client code never knows concrete class
Notification n = NotificationFactory.create("email");
n.send("Hello!");
```

**Real-world:** Calendar.getInstance(), NumberFormat.getInstance()

---

## Structural Patterns

### 4. Adapter — Make Incompatible Interfaces Work

**Problem:** You have a class with one interface, but you need another.

```java
// Old payment system (can't modify)
class LegacyPayment {
    void makePayment(double amount, String currency) {
        System.out.println("Legacy payment: " + amount + " " + currency);
    }
}

// New interface your system expects
interface PaymentProcessor {
    void pay(BigDecimal amount);
}

// Adapter: bridges the gap
class LegacyPaymentAdapter implements PaymentProcessor {
    private final LegacyPayment legacy;

    LegacyPaymentAdapter(LegacyPayment legacy) {
        this.legacy = legacy;
    }

    @Override
    public void pay(BigDecimal amount) {
        legacy.makePayment(amount.doubleValue(), "USD");
    }
}
```

**Real-world:** Arrays.asList(array), InputStreamReader (adapts byte stream to char stream)

---

### 5. Decorator — Add Behavior Dynamically

**Problem:** Need to add features to objects without changing their class.

```java
// Base interface
interface Coffee {
    String description();
    double cost();
}

// Base implementation
record SimpleCoffee() implements Coffee {
    public String description() { return "Simple coffee"; }
    public double cost() { return 2.0; }
}

// Decorators (add behavior by wrapping)
record MilkDecorator(Coffee coffee) implements Coffee {
    public String description() { return coffee.description() + ", milk"; }
    public double cost() { return coffee.cost() + 0.5; }
}

record SugarDecorator(Coffee coffee) implements Coffee {
    public String description() { return coffee.description() + ", sugar"; }
    public double cost() { return coffee.cost() + 0.3; }
}

// Usage: stack decorators
Coffee order = new SugarDecorator(new MilkDecorator(new SimpleCoffee()));
order.description();  // "Simple coffee, milk, sugar"
order.cost();          // 2.8
```

**Real-world:** Java I/O streams! `new BufferedReader(new InputStreamReader(new FileInputStream("file")))`

---

### 6. Facade — Simplify Complex Systems

**Problem:** Client needs to interact with many subsystems.

```java
// Complex subsystems
class InventoryService { boolean checkStock(String item) { return true; } }
class PaymentService { boolean charge(String card, double amount) { return true; } }
class ShippingService { String createShipment(String address) { return "TRACK123"; } }
class NotificationService { void sendEmail(String email, String msg) { } }

// Facade: one simple method
class OrderFacade {
    private final InventoryService inventory;
    private final PaymentService payment;
    private final ShippingService shipping;
    private final NotificationService notification;

    // constructor with all dependencies...

    public String placeOrder(String item, String card, double amount,
                             String address, String email) {
        if (!inventory.checkStock(item))
            throw new RuntimeException("Out of stock");
        if (!payment.charge(card, amount))
            throw new RuntimeException("Payment failed");
        String tracking = shipping.createShipment(address);
        notification.sendEmail(email, "Order shipped! Tracking: " + tracking);
        return tracking;
    }
}
// Client calls ONE method instead of 4 services
```

**Real-world:** Spring's JdbcTemplate (hides Connection, Statement, ResultSet management)

---

### 7. Proxy — Control Access

**Problem:** Need to add logging, caching, or access control without changing the real object.

```java
interface ImageLoader {
    byte[] load(String url);
}

// Real implementation (expensive)
class RealImageLoader implements ImageLoader {
    public byte[] load(String url) {
        System.out.println("Loading from network: " + url);
        return downloadImage(url);  // Slow network call
    }
}

// Proxy: adds caching
class CachingImageProxy implements ImageLoader {
    private final ImageLoader real;
    private final Map<String, byte[]> cache = new HashMap<>();

    CachingImageProxy(ImageLoader real) { this.real = real; }

    public byte[] load(String url) {
        return cache.computeIfAbsent(url, real::load);
        // First call: downloads. Subsequent: returns cached.
    }
}
```

**Real-world:** Spring @Transactional (proxy wraps your service), Hibernate lazy loading

---

## Behavioral Patterns

### 8. Strategy — Swap Algorithms at Runtime

**Problem:** Multiple ways to do the same thing, need to switch between them.

```java
// Strategy interface
interface PricingStrategy {
    BigDecimal calculatePrice(BigDecimal basePrice, int quantity);
}

// Concrete strategies
class RegularPricing implements PricingStrategy {
    public BigDecimal calculatePrice(BigDecimal base, int qty) {
        return base.multiply(BigDecimal.valueOf(qty));
    }
}

class BulkPricing implements PricingStrategy {
    public BigDecimal calculatePrice(BigDecimal base, int qty) {
        BigDecimal discount = qty > 100 ? new BigDecimal("0.8") : new BigDecimal("0.9");
        return base.multiply(BigDecimal.valueOf(qty)).multiply(discount);
    }
}

class PremiumPricing implements PricingStrategy {
    public BigDecimal calculatePrice(BigDecimal base, int qty) {
        return base.multiply(new BigDecimal("1.5")).multiply(BigDecimal.valueOf(qty));
    }
}

// Context: uses whatever strategy is injected
class OrderCalculator {
    private PricingStrategy strategy;

    void setStrategy(PricingStrategy strategy) { this.strategy = strategy; }

    BigDecimal calculate(BigDecimal price, int qty) {
        return strategy.calculatePrice(price, qty);
    }
}
```

**Real-world:** Comparator (sort strategy), Spring's ResourceLoader
**vs if-else:** Use Strategy when you have 3+ algorithms that change independently

---

### 9. Observer — Notify Many on Change

**Problem:** One object changes, many others need to know.

```java
// Using Java's built-in support
interface EventListener<T> {
    void onEvent(T event);
}

class EventBus<T> {
    private final List<EventListener<T>> listeners = new CopyOnWriteArrayList<>();

    void subscribe(EventListener<T> listener) { listeners.add(listener); }
    void unsubscribe(EventListener<T> listener) { listeners.remove(listener); }

    void publish(T event) {
        listeners.forEach(l -> l.onEvent(event));
    }
}

// Usage
record OrderCreatedEvent(Long orderId, String customer) {}

EventBus<OrderCreatedEvent> bus = new EventBus<>();
bus.subscribe(event -> sendEmail(event));        // Email listener
bus.subscribe(event -> updateInventory(event));  // Inventory listener
bus.subscribe(event -> notifyAnalytics(event));  // Analytics listener

bus.publish(new OrderCreatedEvent(1L, "Alice"));
// All 3 listeners notified!
```

**Real-world:** Spring @EventListener, JavaScript event handlers
**Memory leak:** Forgotten listeners keep objects alive — always unsubscribe!

---

### 10. State — Behavior Changes with State

**Problem:** Object behavior changes based on internal state (order status, vending machine).

```java
// States
sealed interface OrderState permits Created, Paid, Shipped, Delivered {
    OrderState pay();
    OrderState ship();
    OrderState deliver();
    String status();
}

record Created() implements OrderState {
    public OrderState pay() { return new Paid(); }
    public OrderState ship() { throw new IllegalStateException("Must pay first"); }
    public OrderState deliver() { throw new IllegalStateException("Must ship first"); }
    public String status() { return "CREATED"; }
}

record Paid() implements OrderState {
    public OrderState pay() { throw new IllegalStateException("Already paid"); }
    public OrderState ship() { return new Shipped(); }
    public OrderState deliver() { throw new IllegalStateException("Must ship first"); }
    public String status() { return "PAID"; }
}

record Shipped() implements OrderState {
    public OrderState pay() { throw new IllegalStateException("Already paid"); }
    public OrderState ship() { throw new IllegalStateException("Already shipped"); }
    public OrderState deliver() { return new Delivered(); }
    public String status() { return "SHIPPED"; }
}

record Delivered() implements OrderState {
    public OrderState pay() { throw new IllegalStateException("Order complete"); }
    public OrderState ship() { throw new IllegalStateException("Order complete"); }
    public OrderState deliver() { throw new IllegalStateException("Already delivered"); }
    public String status() { return "DELIVERED"; }
}

// Usage
class Order {
    private OrderState state = new Created();

    void pay() { state = state.pay(); }
    void ship() { state = state.ship(); }
    void deliver() { state = state.deliver(); }
    String status() { return state.status(); }
}
```

**vs Strategy:** Strategy = injected externally, State = transitions internally

---

### 11. Command — Encapsulate Actions

**Problem:** Want to parameterize actions, queue them, or undo them.

```java
interface Command {
    void execute();
    void undo();
}

class TextEditor {
    private StringBuilder text = new StringBuilder();
    private final Deque<Command> history = new ArrayDeque<>();

    void executeCommand(Command cmd) {
        cmd.execute();
        history.push(cmd);
    }

    void undo() {
        if (!history.isEmpty()) {
            history.pop().undo();
        }
    }

    // Command implementations
    class InsertCommand implements Command {
        private final String content;
        private final int position;

        InsertCommand(String content, int position) {
            this.content = content;
            this.position = position;
        }

        public void execute() { text.insert(position, content); }
        public void undo() { text.delete(position, position + content.length()); }
    }
}
```

**Real-world:** Runnable, Callable, Spring's @Scheduled

---

### 12. Template Method — Fixed Algorithm, Variable Steps

**Problem:** Algorithm structure is the same, but some steps vary.

```java
abstract class DataProcessor {
    // Template method — defines the algorithm
    final void process() {
        var data = readData();
        var validated = validate(data);
        var transformed = transform(validated);
        save(transformed);
    }

    abstract List<String> readData();
    abstract List<String> validate(List<String> data);
    abstract List<String> transform(List<String> data);

    void save(List<String> data) {
        // Default implementation (can be overridden)
        System.out.println("Saving " + data.size() + " records");
    }
}

class CSVProcessor extends DataProcessor {
    List<String> readData() { return readCSVFile(); }
    List<String> validate(List<String> data) { return data.stream().filter(s -> !s.isBlank()).toList(); }
    List<String> transform(List<String> data) { return data.stream().map(String::trim).toList(); }
}
```

**Real-world:** HttpServlet.service() calls doGet/doPost, Spring's JdbcTemplate

---

## Patterns in Spring Boot

```
Pattern          Where Spring Uses It
─────────────────────────────────────────────
Singleton        @Component beans (default scope)
Factory          BeanFactory, FactoryBean
Proxy            @Transactional, @Cacheable, @Async (AOP proxies)
Template Method  JdbcTemplate, RestTemplate
Observer         ApplicationEvent, @EventListener
Strategy         HandlerMethodArgumentResolver, AuthenticationProvider
Decorator        HandlerInterceptor chain, Filter chain
Facade           Spring Data repositories, JdbcTemplate
```

---

## Common Interview Traps

| Trap | Explanation |
|------|-------------|
| Singleton broken by reflection | Use enum singleton to prevent |
| Strategy vs State confusion | Strategy = external injection, State = internal transitions |
| Observer memory leak | Always unsubscribe/remove listeners |
| "When to use patterns?" | When you have 3+ variants or anticipate change. 2 types = just use if-else |
| Decorator vs Proxy | Decorator adds features, Proxy controls access |
| Template Method uses inheritance | Can be fragile — consider Strategy (composition) instead |

---

## When To Use What

```
Problem                                   → Pattern
────────────────────────────────────────────────────────
Need exactly one instance                 → Singleton (or DI scope)
Complex object construction               → Builder
Create objects without coupling            → Factory
Incompatible interfaces                   → Adapter
Add behavior dynamically                  → Decorator
Simplify complex subsystem               → Facade
Control access / caching / lazy loading   → Proxy
Multiple algorithms, swap at runtime      → Strategy
Notify many objects of changes            → Observer
Behavior changes with internal state      → State
Encapsulate + queue + undo actions        → Command
Fixed algorithm, variable steps           → Template Method
```

---

## Links

- [[spring_boot_production]] — How Spring uses these patterns
- [[collections_internals]] — Iterator pattern in collections
- [[concurrency_and_threading]] — Command pattern with Runnable/Callable
- [[exception_handling_and_optional]] — Null Object Pattern
- [[interview_quick_reference]] — Quick revision cheat sheet
- [[11_lld/patterns/creational]] — LLD-focused creational patterns
- [[11_lld/patterns/behavioral]] — LLD-focused behavioral patterns
- [[11_lld/patterns/smell_to_pattern_map]] — Code smell → pattern mapping
