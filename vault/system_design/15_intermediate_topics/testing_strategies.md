#system-design #intermediate #testing

# Testing Strategies for Production Systems

> Mentioning testing in system design shows production maturity. Here's what to know.

---

## The Testing Pyramid

```
        /  E2E Tests  \          ← Few, slow, expensive
       / Integration   \        ← Moderate
      /   Unit Tests    \       ← Many, fast, cheap
     ──────────────────────
```

| Level | What | Tools (Java) | Speed |
|-------|------|-------------|-------|
| **Unit** | Single class/method in isolation | JUnit 5, Mockito | ms |
| **Integration** | Multiple components together (API + DB) | Spring Boot Test, Testcontainers | seconds |
| **E2E** | Full user flow through the system | Selenium, Playwright | minutes |
| **Load** | System under expected/peak traffic | Gatling, k6, JMeter | minutes-hours |
| **Chaos** | System under failure conditions | Chaos Monkey, Litmus | continuous |

---

## Unit Testing (Java)

```java
@ExtendWith(MockitoExtension.class)
class OrderServiceTest {
    @Mock private OrderRepository orderRepo;
    @Mock private PaymentGateway paymentGateway;
    @InjectMocks private OrderService orderService;

    @Test
    void shouldPlaceOrderSuccessfully() {
        when(paymentGateway.charge(any(), any())).thenReturn(PaymentResult.success());

        Order order = orderService.placeOrder(new OrderRequest(items, paymentMethod));

        assertThat(order.getStatus()).isEqualTo("CONFIRMED");
        verify(orderRepo).save(any(Order.class));
        verify(paymentGateway).charge(eq(paymentMethod), eq(Money.of(5000, "INR")));
    }

    @Test
    void shouldCancelOrderWhenPaymentFails() {
        when(paymentGateway.charge(any(), any())).thenReturn(PaymentResult.failed("Insufficient funds"));

        assertThrows(PaymentFailedException.class,
            () -> orderService.placeOrder(request));

        verify(orderRepo, never()).save(any());
    }
}
```

**Key:** Mock external dependencies. Test business logic in isolation.

---

## Integration Testing (Testcontainers)

```java
@SpringBootTest
@Testcontainers
class OrderControllerIntegrationTest {
    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15");

    @Container
    static GenericContainer<?> redis = new GenericContainer<>("redis:7").withExposedPorts(6379);

    @Test
    void shouldCreateOrderViaAPI() {
        var response = restTemplate.postForEntity("/api/orders", orderRequest, OrderResponse.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody().getOrderId()).isNotNull();

        // Verify actually persisted in DB
        Order saved = orderRepo.findById(response.getBody().getOrderId()).orElseThrow();
        assertThat(saved.getStatus()).isEqualTo("CONFIRMED");
    }
}
```

**Testcontainers:** Spins up real PostgreSQL/Redis in Docker for tests. No mocks — tests real integration.

---

## Load Testing

```javascript
// k6 load test script
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '2m', target: 100 },   // Ramp to 100 users
        { duration: '5m', target: 100 },   // Stay at 100
        { duration: '2m', target: 500 },   // Spike to 500
        { duration: '5m', target: 500 },   // Stay at 500
        { duration: '2m', target: 0 },     // Ramp down
    ],
    thresholds: {
        http_req_duration: ['p(99)<500'],  // 99% of requests under 500ms
        http_req_failed: ['rate<0.01'],    // Less than 1% failure rate
    },
};

export default function () {
    let res = http.get('https://api.myapp.com/products');
    check(res, { 'status is 200': (r) => r.status === 200 });
    sleep(1);
}
```

**Key metrics to validate:** P99 latency, error rate, throughput (req/sec), resource utilization.

---

## Chaos Engineering

**Principle:** "If you don't test failure in production, production will test it for you."

| Experiment | What You Break | What You Learn |
|-----------|---------------|----------------|
| Kill a random pod | Container crashes | Does Kubernetes restart it? Does LB route around it? |
| Add 500ms latency to DB | Slow database | Do circuit breakers trigger? Do timeouts work? |
| Fill disk to 90% | Storage pressure | Do alerts fire? Does the app handle it? |
| Block network to Redis | Cache unavailable | Does fallback to DB work? |
| Simulate DNS failure | DNS resolution fails | Does the app retry? How long until recovery? |

**Tools:** Netflix Chaos Monkey, AWS Fault Injection Service, Litmus (Kubernetes).

---

## What to Say in Interviews

> "We'd have unit tests for business logic with 80%+ coverage, integration tests with Testcontainers for database interactions, load tests validating P99 < 200ms at 2x expected traffic, and periodic chaos experiments to verify our circuit breakers and fallback mechanisms work."

## Links

- [[../02_building_blocks/monitoring_and_logging]] — Observability during tests
- [[../03_design_patterns/circuit_breaker]] — What chaos testing validates
- [[../10_hld/hld_review_checklist]] — Testing in design review
