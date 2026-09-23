#system-design #building-block #reliability #security

# Rate Limiter

## Intuition (30 sec)

A bouncer at a club with a "max 10 people per minute" rule. Even if 100 people show up at once, only 10 get in each minute. The rest wait or leave. Protects the club (server) from being overwhelmed.

## Failure-First Scenario

> Your API has no rate limiting. A buggy client script sends 10,000 requests/second to your `/search` endpoint. Your servers max out, database connections exhaust, and legitimate users get errors. One bad actor took down your entire platform.

## Core Definitions

### Rate Limiting
**Definition:** A technique to control the rate of traffic sent or received by a network, API, or service by limiting the number of requests a client can make within a specified time window.

**Purpose:** Prevent abuse, ensure fair resource allocation, protect against DDoS attacks, and maintain system stability.

### Key Terms

**QPS (Queries Per Second)**
- Rate of incoming requests measured per second
- Common metric: "This endpoint handles 10,000 QPS"
- Used to define rate limit thresholds (e.g., "limit to 100 QPS per user")

**Burst**
- A sudden spike of requests above the normal rate
- Token bucket allows controlled bursts (up to bucket capacity)
- Example: 100 requests/minute allows burst of 100 instantly, then blocks

**Throttling**
- The act of deliberately slowing down or rejecting requests to enforce rate limits
- Can be hard (reject with 429) or soft (queue/delay requests)
- Related to back pressure in distributed systems

## Working Knowledge (5 min)

### Rate Limiting Algorithms

#### Algorithm Comparison Visual

```
Time →    0s    1s    2s    3s    4s    5s
Requests: 10    5     8     12    3     7

┌─────────────────────────────────────────────────────────┐
│ 1. FIXED WINDOW (Limit: 10/sec)                        │
├─────────────────────────────────────────────────────────┤
│ Window:  [────10────][────5────][────8────][───12───]  │
│ Result:    ✓ PASS     ✓ PASS    ✓ PASS    ✗ REJECT    │
│ Problem: 10 reqs at 0.9s + 10 at 1.0s = 20 in 0.1s!    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 2. SLIDING WINDOW (Limit: 10/sec)                      │
├─────────────────────────────────────────────────────────┤
│ At 2.5s: Count all requests in [1.5s - 2.5s] window    │
│ Weighted: (5 × 50%) + 8 = 10.5 → REJECT new request    │
│ Smooth and memory-efficient                             │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 3. TOKEN BUCKET (10 tokens, refill 2/sec)              │
├─────────────────────────────────────────────────────────┤
│ t=0s:  10 tokens - 10 reqs = 0 tokens  [✓ burst OK]    │
│ t=1s:  0 + 2 - 5 reqs = -3 → REJECT 3  [✗ depleted]    │
│ t=2s:  0 + 2 - 8 reqs = -6 → REJECT 6  [✗ still empty] │
│ Allows burst, then strict limit                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 4. LEAKY BUCKET (Queue size: 10, leak rate: 2/sec)     │
├─────────────────────────────────────────────────────────┤
│ t=0s:  +10 reqs → Queue: [■■■■■■■■■■] (full)           │
│ t=1s:  -2 processed, +5 reqs → Queue: [■■■■■■■■■■]     │
│        3 REJECTED (queue full)                          │
│ Smooths output, no bursts allowed                       │
└─────────────────────────────────────────────────────────┘
```

#### 1. Token Bucket (Most Common)

**How it works:**
```
┌─────────────────────────────────────┐
│       TOKEN BUCKET MECHANISM        │
├─────────────────────────────────────┤
│                                     │
│  Bucket: [🪙 🪙 🪙 🪙 🪙]  (5/10)   │
│                                     │
│  Refill Rate: 2 tokens/sec         │
│  Bucket Capacity: 10 tokens        │
│                                     │
│  REQUEST ARRIVES                    │
│       ↓                             │
│  Has token? ──YES→ Take token → ✓  │
│       ↓                             │
│      NO                             │
│       ↓                             │
│  Reject (429) → ✗                   │
│                                     │
└─────────────────────────────────────┘

Timeline Example:
t=0s:  [🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙] 10 tokens
       3 requests → 7 tokens left

t=1s:  [🪙🪙🪙🪙🪙🪙🪙🪙🪙] 9 tokens (7 + 2 refilled)
       5 requests → 4 tokens left

t=2s:  [🪙🪙🪙🪙🪙🪙] 6 tokens (4 + 2 refilled)
       8 requests → REJECT 2, 0 tokens left
```

**Characteristics:**
- ✓ Allows controlled bursts (up to bucket size)
- ✓ Smooth long-term rate enforcement
- ✓ Memory efficient (2 values: token count + last refill time)
- Used by: AWS API Gateway, Stripe, Google Cloud

**Best for:** APIs that need to allow occasional bursts but enforce average rate

#### 2. Leaky Bucket

**How it works:**
```
┌─────────────────────────────────────┐
│      LEAKY BUCKET MECHANISM         │
├─────────────────────────────────────┤
│                                     │
│    Requests Queue (FIFO)            │
│    ┌───────────────┐                │
│    │ Req 8         │ ← New requests │
│    │ Req 7         │    added here  │
│    │ Req 6         │                │
│    │ Req 5         │                │
│    │ Req 4         │                │
│    └───────────────┘                │
│           ↓                         │
│    Process at fixed rate            │
│    (e.g., 10/sec)                   │
│           ↓                         │
│    Processed Requests → ✓           │
│                                     │
│    Queue Full? → Reject (429) → ✗   │
│                                     │
└─────────────────────────────────────┘
```

