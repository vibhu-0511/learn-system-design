#system-design #pattern #architecture

# CQRS (Command Query Responsibility Segregation)

## Intuition (30 sec)

A restaurant kitchen (writes) and a display menu (reads) are separate systems. The kitchen handles orders (commands). The menu board shows what's available (queries). They're updated independently. The menu doesn't need to know how the kitchen works.

## Failure-First Scenario

> Your e-commerce product page needs: product details, reviews, ratings, recommendations, inventory count. One complex SQL query with 5 JOINs takes 800ms. Meanwhile, writes (place order, add review) also hit the same tables, causing lock contention. Reads and writes have different performance needs.

## Visual Architecture

### CQRS Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT APPLICATIONS                         │
│                    (Web, Mobile, API Consumers)                      │
└────────────┬─────────────────────────────────────┬──────────────────┘
             │                                     │
             │ Commands                            │ Queries
             │ (Write Operations)                  │ (Read Operations)
             ▼                                     ▼
    ┌────────────────────┐              ┌────────────────────┐
    │  COMMAND SERVICE   │              │   QUERY SERVICE    │
    │                    │              │                    │
    │  - Validate input  │              │  - No validation   │
    │  - Apply rules     │              │  - Direct reads    │
    │  - Emit events     │              │  - Fast queries    │
    └─────────┬──────────┘              └─────────┬──────────┘
              │                                   │
              │ Write                             │ Read
              ▼                                   ▼
    ┌────────────────────┐              ┌────────────────────┐
    │   WRITE MODEL      │              │   READ MODEL(S)    │
    │                    │              │                    │
    │ PostgreSQL (ACID)  │              │ Multiple stores:   │
    │ - Normalized       │              │ - MongoDB (docs)   │
    │ - Consistent       │──Events─────>│ - Elasticsearch    │
    │ - Transactional    │   (Async)    │ - Redis (cache)    │
    │                    │              │ - Cassandra (wide) │
    └────────────────────┘              └────────────────────┘
              │                                   ▲
              │                                   │
              └──────────> MESSAGE BUS ───────────┘
                        (Kafka, RabbitMQ)

                     Eventual Consistency
                     Lag: 50-500ms typical
```

### Command Flow (Write Path)

```
┌──────┐  1. PlaceOrder    ┌─────────────────────┐
│Client├──────────────────>│  Command Handler    │
└──────┘                   │                     │
                           │  Validation Layer   │
                           │  - Check inventory  │
                           │  - Verify payment   │
                           │  - Business rules   │
                           └──────────┬──────────┘
                                      │ 2. Valid
                                      ▼
                           ┌─────────────────────┐
                           │   Write Database    │
                           │                     │
                           │  BEGIN TRANSACTION  │
                           │  INSERT orders      │
                           │  UPDATE inventory   │
                           │  INSERT audit_log   │
                           │  COMMIT             │
                           └──────────┬──────────┘
                                      │ 3. Success
                                      ▼
                           ┌─────────────────────┐
                           │   Event Publisher   │
                           │                     │
                           │  OrderPlacedEvent   │
                           │  {                  │
                           │    orderId: "123",  │
                           │    userId: "u1",    │
                           │    items: [...],    │
                           │    total: 99.99,    │
                           │    timestamp: ...   │
                           │  }                  │
                           └──────────┬──────────┘
                                      │ 4. Publish
                                      ▼
                           ┌─────────────────────┐
                           │   Message Broker    │
                           │    (Kafka/RabbitMQ) │
                           └─────────────────────┘

Response to Client: { "orderId": "123", "status": "accepted" }
(Read model updates asynchronously)
```

### Query Flow (Read Path)

```
┌──────┐  1. GetOrderHistory  ┌─────────────────────┐
│Client├─────────────────────>│   Query Handler     │
└──────┘                       │                     │
                               │  No Validation      │
                               │  No Business Logic  │
                               │  Just Fetch Data    │
                               └──────────┬──────────┘
                                          │ 2. Query
                                          ▼
                     ┌────────────────────────────────┐
                     │      Read Model Store          │
                     │                                │
                     │  Denormalized View:            │
                     │  user_orders {                 │
                     │    userId: "u1",               │
                     │    orders: [                   │
                     │      {                         │
                     │        orderId: "123",         │
                     │        date: "2026-02-14",     │
                     │        items: [                │
                     │          {name, price, qty}    │
                     │        ],                      │
                     │        total: 99.99,           │
                     │        status: "delivered"     │
                     │      }                         │
                     │    ]                           │
                     │  }                             │
                     │                                │
                     │  NO JOINS NEEDED!              │
                     │  Single document/row fetch     │
                     │  Response time: <10ms          │
                     └────────────────────────────────┘

Response to Client: { "orders": [...] }
(Pre-computed, optimized for display)
```

### Synchronization Between Models

```
┌─────────────────────────────────────────────────────────────────┐
│                    EVENT-DRIVEN SYNCHRONIZATION                  │
└─────────────────────────────────────────────────────────────────┘

Write Model                Message Bus              Read Model(s)
    │                          │                          │
    │ 1. OrderPlaced           │                          │
    ├──────Event──────────────>│                          │
    │                          │                          │
    │                          │ 2. Subscribe             │
    │                          │<─────────────────────────┤
    │                          │                          │
    │                          │ 3. Deliver Event         │
    │                          ├──────────────────────────>│
    │                          │                          │
    │                          │                          │ 4. Project
    │                          │                          ├──────────┐
    │                          │                          │          │
    │                          │                          │<─────────┘
    │                          │                          │
    │                          │ 5. Ack                   │
    │                          │<─────────────────────────┤
    │                          │                          │

┌──────────────────────────────────────────────────────────────────┐
│  PROJECTION PATTERNS                                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Event: OrderPlacedEvent                                         │
│                                                                  │
│  Projections:                                                    │
│                                                                  │
│  1. UserOrderHistory (MongoDB)                                   │
│     - Append to user's order list                                │
│     - Update order count                                         │
│     - Calculate lifetime value                                   │
│                                                                  │
│  2. ProductInventoryView (Redis)                                 │
│     - Decrement available count                                  │
│     - Update "trending" flag                                     │
│                                                                  │
│  3. SearchIndex (Elasticsearch)                                  │
│     - Index order for admin search                               │
│     - Update product search ranking                              │
│                                                                  │
│  4. AnalyticsDashboard (Cassandra)                               │
│     - Increment daily revenue                                    │
│     - Update hourly order count                                  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

Sync Lag: 50-500ms typical, 2-5s at peak load
```

## Working Knowledge (5 min)

### Core Definitions

**CQRS (Command Query Responsibility Segregation)**
Architectural pattern that separates read operations (queries) from write operations (commands) using different models optimized for each purpose.

**Command**
An intent to change system state. Represents a request to perform an action (e.g., PlaceOrder, UpdateProfile, CancelSubscription). Commands are validated and can fail.

**Query**
A request to retrieve data without changing state. Queries read from optimized read models and never modify data (e.g., GetOrderHistory, SearchProducts).

**Write Model**
The authoritative, normalized database optimized for consistency and integrity. Handles all writes, enforces business rules, maintains ACID transactions.

**Read Model**
Denormalized, optimized data structures for fast queries. Built from write model events. Multiple read models can exist for different query patterns. Eventually consistent with write model.

**Eventual Consistency**
The read model will eventually reflect write model changes, but there's a time lag (typically 50-500ms). Guarantees consistency will be reached, but not immediately.

**Projection**
The process of transforming write model events into read model data structures. A projection handler listens to events and updates read models accordingly.

**Materialized View**
A pre-computed, denormalized data structure in the read model. Updated by projections, optimized for specific query patterns. Eliminates need for complex joins at query time.

### The Core Idea

**Traditional:** One model for both reads and writes.
**CQRS:** Separate models optimized for their purpose.

```
TRADITIONAL MODEL (Shared)
┌────────────────────────────┐
│    Application Code        │
│  ┌──────────────────────┐  │
│  │  Business Logic      │  │
│  │  (reads + writes)    │  │
│  └──────────┬───────────┘  │
│             │              │
│      ┌──────▼──────┐       │
│      │  Single DB  │       │
│      │  (balanced) │       │
│      └─────────────┘       │
└────────────────────────────┘
Problems:
- Competing optimization needs
- Read JOINs slow writes
- Lock contention
- Can't scale independently


