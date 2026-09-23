#system-design #bridge #hld #lld

# HLD → LLD Zoom: Payment Service

## HLD View (From [[10_hld/examples/hld_payment_system]])

```
[Payment Service] — processes charges, refunds, manages ledger
```

## LLD Zoom (Java)

```java
// === Payment State Machine ===
public enum PaymentStatus {
    CREATED, PROCESSING, SUCCEEDED, FAILED, REFUND_PENDING, REFUNDED
}

// === Core Domain ===
public class Payment {
    private final String id;
    private final String orderId;
    private final Money amount;
    private PaymentStatus status;
    private String providerRef;
    private final LocalDateTime createdAt;

    public void markProcessing(String providerRef) {
        this.status = PaymentStatus.PROCESSING;
        this.providerRef = providerRef;
    }
    public void markSucceeded() { this.status = PaymentStatus.SUCCEEDED; }
    public void markFailed() { this.status = PaymentStatus.FAILED; }
}

// === Payment Gateway Adapter (Strategy) ===
public interface PaymentGatewayAdapter {
    GatewayResponse charge(Money amount, PaymentMethod method);
    GatewayResponse refund(String providerRef, Money amount);
}

public class RazorpayAdapter implements PaymentGatewayAdapter {
    public GatewayResponse charge(Money amount, PaymentMethod method) {
        // Call Razorpay API: POST /v1/payments
        return new GatewayResponse("pay_razorpay_123", true);
    }
    public GatewayResponse refund(String ref, Money amount) { ... }
}

public class StripeAdapter implements PaymentGatewayAdapter { ... }

// === Idempotent Payment Service ===
public class PaymentService {
    private final PaymentRepository repo;
    private final PaymentGatewayAdapter gateway;
    private final IdempotencyStore idempotencyStore; // Redis
    private final EventPublisher events;
    private final LedgerService ledger;

    public Payment processPayment(String idempotencyKey, Money amount, PaymentMethod method) {
        // Idempotency check
        Optional<Payment> existing = idempotencyStore.get(idempotencyKey);
        if (existing.isPresent()) return existing.get(); // Return cached result

        // Create payment
        Payment payment = new Payment(UUID.randomUUID().toString(), amount);
        repo.save(payment);

        // Charge via gateway
        GatewayResponse response = gateway.charge(amount, method);
        if (response.isSuccess()) {
            payment.markSucceeded();
            ledger.recordDebit(payment); // Double-entry ledger
        } else {
            payment.markFailed();
        }

        repo.save(payment);
        idempotencyStore.store(idempotencyKey, payment, Duration.ofHours(24));
        events.publish(new PaymentCompletedEvent(payment));
        return payment;
    }
}
```

## The Three Levels

| Level | What You See |
|-------|-------------|
| **HLD** | [Payment Service] box connected to Bank APIs and Order Service |
| **LLD** | Payment, PaymentGatewayAdapter (interface), RazorpayAdapter, LedgerService, IdempotencyStore |
| **Code** | Java classes with Spring annotations, Redis calls, Razorpay API integration |

## Links

- [[../10_hld/examples/hld_payment_system]] — HLD view
- [[../10_hld/examples/hld_upi_payment]] — India-specific UPI flow
- [[../11_lld/patterns/behavioral]] — Strategy for gateway adapters