**Characteristics:**
- ✓ Strict output rate (no bursts)
- ✓ Smooths traffic perfectly
- ✗ No burst allowance (may reject legitimate spikes)
- Used for: Traffic shaping, network QoS

**Best for:** Systems requiring perfectly smooth output rate

#### 3. Fixed Window Counter

**How it works:**
```
Window:  [─────────1 min─────────][─────────1 min─────────]
Time:    12:00:00            12:01:00              12:02:00
Counter:    0  →  100           0  →  100
Status:   ✓ Allow             ✗ Reject (limit: 100/min)

Boundary Burst Problem:
         [─────Window 1─────][─────Window 2─────]
Time:    12:00:00       12:00:59│12:01:00    12:01:01
Reqs:                       100 ││ 100
                               ↑↑↑
                    200 requests in 2 seconds! ⚠️
```

**Characteristics:**
- ✓ Simplest implementation
- ✓ Memory efficient (1 counter per window)
- ✗ Boundary burst problem
- ✗ Can allow 2x rate limit at boundaries

**Best for:** Non-critical rate limiting, approximate limits

#### 4. Sliding Window Log

**How it works:**
```
Store timestamp of every request:
[1676000001, 1676000003, 1676000005, 1676000007, ...]

For each new request at time T:
1. Remove timestamps older than (T - window_size)
2. Count remaining timestamps
3. If count < limit: Allow + add timestamp
4. Else: Reject

Example (limit: 3/10sec):
Time 15s: Request arrives
Timestamps: [6, 8, 11, 13, 14]
Window: [5s - 15s]
Remove < 5s: [6, 8, 11, 13, 14] (5 requests)
Count: 5 > 3 → REJECT ✗
```

**Characteristics:**
- ✓ Most accurate rate limiting
- ✓ No boundary issues
- ✗ Memory-heavy (stores every timestamp)
- ✗ Expensive cleanup operations

**Best for:** Small-scale, high-precision requirements

#### 5. Sliding Window Counter (RECOMMENDED)

**How it works:**
```
Hybrid: Fixed windows + weighted calculation

Previous Window     Current Window
[────100 reqs────] [────30 reqs────]
12:00:00      12:01:00        12:01:40 ← Request at 40s

Calculation at 12:01:40:
- Current window: 30 requests
- Previous window weight: (60-40)/60 = 33.3%
- Previous contribution: 100 × 0.333 = 33.3
- Total: 30 + 33.3 = 63.3 requests in last 60 seconds
- Limit: 100/min → ✓ ALLOW

Visual:
Time →  0        20       40       60       80      100     120
        ├────────┼────────┼────────┼────────┼────────┼────────┤
Window: [──Prev Window (100)──][───Current Window (30)───]
        [≈≈≈≈≈weighted≈≈≈≈][────full count────]
                           ↑
                      Request here (40s)
                      Prev weight: 33%
                      Curr weight: 100%
```

**Characteristics:**
- ✓ Memory efficient (2 counters)
- ✓ Accurate (no boundary issues)
- ✓ Best balance of accuracy and efficiency
- Used by: Cloudflare, many production systems

**Best for:** Production systems (recommended default)

### Rate Limit By What?

| Dimension | Use Case | Example |
|-----------|----------|---------|
| **IP address** | Anonymous users, DDoS protection | 100 req/min per IP |
| **User ID** | Authenticated users, per-user quotas | 1000 req/hour per user |
| **API key** | Developer rate limits (free vs paid tiers) | Free: 100/day, Pro: 10K/day |
| **Endpoint** | Different limits for expensive operations | `/search`: 10/sec, `/login`: 5/min |
| **Combination** | Fine-grained control | 100/min per user per endpoint |
| **Tenant/Org** | Multi-tenant SaaS | 10K req/hour per organization |
| **Global** | Overall system protection | 1M req/sec across all users |

### HTTP 429 Response

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 30
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1640000000
X-RateLimit-Policy: 100;w=60

{
  "error": "rate_limit_exceeded",
  "message": "You have exceeded the rate limit of 100 requests per minute",
  "retry_after": 30,
  "documentation_url": "https://docs.api.com/rate-limits"
}
```

**Standard Headers:**
- `Retry-After`: Seconds until retry is allowed
- `X-RateLimit-Limit`: Max requests in window
- `X-RateLimit-Remaining`: Requests left in current window
- `X-RateLimit-Reset`: Unix timestamp when limit resets

## Deep Dive (30 min)

### Redis-Based Rate Limiter Implementation

#### Token Bucket with Redis (Annotated)

```lua
-- Redis Lua script for atomic token bucket rate limiting
-- Keys: [1] = token key, [2] = timestamp key
-- Args: [1] = max_tokens, [2] = refill_rate, [3] = current_time, [4] = tokens_requested

local token_key = KEYS[1]           -- "rate:user:123:tokens"
local ts_key = KEYS[2]              -- "rate:user:123:timestamp"

local max_tokens = tonumber(ARGV[1])      -- 100 (bucket capacity)
local refill_rate = tonumber(ARGV[2])     -- 10 (tokens per second)
local now = tonumber(ARGV[3])             -- Current Unix timestamp
local requested = tonumber(ARGV[4])       -- Tokens requested (usually 1)