CQRS MODEL (Separated)
┌─────────────────────────────────────┐
│        Application Code             │
│  ┌─────────────┐  ┌──────────────┐  │
│  │  Command    │  │    Query     │  │
│  │  Service    │  │    Service   │  │
│  └──────┬──────┘  └──────┬───────┘  │
│         │                │          │
│    ┌────▼─────┐     ┌────▼──────┐   │
│    │ Write DB │────>│ Read DB   │   │
│    │(normal.) │evt  │(denormal.)│   │
│    │  ACID    │     │  Fast     │   │
│    └──────────┘     └───────────┘   │
└─────────────────────────────────────┘
Benefits:
- Optimized for each pattern
- Scale independently
- Different technologies
- No lock contention
```

### Write Model (Commands)
- Normalized, optimized for data integrity
- ACID transactions
- Validates business rules
- "PlaceOrder," "UpdateProfile," "AddReview"
- Response: Success/failure acknowledgment
- Technology: PostgreSQL, MySQL, SQL Server

### Read Model (Queries)
- Denormalized, optimized for fast reads
- Pre-computed views, no JOINs needed
- Eventually consistent with write model
- "ShowProductPage," "ListUserOrders," "DisplayFeed"
- Response: Pre-formatted data ready for display
- Technology: MongoDB, Elasticsearch, Redis, Cassandra

### Syncing Read and Write Models

Write DB → **Events** → Read DB

When an order is placed:
1. Write model: INSERT into orders table
2. Emit event: "OrderPlaced"
3. Read model: Update denormalized product page view, update user order list

## Spring Boot CQRS Example Architecture

```java
┌────────────────────────────────────────────────────────────────┐
│                   SPRING BOOT CQRS STRUCTURE                   │
└────────────────────────────────────────────────────────────────┘

// ============================================================
//                    COMMAND SIDE
// ============================================================

@RestController
@RequestMapping("/api/commands")
public class OrderCommandController {

    @Autowired
    private CommandBus commandBus;

    @PostMapping("/orders")
    public ResponseEntity<CommandResponse> placeOrder(
        @RequestBody @Valid PlaceOrderRequest request
    ) {
        // Send command to command bus
        PlaceOrderCommand command = new PlaceOrderCommand(
            UUID.randomUUID(),
            request.getUserId(),
            request.getItems(),
            request.getPaymentInfo()
        );

        CommandResponse response = commandBus.dispatch(command);
        return ResponseEntity.accepted().body(response);
    }
}

// Command object (immutable)
@Value  // Lombok: makes class immutable
public class PlaceOrderCommand {
    UUID orderId;
    String userId;
    List<OrderItem> items;
    PaymentInfo paymentInfo;
}

// Command handler
@Component
public class PlaceOrderCommandHandler
    implements CommandHandler<PlaceOrderCommand> {

    @Autowired
    private OrderRepository orderRepository;  // Write model

    @Autowired
    private EventPublisher eventPublisher;

    @Override
    @Transactional  // ACID transaction
    public CommandResponse handle(PlaceOrderCommand command) {
        // 1. Validate business rules
        validateInventory(command.getItems());
        validatePayment(command.getPaymentInfo());

        // 2. Create and save aggregate
        Order order = Order.create(
            command.getOrderId(),
            command.getUserId(),
            command.getItems(),
            command.getPaymentInfo()
        );
        orderRepository.save(order);

        // 3. Publish domain event
        OrderPlacedEvent event = new OrderPlacedEvent(
            order.getId(),
            order.getUserId(),
            order.getItems(),
            order.getTotal(),
            Instant.now()
        );
        eventPublisher.publish(event);

        return CommandResponse.success(order.getId());
    }
}

// Write model repository (JPA)
@Repository
public interface OrderRepository
    extends JpaRepository<Order, UUID> {
    // Standard JPA repository
    // Uses normalized schema with foreign keys
}

// ============================================================
//                    QUERY SIDE
// ============================================================

@RestController
@RequestMapping("/api/queries")
public class OrderQueryController {

    @Autowired
    private OrderQueryService queryService;

    @GetMapping("/users/{userId}/orders")
    public ResponseEntity<UserOrderHistoryView> getOrderHistory(
        @PathVariable String userId
    ) {
        // Direct read from read model
        UserOrderHistoryView view = queryService
            .getUserOrderHistory(userId);
        return ResponseEntity.ok(view);
    }

    @GetMapping("/orders/search")
    public ResponseEntity<List<OrderSearchResult>> searchOrders(
        @RequestParam String query
    ) {
        List<OrderSearchResult> results = queryService
            .searchOrders(query);
        return ResponseEntity.ok(results);
    }
}

// Query service (no business logic)
@Service
public class OrderQueryService {

    @Autowired
    private MongoTemplate mongoTemplate;  // Read model #1

    @Autowired
    private ElasticsearchOperations elasticsearchOps;  // Read model #2

    public UserOrderHistoryView getUserOrderHistory(String userId) {
        // Single document fetch, no joins
        return mongoTemplate.findById(
            userId,
            UserOrderHistoryView.class,
            "user_order_history"
        );
    }

    public List<OrderSearchResult> searchOrders(String query) {
        // Full-text search in Elasticsearch
        NativeSearchQuery searchQuery = new NativeSearchQueryBuilder()
            .withQuery(QueryBuilders.multiMatchQuery(query,
                "orderId", "items", "status"))
            .build();

        return elasticsearchOps
            .search(searchQuery, OrderSearchResult.class)
            .getSearchHits()
            .stream()
            .map(SearchHit::getContent)
            .collect(Collectors.toList());
    }
}

// Read model document (MongoDB)
@Document(collection = "user_order_history")
@Data
public class UserOrderHistoryView {
    @Id
    private String userId;

    private List<OrderSummary> orders;  // Denormalized
    private int totalOrders;
    private BigDecimal lifetimeValue;
    private LocalDateTime lastOrderDate;

    @Data
    public static class OrderSummary {
        private UUID orderId;
        private LocalDateTime date;
        private List<OrderItemView> items;  // Fully denormalized
        private BigDecimal total;
        private String status;
        // Everything needed for display, no joins
    }
}

// ============================================================
//              EVENT HANDLING (Synchronization)
// ============================================================

@Component
public class OrderProjection {

    @Autowired
    private MongoTemplate mongoTemplate;

    @Autowired
    private ElasticsearchOperations elasticsearchOps;

    // Listen to events from write model
    @KafkaListener(topics = "order-events", groupId = "order-projection")
    public void handleOrderPlacedEvent(OrderPlacedEvent event) {
        // Project to multiple read models
        updateUserOrderHistory(event);
        updateSearchIndex(event);
        updateAnalytics(event);
    }

