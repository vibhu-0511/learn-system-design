#system-design #project #hands-on #devops

# Build It: Monitoring Dashboard (Prometheus + Grafana + Spring Actuator)

> Set up real monitoring for your Java applications. Teaches: metrics, dashboards, alerting — the observability stack.

---

## What You Build

```
Your Spring Boot App → /actuator/prometheus (metrics endpoint)
  → Prometheus (scrapes every 15s, stores time-series)
    → Grafana (visualizes dashboards)
      → AlertManager (sends alerts to Slack/email)
```

## docker-compose.yml

```yaml
services:
  app:
    build: .
    ports: ["8080:8080"]

  prometheus:
    image: prom/prometheus
    ports: ["9090:9090"]
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports: ["3000:3000"]
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin

  alertmanager:
    image: prom/alertmanager
    ports: ["9093:9093"]
    volumes:
      - ./alertmanager.yml:/etc/alertmanager/alertmanager.yml
```

## Spring Boot Metrics Setup

```xml
<!-- pom.xml -->
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-registry-prometheus</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

```yaml
# application.yml
management:
  endpoints:
    web:
      exposure:
        include: health,prometheus,metrics
  metrics:
    tags:
      application: my-app
```

### Custom Business Metrics

```java
@Service
public class OrderService {
    private final Counter orderCounter;
    private final Timer orderTimer;

    public OrderService(MeterRegistry registry) {
        this.orderCounter = Counter.builder("orders.placed.total")
            .tag("service", "order-service")
            .register(registry);
        this.orderTimer = Timer.builder("orders.processing.duration")
            .tag("service", "order-service")
            .register(registry);
    }

    public Order placeOrder(OrderRequest request) {
        return orderTimer.record(() -> {
            Order order = processOrder(request);
            orderCounter.increment();
            return order;
        });
    }
}
```

## Prometheus Config

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'spring-app'
    scrape_interval: 15s
    metrics_path: /actuator/prometheus
    static_configs:
      - targets: ['app:8080']
```

## Key Grafana Dashboards to Build

### RED Dashboard (per service)
```
Rate:     rate(http_server_requests_seconds_count[5m])
Errors:   rate(http_server_requests_seconds_count{status=~"5.."}[5m])
Duration: histogram_quantile(0.99, rate(http_server_requests_seconds_bucket[5m]))
```

### Resource Dashboard
```
CPU:      process_cpu_usage
Memory:   jvm_memory_used_bytes
Threads:  jvm_threads_live_threads
GC:       rate(jvm_gc_pause_seconds_sum[5m])
```

### Business Dashboard
```
Orders/min:    rate(orders_placed_total[1m]) * 60
Avg order time: rate(orders_processing_duration_seconds_sum[5m]) / rate(orders_processing_duration_seconds_count[5m])
Error rate:     rate(orders_failed_total[5m]) / rate(orders_placed_total[5m])
```

## Alert Rules

```yaml
# alert_rules.yml
groups:
  - name: app-alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_server_requests_seconds_count{status=~"5.."}[5m]) / rate(http_server_requests_seconds_count[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Error rate > 5% for 5 minutes"

      - alert: HighLatency
        expr: histogram_quantile(0.99, rate(http_server_requests_seconds_bucket[5m])) > 0.5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "P99 latency > 500ms"
```

## What You Learn

| Concept | How Applied |
|---------|------------|
| Metrics collection | Micrometer + Prometheus |
| Time-series databases | Prometheus storage |
| Dashboard design | Grafana panels (RED method) |
| Alerting | AlertManager rules + routing |
| SLIs/SLOs | Define and track P99, error rate targets |
| Custom metrics | Business-level counters and timers |

## Links
- [[../02_building_blocks/monitoring_and_logging]] — Observability concepts
- [[../15_intermediate_topics/testing_strategies]] — Load testing + monitoring
- [[../10_hld/hld_review_checklist]] — Monitoring in design review