-- Get current state (default to full bucket if first request)
local tokens = tonumber(redis.call("GET", token_key) or max_tokens)
local last_refill = tonumber(redis.call("GET", ts_key) or now)

-- Calculate tokens to add based on elapsed time
local elapsed = math.max(0, now - last_refill)
local tokens_to_add = elapsed * refill_rate
local new_tokens = math.min(max_tokens, tokens + tokens_to_add)

-- Check if we have enough tokens
if new_tokens >= requested then
    -- Consume tokens and update state
    new_tokens = new_tokens - requested
    redis.call("SET", token_key, new_tokens)
    redis.call("SET", ts_key, now)
    redis.call("EXPIRE", token_key, 3600)   -- Auto-cleanup after 1 hour
    redis.call("EXPIRE", ts_key, 3600)

    return {1, new_tokens}  -- [allowed=1, remaining_tokens]
else
    -- Rate limit exceeded
    return {0, new_tokens}  -- [allowed=0, remaining_tokens]
end
```

**Application Code (Python):**

```python
import redis
import time
from typing import Tuple

class TokenBucketRateLimiter:
    """
    Redis-backed token bucket rate limiter
    Thread-safe and works across distributed systems
    """

    # Lua script loaded once at initialization
    LUA_SCRIPT = """
    -- [Lua script from above]
    """

    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self.script = self.redis.register_script(self.LUA_SCRIPT)

    def check_rate_limit(
        self,
        identifier: str,        # user_id, IP, API key, etc.
        max_tokens: int = 100,  # Bucket capacity
        refill_rate: float = 10,  # Tokens per second
        tokens_requested: int = 1
    ) -> Tuple[bool, int, dict]:
        """
        Check if request is allowed under rate limit

        Returns:
            (allowed, remaining, metadata)
        """
        token_key = f"rate:{identifier}:tokens"
        ts_key = f"rate:{identifier}:ts"
        now = time.time()

        # Execute Lua script atomically
        result = self.script(
            keys=[token_key, ts_key],
            args=[max_tokens, refill_rate, now, tokens_requested]
        )

        allowed = bool(result[0])
        remaining = int(result[1])

        # Calculate reset time for response headers
        reset_time = now + ((max_tokens - remaining) / refill_rate)

        metadata = {
            "limit": max_tokens,
            "remaining": remaining,
            "reset": int(reset_time),
            "retry_after": 0 if allowed else int((tokens_requested - remaining) / refill_rate)
        }

        return allowed, remaining, metadata

# Usage in API endpoint
@app.route('/api/search')
def search():
    limiter = TokenBucketRateLimiter(redis_client)
    user_id = get_current_user_id()

    allowed, remaining, metadata = limiter.check_rate_limit(
        identifier=user_id,
        max_tokens=100,      # 100 requests
        refill_rate=1.67,    # ~100 per minute
        tokens_requested=1
    )

    # Add rate limit headers to response
    response_headers = {
        "X-RateLimit-Limit": metadata["limit"],
        "X-RateLimit-Remaining": metadata["remaining"],
        "X-RateLimit-Reset": metadata["reset"]
    }

    if not allowed:
        response_headers["Retry-After"] = metadata["retry_after"]
        return jsonify({
            "error": "rate_limit_exceeded"
        }), 429, response_headers

    # Process request
    results = perform_search(request.args.get('q'))
    return jsonify(results), 200, response_headers
```

#### Sliding Window Counter with Redis

```python
import redis
import time
import math

def sliding_window_rate_limit(
    redis_client: redis.Redis,
    identifier: str,
    limit: int,
    window_seconds: int
) -> Tuple[bool, dict]:
    """
    Sliding window counter using Redis
    Memory efficient: only stores 2 counters
    """
    now = time.time()
    current_window = math.floor(now / window_seconds)
    previous_window = current_window - 1

    # Keys for current and previous windows
    current_key = f"rate:{identifier}:{current_window}"
    previous_key = f"rate:{identifier}:{previous_window}"

    # Get counts from both windows
    pipe = redis_client.pipeline()
    pipe.get(current_key)
    pipe.get(previous_key)
    results = pipe.execute()

    current_count = int(results[0] or 0)
    previous_count = int(results[1] or 0)

    # Calculate sliding window position
    elapsed_in_current = now - (current_window * window_seconds)
    previous_weight = 1 - (elapsed_in_current / window_seconds)

    # Weighted count from previous window + current window
    estimated_count = (previous_count * previous_weight) + current_count

    if estimated_count < limit:
        # Increment current window counter
        pipe = redis_client.pipeline()
        pipe.incr(current_key)
        pipe.expire(current_key, window_seconds * 2)  # Keep for 2 windows
        pipe.execute()

        allowed = True
        remaining = limit - math.ceil(estimated_count) - 1
    else:
        allowed = False
        remaining = 0

    metadata = {
        "limit": limit,
        "remaining": max(0, remaining),
        "reset": int((current_window + 1) * window_seconds),
        "window": window_seconds
    }

    return allowed, metadata