    private void updateUserOrderHistory(OrderPlacedEvent event) {
        // Update MongoDB read model
        Query query = Query.query(
            Criteria.where("_id").is(event.getUserId())
        );

        Update update = new Update()
            .push("orders", createOrderSummary(event))
            .inc("totalOrders", 1)
            .inc("lifetimeValue", event.getTotal())
            .set("lastOrderDate", event.getTimestamp());

        mongoTemplate.upsert(
            query,
            update,
            UserOrderHistoryView.class
        );
    }

    private void updateSearchIndex(OrderPlacedEvent event) {
        // Update Elasticsearch read model
        OrderSearchResult searchDoc = new OrderSearchResult(
            event.getOrderId(),
            event.getUserId(),
            event.getItems().stream()
                .map(item -> item.getName())
                .collect(Collectors.joining(" ")),
            "PLACED",
            event.getTimestamp()
        );

        elasticsearchOps.save(searchDoc);
    }
}

// ============================================================
//                  CONFIGURATION
// ============================================================

@Configuration
public class CqrsConfiguration {

    // Write model: PostgreSQL
    @Bean
    @Primary
    @ConfigurationProperties("spring.datasource.write")
    public DataSource writeDataSource() {
        return DataSourceBuilder.create().build();
    }

    // Read model: MongoDB
    @Bean
    public MongoClient mongoClient(
        @Value("${spring.data.mongodb.uri}") String uri
    ) {
        return MongoClients.create(uri);
    }

    // Read model: Elasticsearch
    @Bean
    public RestHighLevelClient elasticsearchClient(
        @Value("${spring.elasticsearch.uris}") String[] uris
    ) {
        return new RestHighLevelClient(
            RestClient.builder(
                Arrays.stream(uris)
                    .map(HttpHost::create)
                    .toArray(HttpHost[]::new)
            )
        );
    }

    // Event bus: Kafka
    @Bean
    public ProducerFactory<String, DomainEvent> producerFactory() {
        Map<String, Object> config = new HashMap<>();
        config.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG,
            "localhost:9092");
        config.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG,
            StringSerializer.class);
        config.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG,
            JsonSerializer.class);
        return new DefaultKafkaProducerFactory<>(config);
    }

    @Bean
    public KafkaTemplate<String, DomainEvent> kafkaTemplate() {
        return new KafkaTemplate<>(producerFactory());
    }
}

// ============================================================
//                   APPLICATION.YML
// ============================================================

spring:
  # Write model datasource
  datasource:
    write:
      url: jdbc:postgresql://localhost:5432/orders_write
      username: writeuser
      password: ${DB_WRITE_PASSWORD}
      hikari:
        maximum-pool-size: 20

  # Read model: MongoDB
  data:
    mongodb:
      uri: mongodb://localhost:27017/orders_read

  # Read model: Elasticsearch
  elasticsearch:
    uris: http://localhost:9200

  # Event bus: Kafka
  kafka:
    bootstrap-servers: localhost:9092
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.springframework.kafka.support.serializer.JsonSerializer
    consumer:
      group-id: order-projection
      auto-offset-reset: earliest

cqrs:
  # Read-after-write configuration
  read-your-writes:
    enabled: true
    timeout-ms: 500  # Wait up to 500ms for read model sync
```

## Monitoring Dashboard

```
┌─────────────────────────────────────────────────────────────────────┐
│                     CQRS MONITORING DASHBOARD                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  SYNCHRONIZATION LAG (Real-time)                              │ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │                                                               │ │
│  │  Current Lag:  147ms  ████░░░░░░  (Normal: < 500ms)          │ │
│  │  P50 Lag:       92ms                                          │ │
│  │  P95 Lag:      380ms                                          │ │
│  │  P99 Lag:      850ms  ⚠️  (Alert: > 1000ms)                  │ │
│  │                                                               │ │
│  │  Lag by Read Model:                                           │ │
│  │    MongoDB (UserOrderHistory):     120ms ████████░░           │ │
│  │    Elasticsearch (Search):         180ms ██████████░          │ │
│  │    Redis (Cache):                   45ms ██░░░░░░░░          │ │
│  │    Cassandra (Analytics):          210ms ████████████         │ │
│  │                                                               │ │
│  │  Event Queue Depth:  328 messages                             │ │
│  │  Consumer Lag:       12 seconds (by offset)                   │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  QUERY PERFORMANCE (Last 5 minutes)                           │ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │                                                               │ │
│  │  Average Response Time:  12ms                                 │ │
│  │  P95 Response Time:      45ms                                 │ │
│  │  P99 Response Time:      89ms                                 │ │
│  │                                                               │ │
│  │  Query Throughput:  5,420 req/sec  ▲ 12% from last hour      │ │
│  │                                                               │ │
│  │  Response Time Distribution:                                  │ │
│  │    < 10ms:   ████████████████████░  68%                      │ │
│  │    10-50ms:  █████░░░░░░░░░░░░░░░  25%                       │ │
│  │    50-100ms: █░░░░░░░░░░░░░░░░░░░   5%                       │ │
│  │    > 100ms:  ░░░░░░░░░░░░░░░░░░░░   2%  ⚠️                  │ │
│  │                                                               │ │
│  │  Queries by Type:                                             │ │
│  │    GetOrderHistory:       3,200/sec  (59%)                    │ │
│  │    SearchProducts:        1,800/sec  (33%)                    │ │
│  │    GetProductDetails:       420/sec  (8%)                     │ │
│  │                                                               │ │
│  │  Cache Hit Rate:  94.2%  ████████████████████░                │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  COMMAND THROUGHPUT (Last 5 minutes)                          │ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │                                                               │ │
│  │  Command Rate:  380 cmd/sec  ▼ 3% from last hour             │ │
│  │                                                               │ │
│  │  Average Processing Time:  45ms                               │ │
│  │  P95 Processing Time:     120ms                               │ │
│  │  P99 Processing Time:     280ms                               │ │
│  │                                                               │ │
│  │  Commands by Type:                                            │ │
│  │    PlaceOrder:           280/sec  (74%)                       │ │
│  │    UpdateInventory:       65/sec  (17%)                       │ │
│  │    CancelOrder:           35/sec  (9%)                        │ │
│  │                                                               │ │
│  │  Success Rate:  99.7%  ████████████████████░                  │ │
│  │  Failure Rate:   0.3%  (12 failures/5min)                     │ │
│  │                                                               │ │
│  │  Top Failure Reasons:                                         │ │
│  │    1. Insufficient inventory:     7 failures                  │ │
│  │    2. Payment validation failed:  3 failures                  │ │
│  │    3. Database timeout:           2 failures  ⚠️              │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  CONSISTENCY METRICS                                          │ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │                                                               │ │
│  │  Read-Your-Writes Violations:  23 (0.4% of writes)            │ │
│  │    User read before sync:      18                             │ │
│  │    Timeout waiting for sync:    5  ⚠️                        │ │
│  │                                                               │ │
│  │  Event Processing Success:  99.96%                            │ │
│  │  Failed Projections:  12 (with retry)                         │ │
│  │  Dead Letter Queue:   3 messages  ⚠️                         │ │
│  │                                                               │ │
│  │  Stale Read Detection:                                        │ │
│  │    Reads with lag > 1s:   45 (0.8%)                           │ │
│  │    Reads with lag > 5s:    3 (0.05%)  ⚠️                     │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  RESOURCE UTILIZATION                                         │ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │                                                               │ │
│  │  Write Database (PostgreSQL):                                 │ │
│  │    CPU: 45%  ████████░░░░░░░░░░                              │ │
│  │    Connections: 18/20                                         │ │
│  │    Active transactions: 5                                     │ │
│  │    Lock wait time: 2ms avg                                    │ │
│  │                                                               │ │
│  │  Read Models:                                                 │ │
│  │    MongoDB CPU: 28%  █████░░░░░░░░░░░░░                      │ │
│  │    Elasticsearch CPU: 35%  ███████░░░░░░░░░░                 │ │
│  │    Redis Memory: 2.1GB/4GB  ██████████░░░░░                  │ │
│  │                                                               │ │
│  │  Message Broker (Kafka):                                      │ │
│  │    Throughput: 1.2MB/sec                                      │ │
│  │    Partitions: 12 (balanced)                                  │ │
│  │    Replication lag: 45ms                                      │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  ALERTS (Active)                                              │ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │                                                               │ │
│  │  🟡 WARNING: P99 sync lag exceeded 1000ms threshold           │ │
│  │     Affected: Elasticsearch read model                        │ │
│  │     Duration: 3 minutes                                       │ │
│  │                                                               │ │
│  │  🟡 WARNING: Dead letter queue has 3 messages                 │ │
│  │     Events failed after 3 retries                             │ │
│  │     Action: Manual investigation required                     │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘

