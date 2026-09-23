#system-design #project #hands-on #java

# Build It: API Gateway (Java + Spring Cloud Gateway)

> Build a gateway that handles routing, rate limiting, auth, and request logging. Teaches: reverse proxy, filters, cross-cutting concerns.

---

## What You Build

```
Client → [Your API Gateway] → Service A (/api/users)
                             → Service B (/api/orders)
                             → Service C (/api/products)
```

Gateway handles: routing, JWT auth, rate limiting, request logging, CORS.

## Spring Cloud Gateway Implementation

```java
// === Application.yml — Route Configuration ===
// spring:
//   cloud:
//     gateway:
//       routes:
//         - id: user-service
//           uri: http://localhost:8081
//           predicates:
//             - Path=/api/users/**
//         - id: order-service
//           uri: http://localhost:8082
//           predicates:
//             - Path=/api/orders/**

// === JWT Auth Filter ===
@Component
public class JwtAuthFilter implements GatewayFilter, Ordered {
    private final JwtUtil jwtUtil;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String token = exchange.getRequest().getHeaders().getFirst("Authorization");

        if (token == null || !token.startsWith("Bearer ")) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        try {
            Claims claims = jwtUtil.validate(token.substring(7));
            // Add user info to downstream request headers
            ServerHttpRequest modified = exchange.getRequest().mutate()
                .header("X-User-Id", claims.getSubject())
                .header("X-User-Role", claims.get("role", String.class))
                .build();
            return chain.filter(exchange.mutate().request(modified).build());
        } catch (Exception e) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }
    }

    @Override
    public int getOrder() { return -100; } // Run before other filters
}

// === Rate Limiting Filter (Redis) ===
@Component
public class RateLimitFilter implements GatewayFilter {
    private final ReactiveRedisTemplate<String, String> redis;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String clientId = exchange.getRequest().getHeaders().getFirst("X-User-Id");
        if (clientId == null) clientId = exchange.getRequest().getRemoteAddress().getHostString();

        String key = "rate:" + clientId;
        return redis.opsForValue().increment(key)
            .flatMap(count -> {
                if (count == 1) redis.expire(key, Duration.ofMinutes(1));
                if (count > 100) { // 100 requests per minute
                    exchange.getResponse().setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
                    exchange.getResponse().getHeaders().add("Retry-After", "60");
                    return exchange.getResponse().setComplete();
                }
                return chain.filter(exchange);
            });
    }
}

// === Request Logging Filter ===
@Component
public class LoggingFilter implements GlobalFilter {
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        long start = System.currentTimeMillis();
        String path = exchange.getRequest().getPath().toString();
        String method = exchange.getRequest().getMethod().toString();

        return chain.filter(exchange).then(Mono.fromRunnable(() -> {
            long duration = System.currentTimeMillis() - start;
            int status = exchange.getResponse().getStatusCode().value();
            log.info("{} {} → {} ({}ms)", method, path, status, duration);
        }));
    }
}
```

## What You Learn

| Concept | How Applied |
|---------|------------|
| Reverse proxy / routing | Spring Cloud Gateway routes |
| Authentication | JWT validation in gateway filter |
| Rate limiting | Redis counter per user |
| Request logging | Global filter with timing |
| Cross-cutting concerns | Filters run before/after every request |
| Reactive programming | WebFlux / Mono / Flux |

## Extensions
1. Add circuit breaker (Resilience4j integration)
2. Add request/response transformation
3. Add API key authentication for external APIs
4. Add response caching for GET requests
5. Add Prometheus metrics per route

## Links
- [[../02_building_blocks/api_gateway]] — Gateway concepts
- [[../02_building_blocks/rate_limiter]] — Rate limiting algorithms
- [[../15_intermediate_topics/authentication_deep_dive]] — JWT auth