```

### Distributed Rate Limiting Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    DISTRIBUTED RATE LIMITING                     │
└─────────────────────────────────────────────────────────────────┘

                         Internet
                            │
                            ▼
                    ┌──────────────┐
                    │ Load Balancer│
                    └──────────────┘
                            │
        ┌──────────┬────────┼────────┬──────────┐
        ▼          ▼        ▼        ▼          ▼
   ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
   │ API    │ │ API    │ │ API    │ │ API    │
   │Server 1│ │Server 2│ │Server 3│ │Server 4│
   └────────┘ └────────┘ └────────┘ └────────┘
        │          │        │          │
        └──────────┴────────┴──────────┘
                    │
                    ▼
          ┌──────────────────┐
          │  Redis Cluster   │     ← Centralized rate limit state
          │                  │
          │  [Master]        │
          │    │             │
          │  [Replica]       │
          └──────────────────┘

PROBLEM: Race conditions without atomicity
────────────────────────────────────────────
Server 1: GET counter (99)  ─┐
Server 2: GET counter (99)  ─┼─ Both see 99
Server 3: GET counter (99)  ─┘
                              │
All three: INCR counter      ← 3 requests allowed, should be 1!

SOLUTION: Lua scripts for atomic operations
────────────────────────────────────────────
Server 1: EVAL script(...) ─┐
Server 2: EVAL script(...) ─┼─ Executed atomically in Redis
Server 3: EVAL script(...) ─┘
                             │
                             └─ Only 1 succeeds, others get 429
```

### Multi-Layer Rate Limiting

```
┌────────────────────────────────────────────────────────────┐
│                    CLIENT REQUEST                          │
└────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────┐
│ LAYER 1: CDN/WAF (Cloudflare)                              │
├────────────────────────────────────────────────────────────┤
│  • IP-based rate limiting: 10,000 req/min per IP           │
│  • DDoS protection: Block malicious IPs                    │
│  • Bot detection: Challenge suspicious traffic             │
│  Purpose: Protect infrastructure from volumetric attacks   │
└────────────────────────────────────────────────────────────┘
                            │ ✓ Passed
                            ▼
┌────────────────────────────────────────────────────────────┐
│ LAYER 2: API Gateway (AWS API Gateway, Kong)               │
├────────────────────────────────────────────────────────────┤
│  • Per-API-key limits: Free tier (100/day), Pro (10K/day)  │
│  • Per-user limits: 1000 req/hour per user                 │
│  • Per-endpoint limits: /search (10/sec), /users (100/sec) │
│  Purpose: Enforce business rules and fair usage            │
└────────────────────────────────────────────────────────────┘
                            │ ✓ Passed
                            ▼
┌────────────────────────────────────────────────────────────┐
│ LAYER 3: Application Service                              │
├────────────────────────────────────────────────────────────┤
│  • Business logic limits: Max 10 orders per day           │
│  • Resource-specific: Max 5 concurrent exports per user   │
│  • Feature flags: Rate limit beta features more strictly  │
│  Purpose: Protect business rules and expensive operations │
└────────────────────────────────────────────────────────────┘
                            │ ✓ Passed
                            ▼
┌────────────────────────────────────────────────────────────┐
│ LAYER 4: Database/Backend                                 │
├────────────────────────────────────────────────────────────┤
│  • Connection pool limits: Max 100 connections            │
│  • Query timeouts: Kill queries >30s                      │
│  • Queue depth limits: Max 1000 pending queries           │
│  Purpose: Prevent resource exhaustion at data layer       │
└────────────────────────────────────────────────────────────┘
                            │
                            ▼
                      ✓ SUCCESS
```

### Monitoring Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│               RATE LIMITER MONITORING DASHBOARD             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📊 RATE LIMIT HITS (Last Hour)                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 429 Responses: ▓▓▓▓▓▓▓░░░░ 1,247 hits               │   │
│  │ 200 Responses: ▓▓▓▓▓▓▓▓▓▓ 98,753 success            │   │
│  │ Hit Rate: 1.24%                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  📈 ALLOWED vs DENIED RATIO                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │     Allowed (98.76%)  │  Denied (1.24%)             │   │
│  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │ ▓░░                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  🔥 TOP RATE LIMITED ENDPOINTS                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  1. /api/search          847 hits  (68%)            │   │
│  │  2. /api/export          234 hits  (19%)            │   │
│  │  3. /api/analytics       166 hits  (13%)            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  👥 TOP RATE LIMITED USERS                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  user_12345    523 hits  🚨 Possible abuse          │   │
│  │  user_67890     98 hits                             │   │
│  │  user_11223     76 hits                             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ⏱️  RATE LIMIT DISTRIBUTION BY TIME                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 100%│        ▄▄                                      │   │
│  │  75%│       ████ ▄                                   │   │
│  │  50%│   ▄  ██████▄  ▄                               │   │
│  │  25%│  ███████████████                               │   │
│  │   0%│▄▄████████████████▄                            │   │
│  │     └──────────────────────────────────────         │   │
│  │      10am  11am  12pm   1pm   2pm   3pm             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ⚙️  REDIS PERFORMANCE                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Latency (p99): 2.3ms       ✓ Healthy               │   │
│  │  Memory Usage: 45% (1.8GB / 4GB)                    │   │
│  │  Commands/sec: 12,450                               │   │
│  │  Connected Clients: 87                              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  🎯 KEY METRICS                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Avg Request Rate: 27.4 req/sec                     │   │
│  │  Peak Request Rate: 145 req/sec (12:34 PM)          │   │
│  │  False Positive Rate: 0.03% (legitimate users hit)  │   │
│  │  Attack Blocked: 23 IPs (15,678 requests blocked)   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

ALERTS CONFIGURATION:
─────────────────────
• 429 rate > 5%: WARNING
• 429 rate > 15%: CRITICAL (may indicate attack or broken clients)
• Single user > 1000 429s/hour: Flag for review
• Redis latency > 10ms: WARNING
• Redis memory > 80%: CRITICAL
```

**Prometheus Queries:**

```promql
# Rate limit hit rate
rate(http_requests_total{status="429"}[5m])
  /