Key Metrics to Monitor:
- Sync lag (P50, P95, P99)
- Query response times
- Command processing times
- Event processing success rate
- Read-your-writes violations
- Dead letter queue depth
- Resource utilization per store
```

## Decision Tree: When to Use CQRS

```
                        Start Here
                             │
                             ▼
                ┌────────────────────────┐
                │ Do you have a simple   │
                │ CRUD application?      │
                └─────────┬──────────────┘
                          │
                 ┌────────┴────────┐
                 │                 │
               Yes                No
                 │                 │
                 ▼                 ▼
         ┌───────────────┐  ┌─────────────────────┐
         │ DON'T USE     │  │ Is read/write ratio │
         │ CQRS          │  │ highly asymmetric?  │
         │               │  │ (>10:1 or <1:10)    │
         │ Use standard  │  └──────────┬──────────┘
         │ MVC/CRUD      │             │
         └───────────────┘    ┌────────┴────────┐
                              │                 │
                            Yes                No
                              │                 │
                              ▼                 ▼
                   ┌──────────────────┐  ┌────────────────────┐
                   │ Do you need to   │  │ Do you have        │
                   │ scale reads and  │  │ complex read       │
                   │ writes            │  │ queries with       │
                   │ independently?   │  │ multiple JOINs?    │
                   └────────┬─────────┘  └─────────┬──────────┘
                            │                      │
                   ┌────────┴────────┐    ┌────────┴────────┐
                   │                 │    │                 │
                 Yes                No   Yes                No
                   │                 │    │                 │
                   │                 │    │                 │
                   └────────┬────────┘    │                 │
                            │             │                 │
                            ▼             ▼                 ▼
                   ┌──────────────────────────┐    ┌───────────────┐
                   │ Can your team handle     │    │ Consider      │
                   │ eventual consistency?    │    │ caching first │
                   │ (50-500ms lag)           │    │               │
                   └─────────┬────────────────┘    │ Redis/CDN may │
                             │                     │ be enough     │
                    ┌────────┴────────┐            └───────────────┘
                    │                 │
                  Yes                No
                    │                 │
                    ▼                 ▼
           ┌─────────────────┐  ┌────────────────────┐
           │ Does your team   │  │ DON'T USE CQRS    │
           │ have experience  │  │                    │
           │ with distributed │  │ Stick with         │
           │ systems?         │  │ synchronous reads  │
           └────────┬─────────┘  └────────────────────┘
                    │
           ┌────────┴────────┐
           │                 │
         Yes                No
           │                 │
           ▼                 ▼
  ┌─────────────────┐  ┌──────────────────┐
  │ USE CQRS        │  │ START SIMPLE      │
  │                 │  │                   │
  │ Benefits:       │  │ Use basic CQRS    │
  │ - Scale reads   │  │ (same DB, diff    │
  │ - Fast queries  │  │ models) and learn │
  │ - Flexibility   │  │                   │
  └─────────────────┘  └──────────────────┘


┌─────────────────────────────────────────────────────────────┐
│  CQRS COMPLEXITY LEVELS                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Level 1: Code-Level CQRS                                   │
│  ├─ Same database                                           │
│  ├─ Separate command/query services in code                 │
│  ├─ Immediate consistency                                   │
│  └─ Complexity: LOW    Best for: Learning CQRS              │
│                                                             │
│  Level 2: Database-Level CQRS                               │
│  ├─ Write DB: PostgreSQL (normalized)                       │
│  ├─ Read DB: Same PostgreSQL (denorm views)                 │
│  ├─ Sync via triggers or jobs                               │
│  └─ Complexity: MEDIUM  Best for: Moderate scale            │
│                                                             │
│  Level 3: Multi-Store CQRS                                  │
│  ├─ Write DB: PostgreSQL                                    │
│  ├─ Read DB: Multiple (MongoDB, Elasticsearch, Redis)       │
│  ├─ Sync via message bus (Kafka)                            │
│  └─ Complexity: HIGH    Best for: High scale                │
│                                                             │
│  Level 4: Event-Sourced CQRS                                │
│  ├─ Write: Event store (append-only)                        │
│  ├─ Read: Projections from events                           │
│  ├─ Full event history, replay capability                   │
│  └─ Complexity: VERY HIGH  Best for: Audit/compliance needs │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Quick Decision Matrix:

┌───────────────────┬──────────┬───────────┬──────────────┐
│ Your Situation    │ Use CQRS?│ Level     │ Read:Write   │
├───────────────────┼──────────┼───────────┼──────────────┤
│ Simple CRUD       │ NO       │ -         │ Any          │
│ Small scale       │ NO       │ -         │ Any          │
│ High read:write   │ YES      │ 2 or 3    │ >10:1        │
│ Complex reads     │ YES      │ 2 or 3    │ >5:1         │
│ Different teams   │ YES      │ 2 or 3    │ >5:1         │
│ Event sourcing    │ YES      │ 4         │ Any          │
│ Audit requirements│ MAYBE    │ 4         │ Any          │
│ High write:read   │ MAYBE    │ 1 or 2    │ <1:5         │
└───────────────────┴──────────┴───────────┴──────────────┘
```

## Deep Dive (30 min)

### When CQRS Shines

| Scenario | Why CQRS Helps | Example |
|----------|---------------|---------|
| Read/write ratio very skewed (100:1) | Scale reads independently with different tech | E-commerce product catalog: millions of views, thousands of updates |
| Read queries require complex JOINs | Pre-compute denormalized views | User dashboard pulling from 7 tables → single doc fetch |
| Different teams own read vs write logic | Clean separation of concerns | Backend team owns writes, frontend team owns read APIs |
| Event sourcing already in use | Natural fit ([[event_sourcing]]) | Banking: all transactions stored as events, multiple views |
| Multiple read patterns needed | Create specialized read models per use case | Admin analytics, user-facing search, mobile API |
| Read and write performance bottleneck | Eliminate lock contention between reads/writes | High-traffic orders system |

### Implementation Levels

**Level 1: Code-Level CQRS (Simple)**
- Same database
- Separate command/query services in code
- Immediate consistency
- Good for: Learning CQRS, small scale

```
CommandService ──> PostgreSQL <── QueryService
(validates)         (single DB)    (reads)
```

**Level 2: Database-Level CQRS (Medium)**
- Write DB: PostgreSQL (normalized)
- Read DB: PostgreSQL read replicas or views
- Sync via DB replication or triggers
- Good for: Moderate scale, gradual migration

```
CommandService ──> Write DB ──replication──> Read Replica <── QueryService
```

**Level 3: Multi-Store CQRS (Advanced)**
- Write DB: PostgreSQL (ACID, normalized)
- Read DBs: Multiple specialized stores
  - MongoDB: Document queries
  - Elasticsearch: Full-text search
  - Redis: Fast cache
- Sync via message bus (Kafka, RabbitMQ)
- Good for: High scale, different read patterns

```
                     ┌──> MongoDB <── QueryService (docs)
