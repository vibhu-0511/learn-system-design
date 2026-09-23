#system-design #bridge #hld #lld #india

# HLD → LLD Zoom: Food Delivery Order Service

## HLD View (From [[10_hld/examples/hld_food_delivery]])

```
[Order Service] — manages order lifecycle from placement to delivery
```

## LLD Zoom (Java)

The Order Service internally uses the **State Pattern** for order lifecycle and **Strategy Pattern** for delivery agent assignment. See [[11_lld/examples/lld_food_delivery]] for full implementation.

### The Three Levels

```
HLD:  Customer App → API Gateway → [Order Service] → Dispatch → Agent
                                         ↑
                                    THIS BOX

LLD:  OrderController
      → PlaceOrderUseCase
        → Order (with OrderState: Placed → Accepted → Preparing → PickedUp → Delivered)
        → AgentAssignmentStrategy (NearestAgent / RatingBased)
        → PaymentGateway (Razorpay / COD handler)
        → NotificationService (Push + SMS)

Code: (See lld_food_delivery.md for full Java implementation)
      Order.java — State machine with PlacedState, AcceptedState, etc.
      NearestAgentStrategy.java — GEORADIUS + scoring
      OrderService.java — Orchestrates the flow
```

### Key Insight

The State pattern in the LLD maps to the **order status** column in the HLD's database. Every `setState()` call in Java corresponds to an UPDATE in PostgreSQL + an event emitted to Kafka.

```
LLD: order.next()  →  state = new PreparingState()
HLD: UPDATE orders SET status = 'PREPARING' WHERE id = ?
     + Kafka: emit("ORDER_PREPARING", orderId)
     + WebSocket: push status update to customer app
```

## Links

- [[../10_hld/examples/hld_food_delivery]] — Full HLD
- [[../11_lld/examples/lld_food_delivery]] — Full Java LLD
- [[../11_lld/patterns/behavioral]] — State + Strategy patterns