rate(http_requests_total[5m])

# Requests blocked per endpoint
sum by (endpoint) (rate(http_requests_total{status="429"}[5m]))

# Top users hitting rate limits
topk(10, sum by (user_id) (rate(http_requests_total{status="429"}[1h])))

# Redis rate limiter latency
histogram_quantile(0.99, rate(redis_command_duration_seconds_bucket{command="EVAL"}[5m]))
```

### Algorithm Decision Tree

```
                    START: Choose Rate Limit Algorithm
                                │
                                ▼
                    ┌─────────────────────────┐
                    │ Need to allow bursts?   │
                    └─────────────────────────┘
                         │              │
                     YES │              │ NO
                         ▼              ▼
              ┌──────────────┐    ┌──────────────────┐
              │ Memory is    │    │ Need perfectly   │
              │ constrained? │    │ smooth output?   │
              └──────────────┘    └──────────────────┘
                │          │         │            │
            YES │          │ NO   YES│            │ NO
                ▼          ▼         ▼            ▼
         ┌──────────┐ ┌─────────┐ ┌──────────┐ ┌──────────┐
         │ SLIDING  │ │ TOKEN   │ │  LEAKY   │ │  FIXED   │
         │ WINDOW   │ │ BUCKET  │ │  BUCKET  │ │  WINDOW  │
         │ COUNTER  │ │         │ │          │ │ COUNTER  │
         └──────────┘ └─────────┘ └──────────┘ └──────────┘
              │            │            │            │
              └────────────┴────────────┴────────────┘
                                │
                                ▼
                    ┌─────────────────────────────┐
                    │ Need high accuracy?         │
                    └─────────────────────────────┘
                         │              │
                     YES │              │ NO
                         ▼              ▼
              ┌──────────────────┐  ┌──────────────┐
              │ SLIDING WINDOW   │  │ Any algorithm│
              │ LOG (stores all  │  │ above works  │
              │ timestamps)      │  │              │
              └──────────────────┘  └──────────────┘

DECISION MATRIX:
═══════════════════════════════════════════════════════════════
Scenario                           Recommended Algorithm
═══════════════════════════════════════════════════════════════
API Gateway (general use)          → Sliding Window Counter
Allows bursts for good UX          → Token Bucket
Network traffic shaping            → Leaky Bucket
Simple, approximate limits         → Fixed Window Counter
High precision required            → Sliding Window Log
Distributed system                 → Sliding Window Counter
                                     (with Redis)
Security-critical (DDoS)           → Token Bucket
                                     (with low burst limit)
Per-endpoint limits                → Token Bucket
Global system protection           → Leaky Bucket
Multi-tier rate limits             → Combination (Token Bucket
                                     at API layer, Leaky at DB)
═══════════════════════════════════════════════════════════════

PRODUCTION RECOMMENDATIONS:
───────────────────────────
1. Default: Sliding Window Counter (best balance)
2. High traffic: Token Bucket (efficient, industry standard)
3. Strict smoothing: Leaky Bucket
4. Avoid: Fixed Window (boundary burst issue)
5. Avoid: Sliding Window Log (memory-heavy)
```

### Production Patterns

#### 1. Per-User vs Global Rate Limiting

```
┌──────────────────────────────────────────────────────────┐
│ PER-USER RATE LIMITING                                   │
├──────────────────────────────────────────────────────────┤
│ Each user has independent limit                          │
│                                                          │
│ User A: [🪙🪙🪙🪙🪙🪙🪙] 70/100 req/min                  │
│ User B: [🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙] 100/100 → Rate limited   │
│ User C: [🪙🪙🪙🪙🪙🪙🪙🪙🪙] 90/100                       │
│                                                          │
│ Pros:                                                    │
│  ✓ Fair: One user can't starve others                   │
│  ✓ Predictable per-user experience                      │
│                                                          │
│ Cons:                                                    │
│  ✗ Doesn't protect from coordinated attack (1000 users) │
│  ✗ More Redis memory (1 key per user)                   │
│                                                          │
│ Implementation:                                          │
│   Redis key: rate:user:{user_id}                        │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ GLOBAL RATE LIMITING                                     │
├──────────────────────────────────────────────────────────┤
│ All users share total system capacity                    │
│                                                          │
│ Global: [🪙🪙🪙🪙] 40,000/100,000 req/min                │
│                                                          │
│ All requests from all users count against same limit    │
│                                                          │
│ Pros:                                                    │
│  ✓ Protects system from total overload                  │
│  ✓ Simple implementation (1 counter)                    │
│  ✓ Memory efficient                                     │
│                                                          │
│ Cons:                                                    │
│  ✗ Unfair: Power users can starve others               │
│  ✗ No per-user guarantees                              │
│                                                          │
│ Implementation:                                          │
│   Redis key: rate:global:{endpoint}                     │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ HYBRID: PER-USER + GLOBAL (RECOMMENDED)                 │
├──────────────────────────────────────────────────────────┤
│ Both limits must be satisfied                            │
│                                                          │
│ Check Order:                                            │
│ 1. Check global limit  → If exceeded: REJECT            │
│ 2. Check per-user limit → If exceeded: REJECT           │
│ 3. Both OK: ALLOW                                       │
│                                                          │
│ Example:                                                │
│  Global: 100K req/min (protects system)                 │
│  Per-user: 1K req/min (ensures fairness)                │
│                                                          │
│ Pros:                                                    │
│  ✓ System protection (global limit)                     │
│  ✓ Fairness (per-user limit)                           │
│  ✓ Prevents coordinated attacks                        │
│                                                          │
│ Production pattern for: API Gateways, SaaS platforms    │
└──────────────────────────────────────────────────────────┘
```

**Code Example:**

```python
def check_hybrid_rate_limit(user_id: str, endpoint: str) -> bool:
    """
    Check both global and per-user rate limits
    """
    # Check global limit first (cheaper check)
    global_allowed, _ = check_rate_limit(
        identifier=f"global:{endpoint}",
        limit=100000,
        window=60
    )
    if not global_allowed:
        log_metric("rate_limit.global.exceeded", endpoint=endpoint)
        return False

    # Check per-user limit
    user_allowed, _ = check_rate_limit(
        identifier=f"user:{user_id}:{endpoint}",
        limit=1000,
        window=60
    )
    if not user_allowed:
        log_metric("rate_limit.user.exceeded", user_id=user_id)
        return False

    return True