CommandService       │
     │               ├──> Elasticsearch <── QueryService (search)
     ▼               │
 Write DB ──events──>┤
 (PostgreSQL)        └──> Redis <── QueryService (cache)
```

**Level 4: Event-Sourced CQRS (Expert)**
- Write: Event store (append-only)
- Read: Projections built from events
- Full audit trail, time travel
- Good for: Compliance, audit requirements

```
CommandService ──> Event Store ──replay──> Projections ──> Read Models
                (append-only)              (rebuild)      (multiple)
```

### The Eventual Consistency Trade-off

Read model is updated asynchronously. There's a delay:

```
Timeline:
─────────────────────────────────────────────────────────>
t=0ms          t=50ms         t=100ms        t=150ms
│              │              │              │
User writes    Event          Projection     Read model
review         published      processes      updated
│              │              event          │
│              │              │              │
Write DB       Message        Handler        MongoDB
updated        bus            runs           updated

User might query read model between t=0 and t=150ms
and not see their own write (stale read)
```

**Solutions to Stale Reads:**

1. **Read-Your-Writes Pattern**
   - After write, track the write version
   - When same user reads, wait for that version or read from write DB
   - Implementation: Return write version in command response, check in query

```java
// Command response includes version
CommandResponse response = commandBus.dispatch(command);
String writeVersion = response.getVersion();  // e.g., "event-123"

// Query checks if read model has that version
QueryResponse query = queryService.getUserOrders(userId, writeVersion);
// If read model hasn't processed event-123 yet, either:
// - Wait up to 500ms for it
// - Or read from write DB instead
```

2. **Optimistic UI**
   - Update UI immediately with expected result
   - Don't wait for server confirmation
   - Good for: Social media likes, upvotes

3. **UI Feedback**
   - Show "Your review is being processed..."
   - Set user expectation of delay
   - Good for: User-generated content

4. **Inline Merge**
   - Read from read model
   - For the current user, also check write model
   - Merge results in query service
   - Good for: Critical user data

### Production Patterns

#### 1. Event-Driven CQRS with Kafka

```
┌─────────────────────────────────────────────────────────────┐
│  PRODUCTION EVENT-DRIVEN CQRS ARCHITECTURE                  │
└─────────────────────────────────────────────────────────────┘

Write Side:
┌────────────────┐
│ Command API    │
│ (Spring Boot)  │
└────────┬───────┘
         │
         ▼
┌────────────────┐      ┌─────────────────────────────┐
│ Write Database │─────>│ CDC (Debezium)              │
│ (PostgreSQL)   │      │ - Captures DB changes       │
└────────────────┘      │ - Publishes to Kafka        │
                        └──────────┬──────────────────┘
                                   │
                                   ▼
                        ┌─────────────────────────────┐
                        │ Kafka Event Topics          │
                        │                             │
                        │ - order.events              │
                        │ - user.events               │
                        │ - inventory.events          │
                        │                             │
                        │ Partitioned by entity ID    │
                        │ Retained for 7 days         │
                        └──────────┬──────────────────┘
                                   │
                        ┌──────────┴──────────┐
                        │                     │
                        ▼                     ▼
            ┌─────────────────────┐  ┌─────────────────────┐
            │ Projection Service  │  │ Analytics Service   │
            │ (Consumer Group 1)  │  │ (Consumer Group 2)  │
            └──────────┬──────────┘  └──────────┬──────────┘
                       │                        │
        ┌──────────────┼────────────┐           │
        │              │            │           │
        ▼              ▼            ▼           ▼
┌─────────────┐ ┌──────────┐ ┌─────────┐ ┌──────────┐
│ MongoDB     │ │ Elastic  │ │ Redis   │ │ Cassandra│
│ (docs)      │ │ (search) │ │ (cache) │ │ (metrics)│
└─────────────┘ └──────────┘ └─────────┘ └──────────┘
        │              │            │           │
        └──────────────┼────────────┘           │
                       │                        │
                       ▼                        │
                ┌────────────┐                  │
                │ Query API  │                  │
                │ (Read)     │                  │
                └────────────┘                  │
                                                │
                                         ┌──────▼──────┐
                                         │ Analytics   │
                                         │ Dashboard   │
                                         └─────────────┘

Key Features:
- CDC: Automatic event capture from DB changes
- Kafka: Reliable, ordered event delivery
- Multiple consumer groups: Different projections
- Partitioning: Ordered processing per entity
- Retention: Event replay capability
```

#### 2. Multiple Read Models Pattern

```
Single Write Model → Multiple Specialized Read Models

Write Model (PostgreSQL):
┌──────────────────────────────┐
│ orders                       │
│ ├─ id                        │
│ ├─ user_id                   │
│ ├─ status                    │
│ ├─ created_at                │
│ └─ [normalized]              │
└──────────────────────────────┘

Read Models:

1. User Dashboard (MongoDB)
   Purpose: Fast user-specific queries
   ┌──────────────────────────────┐
   │ user_orders                  │
   │ {                            │
   │   userId: "u1",              │
   │   orders: [                  │
   │     {orderId, date, items,   │
   │      total, status}          │
   │   ],                         │
   │   summary: {                 │
   │     total: 12,               │
   │     lifetime: 1249.99        │
   │   }                          │
   │ }                            │
   └──────────────────────────────┘
   Optimized for: Single-user fetch

2. Admin Search (Elasticsearch)
   Purpose: Full-text search across orders
   ┌──────────────────────────────┐
   │ order_search_index           │
   │ {                            │
   │   orderId: "123",            │
   │   userId: "u1",              │
   │   items_text: "laptop mouse",│
   │   status: "shipped",         │
   │   created: "2026-02-14",     │
   │   total: 899.99              │
   │ }                            │
   └──────────────────────────────┘
   Optimized for: Text search, filters

3. Real-time Leaderboard (Redis)
   Purpose: Fastest readers/writers
   ┌──────────────────────────────┐
   │ top_customers:monthly        │
   │ SORTED SET:                  │
   │   u1: 2499.99                │
   │   u2: 1899.00                │
   │   u3: 1299.50                │
   │   ...                        │
   └──────────────────────────────┘
   Optimized for: Sorted rankings, TTL

4. Analytics (Cassandra)
   Purpose: Time-series metrics
   ┌──────────────────────────────┐
   │ order_metrics_by_hour        │
   │ Partition: date              │
   │ Clustering: hour             │
   │ {                            │
   │   date: "2026-02-14",        │
   │   hour: 14,                  │
   │   order_count: 420,          │
   │   revenue: 41250.00,         │
   │   avg_order: 98.21           │
   │ }                            │
   └──────────────────────────────┘
   Optimized for: Time-range scans

