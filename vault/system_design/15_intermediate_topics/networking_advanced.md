#system-design #intermediate #networking

# Networking Advanced — What Happens Under the Hood

---

## TCP Deep Dive

### Three-Way Handshake (Connection Setup)
```
Client → SYN (seq=100) → Server          ~1 RTT
Client ← SYN-ACK (seq=200, ack=101) ← Server
Client → ACK (ack=201) → Server          ~1 RTT
Connection established (2 RTTs total)
```

### TCP Window & Flow Control

**Sliding window:** Sender can send up to `window_size` bytes before waiting for ACK.
```
Small window (16KB) → send 16KB, wait for ACK, send 16KB...
Large window (1MB) → send 1MB, get ACKs while sending → much higher throughput
```

**Slow start:** TCP starts with small window, doubles each RTT until packet loss detected. This is why first requests are slower than subsequent ones.

**Impact on system design:** New TCP connections start slow. **Keep-alive connections** avoid repeated slow starts. This is why connection pooling matters.

### TCP vs UDP Revisited

| | TCP | UDP |
|--|-----|-----|
| **Connection** | 3-way handshake (2 RTT overhead) | No setup |
| **Reliability** | Guaranteed delivery, ordered | Best effort |
| **Head-of-line blocking** | Yes (one lost packet blocks all) | No |
| **Use in system design** | HTTP, database connections, file transfer | DNS, video streaming, gaming, QUIC |

---

## HTTP/2 — Why It Matters

```
HTTP/1.1:  One request per connection (or 6 parallel connections to same domain)
HTTP/2:    Multiple requests multiplexed over SINGLE connection

Browser → [Stream 1: GET /index.html]
          [Stream 2: GET /style.css ]  ← All on same TCP connection
          [Stream 3: GET /app.js   ]
          [Stream 4: GET /image.png]
```

**Key features:**
- **Multiplexing:** Multiple requests/responses on one connection
- **Header compression (HPACK):** Reduce header overhead (repeated headers like cookies)
- **Server push:** Server sends resources before client requests them
- **Binary framing:** More efficient than text-based HTTP/1.1

**System design impact:** Fewer connections needed. Lower latency. gRPC is built on HTTP/2.

---

## HTTP/3 + QUIC

```
HTTP/2 problem: TCP head-of-line blocking
  One lost packet in TCP → ALL streams blocked until retransmit

HTTP/3 solution: QUIC (UDP-based)
  Lost packet in Stream 2 → only Stream 2 blocked. Streams 1, 3, 4 continue.
```

**QUIC advantages:**
- No head-of-line blocking (per-stream flow control)
- 0-RTT connection setup (for repeat connections)
- Built-in encryption (TLS 1.3 integrated)
- Connection migration (switch WiFi to cellular without reconnecting)

**Adoption:** Google (YouTube, Gmail), Cloudflare, Meta. Becoming the new standard.

---

## DNS in Production

### DNS Resolution Chain
```
Browser cache → OS cache → Router cache → ISP DNS → Root → TLD → Authoritative
                                                     (ms)   (ms)     (ms)
```

### DNS-Based Load Balancing
```
nslookup api.myapp.com
→ 52.1.2.3 (US-East)
→ 35.4.5.6 (EU-West)
→ 13.7.8.9 (Asia)

Route 53 geo-routing: User in India → Asia IP
Weighted routing: 80% to server A, 20% to server B (canary)
Failover routing: Primary down → return backup IP
```

### DNS TTL Strategy
| Record Type | TTL | Why |
|------------|-----|-----|
| Static services | 1 hour - 24 hours | Rarely changes |
| Load-balanced | 60 seconds | Need quick failover |
| During migration | 30 seconds | Rapid switchover |
| Emergency | As low as possible (30s) | Minimize stale DNS |

---

## WebSocket at Scale

### Connection Management

```
10M concurrent WebSocket connections
Each connection: ~20KB memory
Total: ~200GB RAM just for connections

Solution: Spread across WebSocket server fleet
  WS Server 1: 500K connections
  WS Server 2: 500K connections
  ...
  WS Server 20: 500K connections

Connection registry (Redis):
  user:123 → ws-server-7
  user:456 → ws-server-12
```

### Cross-Server Message Routing

User A (ws-server-1) sends message to User B (ws-server-12):
```
ws-server-1 → Redis pub/sub → ws-server-12 → User B

Or: ws-server-1 → Kafka topic → ws-server-12 → User B
```

---

## CDN Internals

### How CDN Routing Works (Anycast)

```
User in Mumbai types api.myapp.com
DNS returns CDN IP: 198.51.100.1
BUT: This IP exists at 200+ locations globally
Network routing (BGP) directs to NEAREST location
→ Mumbai edge server responds
```

**Anycast:** Same IP advertised from multiple locations. Network naturally routes to closest one.

### Cache Hit Optimization

```
Cache hit ratio = hits / (hits + misses)

Strategies to improve:
1. Longer TTL (Cache-Control: max-age=86400)
2. Normalize URLs (strip unnecessary query params)
3. Vary header optimization (don't split cache unnecessarily)
4. Pre-warm cache for known popular content
5. Stale-while-revalidate (serve stale, refresh in background)
```

## Links

- [[../01_fundamentals/networking_basics]] — Networking fundamentals
- [[../01_fundamentals/api_design]] — HTTP, WebSocket, gRPC
- [[../02_building_blocks/cdn]] — CDN usage
- [[../02_building_blocks/load_balancers]] — L4 vs L7