```

#### 2. Distributed Rate Limiting Strategies

```
STRATEGY 1: Centralized (Redis)
────────────────────────────────
┌────────┐  ┌────────┐  ┌────────┐
│Server 1│  │Server 2│  │Server 3│
└────┬───┘  └────┬───┘  └────┬───┘
     │           │           │
     └───────────┴───────────┘
                 │
                 ▼
           ┌─────────┐
           │  Redis  │  ← Single source of truth
           └─────────┘

Pros: ✓ Accurate, ✓ Consistent across all servers
Cons: ✗ Redis is SPOF, ✗ Network latency

STRATEGY 2: Local + Eventual Consistency
─────────────────────────────────────────
┌────────────┐  ┌────────────┐
│ Server 1   │  │ Server 2   │
│ Local: 50  │  │ Local: 50  │  Each server gets quota
└────────────┘  └────────────┘
     │                │
     └────────┬───────┘
              ▼
        ┌─────────┐
        │Sync job │  Periodically rebalance
        └─────────┘

Pros: ✓ Fast (no network), ✓ Works if Redis down
Cons: ✗ Approximate limits, ✗ Can exceed global limit

STRATEGY 3: Fail-Open vs Fail-Closed
─────────────────────────────────────
if redis_unavailable:
    # FAIL OPEN (non-critical APIs)
    return True  # Allow request, log error

    # FAIL CLOSED (security-critical)
    return False  # Reject request, alert ops

Choose based on: Security criticality vs Availability needs
```

#### 3. Rate Limiting with Tiers

```python
# Different limits for different user tiers
RATE_LIMITS = {
    "free": {
        "requests_per_day": 100,
        "requests_per_minute": 10,
        "burst": 20
    },
    "basic": {
        "requests_per_day": 10000,
        "requests_per_minute": 100,
        "burst": 200
    },
    "premium": {
        "requests_per_day": 100000,
        "requests_per_minute": 1000,
        "burst": 2000
    },
    "enterprise": {
        "requests_per_day": None,  # Unlimited
        "requests_per_minute": 10000,
        "burst": 20000
    }
}

def get_user_limits(user: User) -> dict:
    """Get rate limits based on user tier"""
    return RATE_LIMITS.get(user.tier, RATE_LIMITS["free"])

# Usage
limits = get_user_limits(current_user)
allowed = token_bucket_check(
    user_id=current_user.id,
    max_tokens=limits["burst"],
    refill_rate=limits["requests_per_minute"] / 60
)
```

### Troubleshooting Guide

#### Problem 1: False Positives (Legitimate Users Hit Limits)

```
SYMPTOMS:
─────────
• Spike in 429 errors from known good users
• User complaints about being blocked
• Rate limit hits during legitimate usage patterns

CAUSES:
───────
1. Limits too strict for actual use case
2. Shared IP addresses (corporate NAT, VPN)
3. Aggressive retry logic (client backs off incorrectly)
4. Burst traffic that exceeds bucket capacity

SOLUTIONS:
──────────
✓ Analyze actual usage patterns before setting limits
  → Use percentile analysis (p50, p90, p99)
  → Set limit at p99 + 50% buffer

✓ Use user ID instead of IP for authenticated users
  → Avoid NAT/VPN false positives

✓ Increase burst capacity for token bucket
  → Allows legitimate spikes

✓ Implement allowlist for critical users/IPs
  if user.is_premium or ip in ALLOWLIST:
      return True  # Skip rate limiting

✓ Add exponential backoff guidance in 429 response
  Retry-After: 30  # Tell clients how long to wait
```

#### Problem 2: Bypass Attacks

```
ATTACK VECTORS:
───────────────
1. IP Rotation
   Attacker: Uses proxy pool to rotate IPs
   Defense: Rate limit by API key/session, not just IP

2. Distributed Attack
   Attacker: Uses 1000 accounts, each under limit
   Defense: Global rate limit + anomaly detection

3. Endpoint Discovery
   Attacker: Finds unprotected endpoints
   Defense: Apply default rate limit to ALL endpoints

4. Header Manipulation
   Attacker: Spoofs X-Forwarded-For header
   Defense: Trust only CDN/proxy headers, validate source

5. Cache Poisoning
   Attacker: Bypasses API by hitting CDN with unique params
   Defense: Rate limit at CDN level, normalize cache keys