Each read model:
- Optimized for specific query pattern
- Updated independently via events
- Can use different technologies
- Can have different consistency requirements
```

#### 3. Saga Pattern for Distributed Transactions

When commands span multiple aggregates:

```
Order Placement Saga:

1. PlaceOrder command received
2. Reserve inventory (command)
   ├─ Success → Continue
   └─ Failure → Abort, refund
3. Process payment (command)
   ├─ Success → Continue
   └─ Failure → Release inventory, abort
4. Create shipment (command)
   ├─ Success → Complete
   └─ Failure → Refund, release inventory, abort

Each step:
- Publishes events on success/failure
- Has compensating transaction for rollback
- Maintains saga state in orchestrator

Saga Orchestrator (Spring Boot):
@Component
public class OrderSaga {

    @Transactional
    public void handlePlaceOrder(PlaceOrderCommand cmd) {
        SagaState state = new SagaState(cmd.getOrderId());

        try {
            // Step 1: Reserve inventory
            ReserveInventoryCommand invCmd = ...;
            commandBus.dispatch(invCmd);
            state.recordStep("inventory_reserved");

            // Step 2: Process payment
            ProcessPaymentCommand payCmd = ...;
            commandBus.dispatch(payCmd);
            state.recordStep("payment_processed");

            // Step 3: Create shipment
            CreateShipmentCommand shipCmd = ...;
            commandBus.dispatch(shipCmd);
            state.recordStep("shipment_created");

            // Success: Publish OrderCompleted event
            eventBus.publish(new OrderCompletedEvent(...));

        } catch (Exception e) {
            // Failure: Compensate completed steps
            compensate(state);
        }
    }

    private void compensate(SagaState state) {
        if (state.hasStep("shipment_created")) {
            commandBus.dispatch(new CancelShipmentCommand(...));
        }
        if (state.hasStep("payment_processed")) {
            commandBus.dispatch(new RefundPaymentCommand(...));
        }
        if (state.hasStep("inventory_reserved")) {
            commandBus.dispatch(new ReleaseInventoryCommand(...));
        }
    }
}
```

### Troubleshooting Guide

#### Problem 1: High Sync Lag

**Symptoms:**
- Sync lag > 1 second consistently
- Users reporting stale data
- Event queue depth growing

**Diagnosis:**
```bash
# Check Kafka consumer lag
kafka-consumer-groups --bootstrap-server localhost:9092 \
  --describe --group order-projection

# Check projection processing time
# Look for slow handlers in metrics

# Check read model write throughput
# MongoDB/Elasticsearch monitoring
```

**Common Causes & Fixes:**

| Cause | Fix |
|-------|-----|
| Slow projection handler | Optimize query, add indexes to read model |
| Single-threaded consumer | Increase Kafka partitions, scale consumers |
| Read model write bottleneck | Batch updates, use bulk APIs |
| Network latency | Co-locate services, use faster network |
| Large events | Compress events, use event references |

**Quick Fix:**
```java
// Batch updates instead of one-by-one
@KafkaListener(topics = "orders", concurrency = "3")
public void handleEvents(List<OrderEvent> events) {
    // Process batch
    List<Update> updates = events.stream()
        .map(this::createUpdate)
        .collect(Collectors.toList());

    // Bulk write to MongoDB
    mongoTemplate.bulkOps(BulkMode.UNORDERED, UserOrderHistory.class)
        .updateMulti(updates)
        .execute();
}
```

#### Problem 2: Stale Reads

**Symptoms:**
- User doesn't see their own write
- Inconsistent data in UI
- Support tickets about "missing" data

**Diagnosis:**
```java
// Add version tracking
@PostMapping("/orders")
public ResponseEntity<OrderResponse> placeOrder(...) {
    CommandResult result = commandService.placeOrder(...);

    // Return write version
    return ResponseEntity.ok()
        .header("X-Write-Version", result.getEventId())
        .body(response);
}

// Check if read model has that version
@GetMapping("/orders")
public ResponseEntity<List<Order>> getOrders(
    @RequestParam String userId,
    @RequestHeader(value = "X-Write-Version", required = false)
    String writeVersion
) {
    if (writeVersion != null &&
        !readModel.hasVersion(writeVersion)) {
        // Stale read detected
        log.warn("Stale read: write version {} not yet in read model",
                 writeVersion);
    }
    // ...
}
```

**Solutions:**

1. **Implement Read-Your-Writes**
```java
@Service
public class ConsistentQueryService {

    @Autowired
    private ReadModelRepository readModel;

    @Autowired
    private WriteModelRepository writeModel;

    public OrderHistory getUserOrders(
        String userId,
        String writeVersion
    ) {
        // Wait up to 500ms for write version to appear in read model
        if (writeVersion != null) {
            boolean synced = waitForSync(writeVersion,
                                         Duration.ofMillis(500));

            if (!synced) {
                // Fallback: read from write model
                log.info("Read-your-writes: using write model");
                return readFromWriteModel(userId);
            }
        }

        // Normal path: read from read model
        return readModel.getUserOrders(userId);
    }

    private boolean waitForSync(String version, Duration timeout) {
        Instant deadline = Instant.now().plus(timeout);

        while (Instant.now().isBefore(deadline)) {
            if (readModel.hasVersion(version)) {
                return true;
            }
            Thread.sleep(10);
        }

        return false;
    }
}
```

2. **Optimistic UI Updates**
```javascript
// Frontend: Update UI immediately, don't wait
async function placeOrder(order) {
    // 1. Optimistically update UI
    addOrderToUI(order);

    // 2. Send command
    const response = await fetch('/api/commands/orders', {
        method: 'POST',
        body: JSON.stringify(order)
    });

    // 3. If fails, rollback UI
    if (!response.ok) {
        removeOrderFromUI(order.id);
        showError("Order failed");
    }

    // Don't wait for read model sync
}
```

#### Problem 3: Command Failures

**Symptoms:**
- Commands rejected with errors
- Inconsistent failure rates
- Partial writes

**Diagnosis:**
```java
// Add detailed error logging
@Component
public class OrderCommandHandler {

    public CommandResult handle(PlaceOrderCommand cmd) {
        try {
            validateCommand(cmd);
            Order order = orderRepository.save(...);
            publishEvent(...);
            return CommandResult.success(order.getId());

        } catch (InsufficientInventoryException e) {
            // Business rule violation
            log.warn("Command rejected: insufficient inventory", e);
            return CommandResult.failure("INSUFFICIENT_INVENTORY",
                                        e.getMessage());

        } catch (DataAccessException e) {
            // Database error
            log.error("Command failed: database error", e);
            return CommandResult.failure("DATABASE_ERROR",
                                        "Please retry");

        } catch (Exception e) {
            // Unexpected error
            log.error("Command failed: unexpected error", e);
            return CommandResult.failure("INTERNAL_ERROR",
                                        "Contact support");
        }
    }
}
```

**Common Causes & Fixes:**

| Error Type | Cause | Fix |
|------------|-------|-----|
| Validation failure | Invalid input | Better client-side validation |
| Business rule violation | State doesn't allow action | Clear error message, guide user |
| Database timeout | High write load | Add connection pooling, optimize |
| Deadlock | Concurrent writes | Retry with backoff, optimize locks |
| Event publish failure | Message broker down | Use outbox pattern |

**Outbox Pattern (Reliable Event Publishing):**
```java
@Transactional
public CommandResult placeOrder(PlaceOrderCommand cmd) {
    // 1. Write to DB and outbox in same transaction
    Order order = orderRepository.save(...);

    OutboxEvent outboxEvent = new OutboxEvent(
        UUID.randomUUID(),
        "OrderPlaced",
        order.getId(),
        serializeEvent(order),
        Instant.now()
    );
    outboxRepository.save(outboxEvent);

    // Transaction commits: both order and outbox saved

    // 2. Separate process polls outbox and publishes to Kafka
    // If Kafka fails, event stays in outbox and will be retried

    return CommandResult.success(order.getId());
}