DETECTION:
──────────
• Monitor for: Same user hitting limit across many IPs
• Alert on: Sudden spike in 429s from new accounts
• Track: Requests with suspicious patterns (sequential IDs)

MITIGATION:
───────────
rate_limit_config = {
    "authenticated": {
        "by": ["user_id", "api_key"],  # Not IP
        "limit": 1000
    },
    "anonymous": {
        "by": ["ip", "fingerprint"],  # Device fingerprint
        "limit": 10  # Much stricter
    },
    "global": {
        "limit": 100000  # System-wide protection
    }
}
```

#### Problem 3: Redis Performance Degradation

```
SYMPTOMS:
─────────
• Increasing latency on rate limit checks
• Timeouts on Redis commands
• Memory pressure on Redis

CAUSES:
───────
1. Too many keys (one per user)
2. Keys not expiring (missing TTL)
3. Redis not scaled for traffic
4. Inefficient Lua scripts

DEBUG:
──────
# Check Redis stats
redis-cli INFO stats
  → Look at: instantaneous_ops_per_sec, used_memory

# Find memory hogs
redis-cli --bigkeys

# Monitor slow commands
redis-cli SLOWLOG GET 10

SOLUTIONS:
──────────
✓ Set TTL on all rate limit keys
  EXPIRE rate:user:123 3600  # Auto-cleanup

✓ Use Redis cluster for horizontal scaling
  → Shard by user_id: rate:user:{user_id} → hashed to node

✓ Optimize Lua scripts (avoid KEYS command)

✓ Use local caching for "cold" users
  # Cache "user not rate limited" for 1 second
  local_cache.set(f"ok:{user_id}", True, ttl=1)
  → Reduces Redis calls by 90% for typical usage

✓ Monitor and alert
  if redis_latency_p99 > 10ms:
      alert("Rate limiter Redis slow")
```

#### Problem 4: Clock Skew in Distributed Systems

```
PROBLEM:
────────
Server 1 clock: 12:00:00
Server 2 clock: 12:00:05  (5 seconds ahead)

User makes request to Server 1 at 12:00:00 → Uses window [12:00-12:01]
User makes request to Server 2 at 12:00:01 → Uses window [12:00-12:01]
                                               (but clock says 12:00:06)

Result: Inconsistent window boundaries

SOLUTION:
─────────
✓ Use Redis timestamp (single source of truth)
  now = redis.TIME()[0]  # Unix timestamp from Redis

✓ NTP sync on all servers
  → Keep clock skew < 100ms

✓ Use sliding window (less sensitive to clock drift)
  → Fixed windows more affected by boundaries
```

### Real-World Examples

#### GitHub API Rate Limits

```
GitHub REST API v3 Rate Limiting:
──────────────────────────────────

Authenticated:   5,000 requests/hour per user
Unauthenticated: 60 requests/hour per IP

Headers in every response:
─────────────────────────
X-RateLimit-Limit: 5000
X-RateLimit-Remaining: 4999
X-RateLimit-Reset: 1677649200
X-RateLimit-Used: 1
X-RateLimit-Resource: core

Different limits per API category:
──────────────────────────────────
• Core API: 5,000/hour
• Search API: 30/minute (more expensive)
• GraphQL API: 5,000 points/hour (cost per query varies)
• Actions: 1,000/hour per repository

HTTP 403 (not 429!) when rate limited:
──────────────────────────────────────
{
  "message": "API rate limit exceeded for user ID 12345.",
  "documentation_url": "https://docs.github.com/rest/overview/resources-in-the-rest-api#rate-limiting"
}

Client best practices:
──────────────────────
1. Always authenticate (60 → 5000 req/hour)
2. Cache responses aggressively
3. Use conditional requests (If-None-Match)
4. Handle 403 with exponential backoff
5. Check X-RateLimit-Remaining before batch operations

Implementation detail:
──────────────────────
• Algorithm: Sliding window
• Per-user tracking (by OAuth token/API key)
• Separate quotas for different API families
• Reset at top of hour (aligned to UTC)
```

#### Stripe API Rate Limits

```
Stripe Rate Limiting Strategy:
───────────────────────────────

Test mode:  25 requests/second
Live mode:  100 requests/second (default)
            Can be increased for high-volume merchants

Algorithm: Token bucket
─────────────────────
• Allows bursts up to limit
• Smooth refill over time
• Per-account tracking

HTTP 429 response:
──────────────────
{
  "error": {
    "message": "Too many requests",
    "type": "rate_limit_error"
  }
}

Special handling:
─────────────────
• No Retry-After header (implement exponential backoff)
• Read operations: Less strict limits
• Write operations: Stricter limits (creates, updates)
• Webhook deliveries: Separate limit (not counted)

Client libraries handle automatically:
──────────────────────────────────────
stripe.max_network_retries = 2  # Built-in retry with backoff

Best practices:
───────────────
1. Batch operations when possible (create 10 customers → 1 request)
2. Use webhooks instead of polling (listen for events)
3. Implement jittered exponential backoff
4. Monitor rate limit errors in production
5. Request limit increase for predictable high volume

Real production example:
────────────────────────
E-commerce site processing 1000 orders/minute:
• Don't create Stripe charge on each order immediately
• Queue orders → batch process every 10 seconds
• 1000 orders/min → 100 Stripe API calls/min (well under limit)
• Retry failed calls with exponential backoff
```

#### AWS API Gateway Rate Limiting

```
AWS API Gateway Throttling:
───────────────────────────

Account-level limits (default):
• 10,000 requests/second across all APIs
• 5,000 concurrent connections

API-level limits (configurable):
• Rate: Steady-state requests/second
• Burst: Maximum concurrent requests

Example configuration:
──────────────────────
API: "my-api"
  Rate: 1000 req/sec
  Burst: 2000 concurrent

Stage: "prod"
  Rate: 500 req/sec  (overrides API-level)
  Burst: 1000

Method: "GET /users"
  Rate: 100 req/sec  (overrides Stage-level)
  Burst: 200

Algorithm: Token bucket
───────────────────────
• Burst = bucket size
• Rate = refill rate

Response when throttled:
────────────────────────
HTTP/1.1 429 Too Many Requests
{"message": "Limit Exceeded"}

Integration with Usage Plans:
─────────────────────────────
Usage Plan: "Free Tier"
  Rate: 10 req/sec
  Burst: 20
  Quota: 10,000 req/month

Usage Plan: "Premium"
  Rate: 1000 req/sec
  Burst: 2000
  Quota: 10,000,000 req/month

Associate API key → Usage Plan → Per-customer limits

CloudWatch metrics:
───────────────────
• Count: Total requests
• 4XXError: Client errors (429s included)
• Latency: Response time
• CacheHitCount / CacheMissCount

Production setup:
─────────────────
1. Set conservative defaults (rate=100, burst=200)
2. Monitor CloudWatch for throttling
3. Increase limits based on actual usage
4. Use Usage Plans for multi-tier pricing
5. Enable CloudWatch Alarms for high throttle rates
```

## The "Why" Chain

**Why rate limit?**
→ Protect from abuse, ensure fair usage, prevent cascading failures, control costs

**What's the alternative?**
→ Over-provision for worst case (expensive), or hope for the best (dangerous)

**What breaks without it?**
→ One user can take down the entire system, costs spike from abuse (especially cloud APIs), no fairness guarantees, DDoS attacks succeed easily

**Why not just scale infinitely?**
→ Cost prohibitive, some resources don't scale (database connections, third-party APIs), attack traffic can outpace scaling speed

**Why distributed rate limiting is hard?**
→ Race conditions between servers, network latency to centralized store, clock skew, need for atomic operations

## Common Pitfalls

1. **Single layer rate limiting**
   - Pitfall: Only rate limit at API gateway
   - Fix: Defense in depth (CDN, gateway, application, database)

2. **Not returning proper 429 headers**
   - Pitfall: No Retry-After, no X-RateLimit-* headers
   - Fix: Always include Retry-After and remaining quota info

3. **Fixed window boundary burst**
   - Pitfall: Using fixed window allows 2x traffic at boundaries
   - Fix: Use sliding window counter or token bucket

4. **Redis as SPOF**
   - Pitfall: Redis down → all rate limiting fails
   - Fix: Fail-open for non-critical, circuit breaker, Redis cluster

5. **Rate limiting by IP only**
   - Pitfall: NAT, VPNs cause false positives; easy to bypass with proxies
   - Fix: Use user_id for authenticated, fingerprinting for anonymous

6. **No monitoring**
   - Pitfall: Don't know if rate limiting is too strict/lenient
   - Fix: Dashboard with 429 rate, top limited users, alerts

7. **Synchronous rate limit checks**
   - Pitfall: Every request waits for Redis round-trip
   - Fix: Local caching, async patterns, optimized Redis commands

8. **Not documenting limits**
   - Pitfall: Developers hit limits unexpectedly
   - Fix: Clear documentation, error messages with links

## Interview Tips

- **Rate limiter is a common standalone question AND component in larger designs**

- **Default answer: "Token bucket with Redis"**
  - Covers 90% of use cases
  - Industry standard (AWS, Stripe, Cloudflare use variations)

- **Always mention three dimensions:**
  1. **Where:** API gateway, CDN, application layer
  2. **By what:** User ID, IP, API key, endpoint
  3. **Algorithm:** Token bucket (default), sliding window (if asked about accuracy)

- **Distributed systems consideration:**
  - Mention centralized counter (Redis) for consistency
  - Discuss race conditions → atomic Lua scripts
  - Mention fail-open vs fail-closed tradeoff

- **Follow-up questions to expect:**
  - "How do you handle Redis being down?" → Fail-open for availability, fail-closed for security
  - "What if user has multiple devices?" → Rate limit by user_id, not IP
  - "How to prevent boundary burst?" → Use sliding window or token bucket, not fixed window
  - "How to rate limit distributed system?" → Centralized counter in Redis with atomic ops

- **Show production awareness:**
  - Mention monitoring (429 rate, top offenders)
  - Discuss client retry behavior (exponential backoff)
  - Talk about multi-tier limits (free vs premium)

- **Clarify requirements early:**
  - Precision needed? (affects algorithm choice)
  - Single-server or distributed?
  - Fail-open or fail-closed if rate limiter fails?
  - Need to support bursts?

## Links

- [[02_building_blocks/api_gateway]] — Rate limiting is a gateway function
- [[01_fundamentals/api_design]] — Rate limiting is part of API design
- [[05_case_studies/design_rate_limiter]] — Full case study
- [[back_pressure]] — Related concept
- [[02_building_blocks/load_balancer]] — Works with load balancers
- [[02_building_blocks/caching]] — Caching reduces need for rate limiting
- [[04_case_studies/url_shortener]] — Real-world rate limiting example