// Outbox publisher (separate component)
@Scheduled(fixedDelay = 100)
public void publishOutboxEvents() {
    List<OutboxEvent> pending = outboxRepository
        .findByPublishedFalse(PageRequest.of(0, 100));

    for (OutboxEvent event : pending) {
        try {
            kafkaTemplate.send("orders", event.getPayload());
            outboxRepository.markPublished(event.getId());
        } catch (Exception e) {
            // Will retry on next poll
            log.warn("Failed to publish event, will retry", e);
        }
    }
}
```

#### Problem 4: Event Ordering Issues

**Symptoms:**
- Read model in inconsistent state
- Events processed out of order
- Lost updates

**Diagnosis:**
- Check Kafka partition key
- Verify event timestamps
- Check for concurrent consumers

**Solution: Proper Partitioning**
```java
// Ensure events for same entity go to same partition
@Component
public class EventPublisher {

    @Autowired
    private KafkaTemplate<String, DomainEvent> kafka;

    public void publish(DomainEvent event) {
        // Use entity ID as partition key
        // All events for same order go to same partition
        // Kafka guarantees order within partition
        String partitionKey = event.getEntityId();

        kafka.send("orders", partitionKey, event);
    }
}

// Consumer processes partition sequentially
@KafkaListener(topics = "orders", concurrency = "3")
public void handleEvent(
    @Payload OrderEvent event,
    @Header(KafkaHeaders.RECEIVED_PARTITION_ID) int partition
) {
    // Within partition, events are ordered
    // Can safely process sequentially
    log.info("Processing event {} from partition {}",
             event.getEventId(), partition);

    projectToReadModel(event);
}
```

## The "Why" Chain

**Why CQRS?**
Reads and writes have different optimization needs; one model can't serve both well at scale. Reads need denormalized, fast queries. Writes need normalized, consistent transactions. Trying to optimize for both creates compromises in both directions.

**What's the alternative?**
- **Caching:** Add Redis/CDN for reads. Simpler, works for many cases. Limits: still does JOINs on cache miss, invalidation is tricky.
- **Read replicas:** PostgreSQL replication. Simpler than full CQRS. Limits: same schema, can't use different tech, limited denormalization.
- **Database views:** Materialized views in same DB. Simpler, synchronous. Limits: view refresh overhead, same DB limits.

**What breaks without it?**
- Complex read queries slow down writes (lock contention)
- Optimizing for reads compromises write performance
- Can't scale reads and writes independently
- Single technology choice limits optimization
- High read:write ratio wastes resources

**Why eventual consistency?**
Synchronous sync would couple read and write models, killing the main benefits. Async allows independent scaling and optimization. The lag is acceptable for most use cases with proper handling (read-your-writes, UI feedback).

**Why multiple read models?**
Different query patterns have different optimal structures. Search needs Elasticsearch. Caching needs Redis. Documents need MongoDB. One read model can't be optimal for all patterns.

## When to Use / When NOT to Use

### Use CQRS When:

| Scenario | Reason | Example |
|----------|--------|---------|
| High read/write ratio asymmetry | Scale reads independently | Social media: 1000:1 read:write |
| Complex read queries | Pre-compute denormalized views | Dashboard: 7 table JOIN → 1 doc |
| Need to scale reads independently | Different tech for reads | Product catalog: PostgreSQL → Elasticsearch |
| Already using event sourcing | Natural fit | Banking: events → multiple views |
| Different teams own read/write | Clean separation | Backend writes, frontend owns read API |
| Multiple read patterns | Specialized read models per use case | Search + docs + cache all from one write model |

### DON'T Use CQRS When:

| Scenario | Reason | Alternative |
|----------|--------|-------------|
| Simple CRUD application | Complexity not justified | Standard MVC, single DB |
| Read and write patterns are similar | No optimization benefit | Single model with indexes |
| Small scale | Single database is fine | PostgreSQL with indexes |
| Team is small | Maintenance overhead | Start simple, refactor later |
| Strong consistency required everywhere | Eventual consistency doesn't fit | Synchronous reads from write model |
| Just starting a new project | Premature optimization | YAGNI - add when needed |

### Warning Signs You Might Not Need CQRS:

- "We might need to scale later" (YAGNI)
- Read:write ratio is roughly balanced
- Current queries are fast enough (<100ms)
- No complex JOINs in read queries
- Team lacks distributed systems experience
- No clear separation between read/write domains

### Start Simple Path:

```
1. Single model + indexes
   └─ Works? STOP HERE ✓
      Slow? ↓

2. Add caching (Redis)
   └─ Works? STOP HERE ✓
      Still slow? ↓

3. Add read replicas
   └─ Works? STOP HERE ✓
      Still issues? ↓

4. Consider CQRS
   └─ Start with Level 1 (code-level)
      Need more? → Level 2 → Level 3
```

## Real-World Examples

### Example 1: Uber - Rider and Driver Views

**Challenge:**
- Riders need fast "available cars" view
- Drivers need consistent job assignments
- 50:1 read:write ratio
- Geo-spatial queries

**CQRS Implementation:**

```
Write Model:
┌─────────────────────────────────┐
│ Driver Assignments (PostgreSQL) │
│ - ACID transactions             │
│ - Ensures one rider per driver  │
│ - Authoritative state            │
└─────────────────────────────────┘
         │
         │ Events: DriverAvailable,
         │         RideRequested,
         │         RideAssigned
         ▼
┌─────────────────────────────────┐
│ Read Models:                    │
│                                 │
│ 1. Available Drivers (Redis)    │
│    - Geo-indexed by location    │
│    - TTL for staleness          │
│    - Fast geo-radius query      │
│                                 │
│ 2. Rider View (MongoDB)         │
│    - Pre-computed ETA           │
│    - Driver details             │
│    - Ride history               │
│                                 │
│ 3. Driver App (MongoDB)         │
│    - Assigned rides             │
│    - Navigation info            │
│    - Earnings summary           │
└─────────────────────────────────┘

Benefits:
- Geo queries don't lock assignment DB
- Can scale rider queries independently
- Driver assignments remain consistent
- Multiple specialized views (rider, driver, ops)

Lag handling:
- Driver sees assignment immediately (write model)
- Rider sees "finding driver..." (optimistic UI)
- Eventual consistency acceptable (1-2s lag)
```

### Example 2: Azure CQRS Pattern for E-commerce

**Challenge:**
- Product catalog with millions of items
- Complex product pages (details, reviews, recommendations)
- High traffic during sales
- Inventory updates from warehouses

**Azure Implementation:**

```
┌─────────────────────────────────────────────────────────┐
│               AZURE CQRS ARCHITECTURE                   │
└─────────────────────────────────────────────────────────┘

Write Side:
┌──────────────────┐
│ Command API      │
│ (Azure Functions)│
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Azure SQL        │
│ (Write Model)    │
│ - Products       │
│ - Inventory      │
│ - Orders         │
└────────┬─────────┘
         │
         │ Change Feed
         ▼
┌──────────────────┐
│ Event Grid       │
│ (Event Bus)      │
└────────┬─────────┘
         │
         ├─────────────────────────┐
         │                         │
         ▼                         ▼
┌─────────────────┐      ┌─────────────────┐
│ Projection Func │      │ Analytics Func  │
│ (Azure Function)│      │ (Azure Function)│
└────────┬────────┘      └────────┬────────┘
         │                        │
         ▼                        ▼
┌─────────────────┐      ┌─────────────────┐
│ Cosmos DB       │      │ Azure Synapse   │
│ (Read Model)    │      │ (Analytics)     │
│                 │      └─────────────────┘
│ - Product views │
│ - User carts    │
│ - Reviews       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Azure CDN       │
│ (Cache Layer)   │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ Query API       │
│ (Azure Functions│
│  with APIM)     │
└─────────────────┘

Flow:
1. UpdateInventory → Azure SQL (write)
2. Change Feed → Event Grid
3. Projection Function → Cosmos DB (read)
4. CDN caches product pages
5. Query API serves from Cosmos + CDN

Benefits:
- Azure SQL: Strong consistency for writes
- Cosmos DB: Global distribution for reads
- CDN: Edge caching for product pages
- Event Grid: Reliable event delivery
- Functions: Serverless, auto-scaling projections

Costs:
- Azure SQL: $200/mo (write model)
- Cosmos DB: $400/mo (read model, globally distributed)
- Event Grid: $0.60/million events
- Functions: $0.20/million executions
- CDN: $0.08/GB transferred

Total: ~$800/mo for moderate traffic
(vs $3000/mo for single-model at same scale)
```

### Example 3: Stack Overflow - Questions and Views

**Challenge:**
- Questions viewed millions of times
- Complex vote calculations, user reputation
- Edit history and revisions
- Full-text search

**CQRS Implementation:**

```
Write Model (PostgreSQL):
- Posts (normalized)
- Votes
- Users
- Edits (append-only)
- Comments
- Tags (many-to-many)

Events:
- QuestionPosted
- AnswerPosted
- VoteCast
- CommentAdded
- PostEdited

Read Models:

1. Question View (Denormalized PostgreSQL):
   - All data for question page pre-joined
   - Vote counts pre-computed
   - User reputation pre-computed
   - Updated on events
   - Cached in Redis

2. Search Index (Elasticsearch):
   - Full-text searchable content
   - Tags, titles, body
   - Vote-boosted ranking
   - User reputation factor

3. Hot Questions (Redis):
   - Trending calculation
   - TTL-based expiration
   - Score-based ranking
   - Fast leaderboard

Benefits:
- Question view: Single query, no JOINs (was 8 JOINs)
- Search: Elasticsearch full-text
- Hot questions: Redis sorted sets
- Writes don't impact read performance
- Can rebuild read models from events

Lag handling:
- New question visible immediately (serves from write model)
- Search index updates within 1-2 seconds
- Hot questions recalculated every 5 minutes
- Vote counts updated real-time (websocket)
```

### Example 4: Netflix - Viewing History

**Challenge:**
- Billions of view events per day
- "Continue watching" must be consistent
- "Because you watched" recommendations
- Different views for different devices

**CQRS Implementation:**

```
Write Model (Cassandra):
- User view events (append-only)
- Last position per video per user
- High write throughput

Events:
- VideoStarted
- VideoProgressUpdated
- VideoCompleted
- VideoRated

Read Models:

1. Continue Watching (Redis):
   - Last 10 incomplete videos per user
   - Last position cached
   - TTL: 30 days
   - Fast, session-based

2. Recommendations (Elasticsearch + ML):
   - View history → ML model
   - Pre-computed recommendations
   - Updated nightly
   - Served from CDN

3. Viewing History (Cassandra Wide Column):
   - Complete history per user
   - Paginated queries
   - Optimized for time-range scans

4. Device-Specific View (DynamoDB):
   - Last position per device
   - Device preferences
   - Cross-device sync

Benefits:
- Write model: High throughput for events
- Redis: Fast session data
- Cassandra: Efficient time-series
- ML: Batch processing of history
- Each device gets optimized view

Lag handling:
- Progress updates: Redis fast cache
- Recommendations: Eventually consistent (daily)
- Cross-device: Sync within 5 seconds
- Acceptable trade-off for performance
```

## Interview Tips

**When to Mention CQRS:**
- System has clear read/write asymmetry
- Discussing scaling reads vs writes
- Complex query patterns mentioned
- Event sourcing comes up

**What to Say:**
- "For this high-read scenario, I'd use CQRS to scale reads independently"
- "We'd use PostgreSQL for writes and Elasticsearch for search queries"
- "The read model would be eventually consistent, with ~100ms lag"
- "We'd handle read-your-writes for the user's own data"

**What NOT to Say:**
- "Let's use CQRS for everything" (over-application)
- "CQRS solves consistency problems" (it adds eventual consistency)
- "We need CQRS for this simple CRUD app" (overkill)
- Just saying "CQRS" without explaining why

**Good Answer Structure:**
1. Identify read/write patterns
2. Suggest CQRS if appropriate
3. Specify write model tech (PostgreSQL)
4. Specify read model tech (depends on queries)
5. Mention eventual consistency trade-off
6. Explain how to handle lag (read-your-writes)

**Example Answer:**
> "Given the 100:1 read-to-write ratio and complex product page queries, I'd use CQRS. The write model would be PostgreSQL for strong consistency on orders and inventory updates. The read model would be MongoDB with pre-computed product page documents—no JOINs needed. We'd sync via Kafka events with typical 50-100ms lag. For the 'just ordered' case, we'd implement read-your-writes: if the user queries within 1 second of their write, we'd either wait for sync or temporarily read from the write model. This gives us fast reads without sacrificing write consistency."

**Red Flags to Avoid:**
- Suggesting CQRS without justifying complexity
- Not mentioning eventual consistency
- Not explaining sync mechanism
- Using CQRS when caching would suffice
- Ignoring read-your-writes problem

**Trade-off Discussion:**
Always acknowledge:
- Increased complexity (multiple data stores)
- Eventual consistency (lag)
- More moving parts (message bus)
- Development overhead (projections)
- When simpler alternatives work (caching, read replicas)

## Common Pitfalls

| Pitfall | Why It's Bad | How to Avoid |
|---------|-------------|--------------|
| CQRS for everything | Unnecessary complexity | Use only when read/write patterns differ |
| Ignoring lag | User sees stale data | Implement read-your-writes for critical data |
| No event versioning | Can't evolve events | Version events from day one |
| Synchronous projections | Defeats purpose of CQRS | Always async via message bus |
| Single read model | Misses optimization opportunity | Multiple read models for different patterns |
| No monitoring | Can't debug lag issues | Monitor sync lag, event processing |
| Forgetting compensation | Failed projections leave inconsistency | Implement retry and DLQ |
| No event replay | Can't rebuild read models | Store events, enable replay |

## Links

- [[event_sourcing]] - Often paired with CQRS
- [[02_building_blocks/search_systems]] - Common read model
- [[02_building_blocks/caching]] - Simpler alternative for read optimization
- [[06_trade_offs/read_vs_write_optimization]] - The core trade-off
- [[02_building_blocks/message_queues]] - Sync write → read model via events
- [[03_design_patterns/saga_pattern]] - Distributed transactions across commands
- [[02_building_blocks/api_gateway]] - Routes commands vs queries
- [[04_system_examples/social_media_feed]] - CQRS in practice
