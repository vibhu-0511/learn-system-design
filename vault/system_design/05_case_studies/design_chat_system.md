#system-design #case-study #intermediate

# Design a Chat System (WhatsApp / Messenger)

## The Question

> "Design a real-time messaging system like WhatsApp."

---

## Core Definitions

### Chat System
A **Chat System** is a real-time communication platform that enables users to send and receive messages instantly. It maintains persistent connections between clients and servers to provide low-latency message delivery, typically <100ms. Key characteristics include:
- Bidirectional communication (client ↔ server)
- Message persistence and delivery guarantees
- Support for 1-to-1 and group conversations
- Rich features: media sharing, receipts, presence indicators

### WebSocket
**WebSocket** is a protocol (RFC 6455) that provides full-duplex communication channels over a single TCP connection. Unlike HTTP's request-response model, WebSocket enables:
- Persistent connection (reduces overhead of repeated handshakes)
- Server-initiated push (no polling required)
- Low latency (~10-50ms frame overhead vs HTTP's ~200-500ms)
- Efficient binary framing protocol

```
HTTP Handshake:
GET /chat HTTP/1.1
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: x3JJHMbDL1EzLkh9GBhXDw==

Response:
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: HSmrc0sMlYUkAGmm5OPpG2HaGWk=

→ Connection upgraded, persistent bidirectional channel established
```

### Message Queue
A **Message Queue** is an asynchronous communication mechanism that decouples message producers from consumers. In chat systems:
- **Purpose**: Buffer messages during traffic spikes, enable async processing
- **Pattern**: Producer (Chat Service) → Queue (Kafka) → Consumer (Delivery Service)
- **Benefits**: Fault tolerance, load smoothing, scalability
- **Example**: If delivery service crashes, messages remain in queue for reprocessing

### Presence
**Presence** indicates a user's current availability status (online, offline, away, typing). Implementation challenges:
- **Real-time updates**: Must propagate status changes within <1s
- **Scale**: 50M concurrent users → 50M presence records to track
- **Efficiency**: Heartbeat mechanism to avoid constant polling
- **Privacy**: Configurable visibility (who can see your status)

### Read Receipt
**Read Receipt** confirms that a message has been seen by the recipient. Three-tier delivery model:
- **Sent (✓)**: Server acknowledges receiving message from sender
- **Delivered (✓✓)**: Message delivered to recipient's device
- **Read (blue ✓✓)**: Recipient opened conversation and viewed message

Implementation: Each state change triggers an acknowledgment message back through the system.

### Push Notification
**Push Notification** delivers messages to offline devices via platform-specific services:
- **iOS**: Apple Push Notification Service (APNs)
- **Android**: Firebase Cloud Messaging (FCM)
- **Flow**: Server → APNs/FCM → Device OS → App notification

Critical for offline message delivery and user engagement.

### Message Ordering
**Message Ordering** ensures messages appear in the correct chronological sequence. Challenges:
- **Clock skew**: Different servers have slightly different times
- **Network delays**: Messages may arrive out of order
- **Solution**: Lamport timestamps or vector clocks + sequence numbers
  - `message_id = timestamp_ms + sequence + server_id`
  - Guarantees total ordering within a conversation

---

## Step 1: Requirements

**Functional:**
- 1-to-1 messaging with message history
- Group chats (up to 500 members)
- Sent/delivered/read receipts
- Media sharing (images, videos, files up to 100MB)
- Online presence indicators
- Push notifications for offline users
- Message search within conversations
- Multi-device support (3 devices per user)

**Non-Functional:**
- Real-time delivery (<100ms latency)
- 99.99% availability (52min downtime/year)
- Message ordering guaranteed per conversation
- Reliable delivery (no lost messages, at-least-once semantics)
- End-to-end encryption (E2EE)
- Horizontal scalability to billions of messages/day
- Global distribution (CDN for media)

**Out of Scope:**
- Video/voice calls
- Message editing/deletion
- Stories/status updates
- Payment features

---

## Step 2: Estimation & Capacity Planning

### Traffic Estimation

| Metric | Value | Calculation |
|--------|-------|-------------|
| **Daily Active Users (DAU)** | 50M | Assumption |
| **Messages/user/day** | 40 | Industry average |
| **Total messages/day** | 2B | 50M × 40 |
| **Messages/sec (avg)** | 23,000 | 2B / 86,400 |
| **Messages/sec (peak)** | 115,000 | 5× avg (rush hours) |
| **Concurrent WebSocket connections** | 25M | 50% of DAU online simultaneously |
| **Message size (text)** | 200 bytes | Average text message |
| **Media messages** | 20% | 1 in 5 messages includes media |

### Storage Capacity

```
Text Messages:
- 2B messages/day × 200 bytes = 400 GB/day
- Annual: 400 GB × 365 = 146 TB/year
- 3-year retention: 438 TB

Media Storage:
- Media messages: 400M/day (20% of 2B)
- Average media size: 2 MB (mix of images/videos)
- 400M × 2 MB = 800 TB/day
- 1-year retention: 292 PB
- With compression (50%): 146 PB
```

### Bandwidth Requirements

```
Outbound (message delivery):
- 23K msg/sec × 200 bytes = 4.6 MB/s (text)
- Peak: 23 MB/s
- Media: Additional 800 TB/day = 9.3 GB/s avg
- Total peak bandwidth: ~50 GB/s

WebSocket heartbeats:
- 25M connections × 100 bytes/30s = 83 MB/s
```

### Server Capacity

```
WebSocket Servers:
- Connections/server: 65,000 (OS limit: 64K ports, leave overhead)
- Servers needed: 25M / 65K = 385 servers
- With 2× redundancy: 770 servers

Chat Service Servers:
- Throughput: 10K requests/sec per server (typical)
- Servers needed: 115K / 10K = 12 servers (peak)
- With headroom (3×): 36 servers

Cassandra Cluster:
- Write throughput: 10K writes/sec per node
- Nodes needed: 115K / 10K = 12 nodes
- With replication factor 3: 36 nodes
```

### Cost Estimation (Monthly)

```
Servers (AWS):
- WebSocket: 770 × c6i.4xlarge ($400/mo) = $308K
- Chat Service: 36 × c6i.8xlarge ($800/mo) = $29K
- Cassandra: 36 × i3.4xlarge ($900/mo) = $32K

Storage:
- S3 media: 146 PB × $0.023/GB = $3.4M
- EBS for Cassandra: 500 TB × $0.08/GB = $40K

Data Transfer:
- 50 GB/s × 2.6M sec/month = 130 PB/mo
- $0.05/GB after free tier = $6.5M

Total: ~$10M/month for 50M DAU
```

---

## Step 3: High-Level Design

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ iOS App  │  │ Android  │  │   Web    │  │ Desktop  │       │
│  │          │  │   App    │  │  Client  │  │   App    │       │
│  └─────┬────┘  └─────┬────┘  └─────┬────┘  └─────┬────┘       │
└────────┼─────────────┼─────────────┼─────────────┼─────────────┘
         │             │             │             │
         └─────────────┴──────┬──────┴─────────────┘
                              │ WebSocket (wss://)
         ┌────────────────────┴────────────────────┐
         │                                          │
┌────────▼────────┐  Load Balancer (L4)   ┌────────▼────────┐
│  WS Gateway-1   │◄─────────────────────►│  WS Gateway-N   │
│  (Connection    │   Consistent Hashing   │  (Connection    │
│   Handler)      │                        │   Handler)      │
└────────┬────────┘                        └────────┬────────┘
         │                                           │
         │    ┌──────────────────────────────────┐  │
         └────►     CONNECTION REGISTRY          ◄──┘
              │  Redis Cluster (Distributed)     │
              │  user:123 → ws-gateway-5:conn-id │
              └──────────────────────────────────┘
                              │
         ┌────────────────────┴────────────────────┐
         │                                          │
┌────────▼────────┐                        ┌───────▼─────────┐
│  Chat Service   │                        │ Presence Service│
│  (Business      │                        │ (Online/Offline)│
│   Logic)        │                        │                 │
└────────┬────────┘                        └───────┬─────────┘
         │                                          │
         │                                  ┌───────▼─────────┐
         │                                  │ Redis (Presence)│
         │                                  │ TTL-based       │
         │                                  └─────────────────┘
         │
    ┌────┴─────┐
    │          │
    ▼          ▼
┌───────┐  ┌─────────────┐      ┌──────────────┐
│Message│  │  Delivery   │─────►│ Push Notif.  │
│Queue  │─►│  Service    │      │ APNs / FCM   │
│(Kafka)│  │             │      └──────────────┘
└───────┘  └─────────────┘
    │
    │         ┌─────────────────┐
    └────────►│  Message Store  │
              │  (Cassandra)    │
              │  Partition by   │
              │  conversation   │
              └─────────────────┘
                      │
              ┌───────┴────────┐
              │                │
         ┌────▼─────┐    ┌────▼─────┐
         │ S3/Blob  │    │  Search  │
         │ Storage  │    │(ElasticS)│
         │ (Media)  │    │          │
         └──────────┘    └──────────┘
              │
         ┌────▼─────┐
         │   CDN    │
         │(CloudFrnt)
         └──────────┘
```

---

## Step 4: Deep Dive

### 4.1 WebSocket Connection Management

#### Visual Diagram: Connection Lifecycle

```
┌──────────┐
│ Client   │
│ Device   │
└─────┬────┘
      │ 1. Connect (wss://chat.example.com)
      ▼
┌─────────────────────────────────────────────────────────┐
│          Load Balancer (Layer 4 - TCP)                  │
│  Sticky sessions: Hash(user_id) → consistent server     │
└─────┬───────────────────────────────────────────────────┘
      │ 2. Route to WS server
      ▼
┌─────────────────────────────────────────────────────────┐
│              WebSocket Gateway Server                    │
│                                                          │
│  ┌────────────────────────────────────────────┐         │
│  │ Connection Handler                         │         │
│  │ 1. TLS handshake                           │         │
│  │ 2. WebSocket upgrade (HTTP → WS)           │         │
│  │ 3. Authenticate (JWT token validation)     │         │
│  │ 4. Generate connection_id                  │         │
│  └────────────────────────────────────────────┘         │
└─────┬───────────────────────────────────────────────────┘
      │ 3. Register connection
      ▼
┌─────────────────────────────────────────────────────────┐
│         Connection Registry (Redis Cluster)              │
│                                                          │
│  HSET user:alice:devices                                │
│       "device_1" → "ws-server-5:conn-abc123"            │
│       "device_2" → "ws-server-12:conn-xyz789"           │
│                                                          │
│  SET conn:abc123:metadata                                │
│      { user_id: "alice",                                │
│        device_id: "device_1",                           │
│        connected_at: "2026-02-14T10:00:00Z" }          │
│                                                          │
│  EXPIRE user:alice:presence 60  (heartbeat)            │
└─────────────────────────────────────────────────────────┘
      │
      │ 4. Connection established
      ▼
┌──────────────────────────────────────────────────────────┐
│            Persistent WebSocket Channel                  │
│    ┌──────────────────────────────────────┐             │
│    │  Heartbeat Loop (every 30 seconds)   │             │
│    │  Client → Server: PING               │             │
│    │  Server → Client: PONG               │             │
│    │  Updates Redis TTL                   │             │
│    └──────────────────────────────────────┘             │
└──────────────────────────────────────────────────────────┘

Connection Failure Scenarios:

┌──────────────┐
│ Network Drop │ → WebSocket closed event
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────────┐
│ 1. Server detects closure           │
│ 2. Remove from connection registry  │
│ 3. Stop heartbeat timer             │
│ 4. Presence: online → offline (60s) │
└─────────────────────────────────────┘
       │
       │ Client auto-reconnect (exponential backoff)
       ▼
┌─────────────────────────────────────┐
│ Reconnection Protocol:              │
│ 1. New WebSocket handshake          │
│ 2. Send last_message_id received    │
│ 3. Server sends missed messages     │
│ 4. Update connection registry       │
└─────────────────────────────────────┘
```

#### Connection State Management

```python
# Redis data structures

# Per-user device mapping
user:{user_id}:devices (Hash)
  field: device_id
  value: "ws-server-id:connection-id"

# Connection metadata
conn:{connection_id}:metadata (String, JSON)
  {
    "user_id": "alice",
    "device_id": "device_1",
    "server_id": "ws-server-5",
    "connected_at": "2026-02-14T10:00:00Z",
    "client_ip": "203.0.113.45",
    "user_agent": "WhatsApp/2.26.0 iOS/16.3"
  }

# Server-to-connections index (for graceful shutdown)
ws-server:{server_id}:connections (Set)
  members: [conn-abc123, conn-xyz789, ...]

# Presence with TTL
user:{user_id}:presence (String)
  value: "online"
  TTL: 60 seconds (refreshed by heartbeat)
```

### 4.2 Message Flow

#### Visual Diagram: 1-to-1 Message Flow

```
┌─────────┐                                           ┌─────────┐
│ Alice   │                                           │   Bob   │
│ (Sender)│                                           │(Receiver)│
└────┬────┘                                           └────┬────┘
     │                                                      │
     │ 1. Send message                                     │
     │    { to: "bob",                                     │
     │      content: "Hey Bob!",                           │
     │      msg_id: "temp-123" }                           │
     │                                                      │
     ▼                                                      │
┌──────────────────┐                                       │
│ WS Gateway-5     │                                       │
│ (Alice's server) │                                       │
└────┬─────────────┘                                       │
     │                                                      │
     │ 2. Forward to Chat Service                          │
     ▼                                                      │
┌──────────────────────────────────────────────┐           │
│           Chat Service (Stateless)            │           │
│                                               │           │
│  ┌────────────────────────────────────────┐  │           │
│  │ Step 1: Validate & Generate ID         │  │           │
│  │  - Auth check: Alice can send to Bob   │  │           │
│  │  - Generate: msg_id = UUID v7          │  │           │
│  │    (time-ordered: 1707901234567-abc)   │  │           │
│  │  - Timestamp: server time (UTC)        │  │           │
│  └────────────────────────────────────────┘  │           │
│                                               │           │
│  ┌────────────────────────────────────────┐  │           │
│  │ Step 2: Persist Message                │  │           │
│  │  - Write to Cassandra                  │  │           │
│  │  - Ack to Alice: SENT ✓                │  │           │
│  └────────────────────────────────────────┘  │           │
│                                               │           │
│  ┌────────────────────────────────────────┐  │           │
│  │ Step 3: Queue for Delivery             │  │           │
│  │  - Publish to Kafka topic              │  │           │
│  │    Topic: message-delivery             │  │           │
│  │    Key: bob (for partitioning)         │  │           │
│  └────────────────────────────────────────┘  │           │
└────┬──────────────────────────────────────────┘           │
     │                                                      │
     │ 3. ACK: Message SENT ✓                              │
     ◄──────────────────────────────────────────           │
     │                                                      │
     ▼                                                      │
┌──────────────────┐                                       │
│ Message Queue    │                                       │
│ (Kafka)          │                                       │
│                  │                                       │
│ Topic: message-  │                                       │
│        delivery  │                                       │
│ Partition: 3     │                                       │
│ (hash(bob) % 10) │                                       │
└────┬─────────────┘                                       │
     │                                                      │
     │ 4. Consume message                                  │
     ▼                                                      │
┌──────────────────────────────────────────────┐           │
│         Delivery Service (Consumer)           │           │
│                                               │           │
│  ┌────────────────────────────────────────┐  │           │
│  │ Step 1: Lookup Bob's Connections       │  │           │
│  │  Query Redis:                          │  │           │
│  │    user:bob:devices                    │  │           │
│  │  Result:                               │  │           │
│  │    device_1 → ws-server-12:conn-xyz    │  │           │
│  │    device_2 → ws-server-8:conn-pqr     │  │           │
│  └────────────────────────────────────────┘  │           │
│                                               │           │
│  ┌────────────────────────────────────────┐  │           │
│  │ Step 2: Route to WS Servers            │  │           │
│  │  - RPC call to ws-server-12            │  │           │
│  │  - RPC call to ws-server-8             │  │           │
│  │  (Deliver to all Bob's devices)        │  │           │
│  └────────────────────────────────────────┘  │           │
└────┬──────────────────────────────────────────┘           │
     │                                                      │
     │ 5. Deliver message                                  │
     │                                                      │
     ├──────────────────────┐                              │
     │                      │                              │
     ▼                      ▼                              │
┌──────────────┐      ┌──────────────┐                    │
│ WS Server-12 │      │ WS Server-8  │                    │
│ (Bob device1)│      │ (Bob device2)│                    │
└──────┬───────┘      └──────┬───────┘                    │
       │                     │                             │
       │ 6. Push via WebSocket                            │
       └─────────────────────┴─────────────────────────────►
                                                            │
                                                            │
       ┌────────────────────────────────────────────────────┘
       │ 7. Client receives & ACKs
       │    { status: "delivered" }
       │
       ▼
┌──────────────────────────────────────────────┐
│         Delivery ACK Flow (Reverse)           │
│                                               │
│  Bob's client → WS Server-12                  │
│              → Delivery Service               │
│              → Update Cassandra               │
│              → Notify Alice: DELIVERED ✓✓     │
└───────────────────────────────────────────────┘

┌─────────┐
│ Alice   │ ← Receipt update: DELIVERED ✓✓
└─────────┘

Bob opens conversation:
┌─────────┐
│   Bob   │ → Sends read receipt
└─────────┘
              ↓
         Update: READ (blue ✓✓)
              ↓
┌─────────┐
│ Alice   │ ← Receipt update: READ (blue ✓✓)
└─────────┘
```

#### Visual Diagram: Group Message Flow (Fan-out)

```
┌─────────┐
│ Alice   │ Sends message to Group (Bob, Charlie, Diana)
└────┬────┘
     │
     │ 1. Send group message
     │    { group_id: "group-xyz",
     │      content: "Team meeting at 3pm" }
     ▼
┌──────────────────────────────────────────────┐
│           Chat Service                        │
│                                               │
│  ┌────────────────────────────────────────┐  │
│  │ 1. Validate group membership           │  │
│  │    - Alice is member of group-xyz      │  │
│  │    - Fetch member list:                │  │
│  │      [bob, charlie, diana]             │  │
│  └────────────────────────────────────────┘  │
│                                               │
│  ┌────────────────────────────────────────┐  │
│  │ 2. Persist message (single write)      │  │
│  │    Cassandra:                          │  │
│  │    conversation_id: group-xyz          │  │
│  │    message_id: msg-789                 │  │
│  │    sender: alice                       │  │
│  │    content: "Team meeting at 3pm"      │  │
│  └────────────────────────────────────────┘  │
│                                               │
│  ┌────────────────────────────────────────┐  │
│  │ 3. Fan-out to delivery queues          │  │
│  │    Publish 3 delivery tasks:           │  │
│  │    - Task 1: deliver to bob            │  │
│  │    - Task 2: deliver to charlie        │  │
│  │    - Task 3: deliver to diana          │  │
│  └────────────────────────────────────────┘  │
└────┬──────────────────────────────────────────┘
     │
     ├─────────────┬─────────────┬─────────────┐
     │             │             │             │
     ▼             ▼             ▼             ▼
┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
│ Kafka   │  │ Kafka   │  │ Kafka   │  │ Kafka   │
│ Part. 0 │  │ Part. 1 │  │ Part. 2 │  │ Part. 3 │
│         │  │         │  │         │  │         │
│ (bob)   │  │(charlie)│  │ (diana) │  │         │
└────┬────┘  └────┬────┘  └────┬────┘  └─────────┘
     │            │            │
     ▼            ▼            ▼
┌────────────────────────────────────┐
│    Delivery Service (Multiple      │
│      Consumer Instances)            │
└─┬──────────────┬──────────────┬────┘
  │              │              │
  │ Lookup       │ Lookup       │ Lookup
  │ Bob's        │ Charlie's    │ Diana's
  │ connection   │ connection   │ connection
  │              │              │
  ▼              ▼              ▼
┌────────┐   ┌────────┐   ┌────────┐
│  Bob   │   │Charlie │   │ Diana  │
│        │   │        │   │(Offline)│
└────────┘   └────────┘   └────┬───┘
                               │
                               │ No active connection
                               ▼
                          ┌─────────────────┐
                          │ Store in        │
                          │ pending_msgs    │
                          │ queue           │
                          └────┬────────────┘
                               │
                               ▼
                          ┌─────────────────┐
                          │ Push            │
                          │ Notification    │
                          │ FCM/APNs        │
                          └─────────────────┘

Read Receipts in Groups:
┌─────────────────────────────────────────────┐
│  Bob reads message → Update:                │
│    msg-789:read_by → [bob]                  │
│                                              │
│  Charlie reads message → Update:            │
│    msg-789:read_by → [bob, charlie]         │
│                                              │
│  Alice sees: "Read by Bob, Charlie"         │
└─────────────────────────────────────────────┘
```

### 4.3 Presence Detection

#### Visual Diagram: Presence System

```
┌──────────────────────────────────────────────────────────┐
│                 Presence Architecture                     │
└──────────────────────────────────────────────────────────┘

┌─────────┐
│ User    │
│ Client  │
└────┬────┘
     │
     │ WebSocket connection active
     │
     ▼
┌─────────────────────────────────────────────────────────┐
│         Heartbeat Mechanism (Client-side)                │
│                                                          │
│  Every 30 seconds:                                       │
│    1. Send HEARTBEAT frame via WebSocket                │
│       { type: "heartbeat", user_id: "alice" }           │
│                                                          │
│    2. Update activity timestamp                          │
│       { last_activity: Date.now() }                     │
└────┬────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────┐
│         WebSocket Gateway (Server-side)                  │
│                                                          │
│  On HEARTBEAT received:                                  │
│    1. Validate connection_id                            │
│    2. Refresh Redis TTL                                 │
│    3. Publish presence update                           │
└────┬────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────┐
│         Presence Service (Redis Cluster)                 │
│                                                          │
│  Data Structure:                                         │
│                                                          │
│    user:alice:presence                                   │
│      value: "online"                                     │
│      TTL: 60 seconds                                     │
│                                                          │
│  Automatic expiration:                                   │
│    - If no heartbeat for 60s → key expires              │
│    - Redis publishes event: user:alice:offline          │
└────┬────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────┐
│         Presence Subscription System                     │
│                                                          │
│  Who can see Alice's presence?                           │
│    - Alice's contacts (bidirectional)                   │
│    - Group members in shared groups                     │
│                                                          │
│  Subscription index:                                     │
│    presence:subscribers:alice → [bob, charlie, diana]   │
│                                                          │
│  On status change:                                       │
│    1. Lookup subscribers                                │
│    2. Send presence update to each subscriber           │
│       { user: "alice", status: "online" }               │
└─────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────┐
│            Presence State Transitions                  │
└───────────────────────────────────────────────────────┘

         Connection              Heartbeat               No heartbeat
         established             every 30s               for 60s
  [Offline] ───────► [Online] ◄──────────┐       ┌───► [Offline]
                          │              │       │
                          │              └───────┘
                          │
                          │ WebSocket closed
                          └────────────────────────────► [Offline]


┌───────────────────────────────────────────────────────┐
│         Advanced Presence States                       │
└───────────────────────────────────────────────────────┘

State: "typing"
  - Triggered: Client sends typing indicator
  - Duration: 5 seconds (ephemeral)
  - Storage: Redis with 5s TTL
  - Example:
      chat:conv-123:typing → ["alice"]
      → Bob sees "Alice is typing..."

State: "last_seen"
  - Triggered: On disconnect
  - Storage: Persistent (Cassandra)
  - Example:
      user:alice:last_seen → "2026-02-14T15:30:00Z"
      → Bob sees "last seen today at 3:30 PM"

State: "away" / "busy"
  - User-controlled status
  - Priority: manual status > automatic detection
  - Example:
      Alice sets status: "In a meeting"
      → Shows even if online


┌───────────────────────────────────────────────────────┐
│         Presence Optimization Techniques               │
└───────────────────────────────────────────────────────┘

Problem: 50M users × presence updates = massive load

Solution 1: Batching
  - Aggregate presence changes over 5-second windows
  - Send single update: { "online": [alice, bob, ...] }
  - Reduces updates by 10×

Solution 2: Smart Subscriptions
  - Only subscribe to active conversations
  - Unsubscribe from inactive contacts (>30 days)
  - Reduces subscriptions by 80%

Solution 3: Presence Zones
  - Group users by geography
  - Separate Redis clusters per region
  - Reduces cross-region traffic

Solution 4: Stale Tolerance
  - Accept 10-second delay in presence updates
  - Cache locally for frequent checks
  - Reduces Redis queries by 50%
```

### 4.4 Offline Message Delivery

#### Visual Diagram: Offline Message Flow

```
┌─────────┐
│ Alice   │ Sends message while Bob is offline
└────┬────┘
     │
     │ 1. Message sent
     ▼
┌──────────────────────────────────────────────┐
│           Chat Service                        │
│  1. Persist to Cassandra ✓                   │
│  2. Publish to Kafka ✓                       │
└────┬──────────────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────────────┐
│         Delivery Service                      │
│                                               │
│  ┌────────────────────────────────────────┐  │
│  │ Lookup Bob's connection:               │  │
│  │   Redis: user:bob:devices → ∅         │  │
│  │   Result: No active connections        │  │
│  └────────────────────────────────────────┘  │
│                                               │
│  ┌────────────────────────────────────────┐  │
│  │ Offline Detection:                     │  │
│  │  1. Check presence: user:bob:presence  │  │
│  │     → Key not found (expired)          │  │
│  │  2. Decision: Bob is offline           │  │
│  └────────────────────────────────────────┘  │
│                                               │
│  ┌────────────────────────────────────────┐  │
│  │ Store for later delivery:              │  │
│  │   pending_msgs:bob → [msg-789]         │  │
│  │   (Redis List)                         │  │
│  └────────────────────────────────────────┘  │
└────┬──────────────────────────────────────────┘
     │
     │ 2. Trigger push notification
     ▼
┌──────────────────────────────────────────────┐
│       Push Notification Service               │
│                                               │
│  ┌────────────────────────────────────────┐  │
│  │ 1. Lookup device tokens:               │  │
│  │    user:bob:devices:push_tokens        │  │
│  │    → iOS: "apns-token-xyz"             │  │
│  │    → Android: "fcm-token-abc"          │  │
│  └────────────────────────────────────────┘  │
│                                               │
│  ┌────────────────────────────────────────┐  │
│  │ 2. Send notifications:                 │  │
│  │                                         │  │
│  │    iOS (APNs):                         │  │
│  │    {                                    │  │
│  │      "aps": {                           │  │
│  │        "alert": "Alice: Hey Bob!",     │  │
│  │        "badge": 1,                     │  │
│  │        "sound": "default"              │  │
│  │      },                                 │  │
│  │      "msg_id": "msg-789"               │  │
│  │    }                                    │  │
│  │                                         │  │
│  │    Android (FCM):                      │  │
│  │    {                                    │  │
│  │      "notification": {                 │  │
│  │        "title": "Alice",               │  │
│  │        "body": "Hey Bob!"              │  │
│  │      },                                 │  │
│  │      "data": {                          │  │
│  │        "msg_id": "msg-789"             │  │
│  │      }                                  │  │
│  │    }                                    │  │
│  └────────────────────────────────────────┘  │
└────┬──────────────────────────────────────────┘
     │
     ├──────────────┬──────────────┐
     │              │              │
     ▼              ▼              ▼
┌─────────┐   ┌──────────┐   ┌─────────┐
│  APNs   │   │   FCM    │   │ (Failed)│
│ (iOS)   │   │(Android) │   │ Device  │
└────┬────┘   └────┬─────┘   └────┬────┘
     │             │              │
     │             │              │ 3. Retry logic
     │             │              │    - Retry 3× (exponential backoff)
     │             │              │    - If failed: mark as "undeliverable"
     │             │              │
     │             │              ▼
     │             │         ┌──────────────┐
     │             │         │ Dead Letter  │
     │             │         │ Queue (DLQ)  │
     │             │         └──────────────┘
     │             │
     │ 4. Push notification arrives
     │             │
     ▼             ▼
┌─────────┐   ┌─────────┐
│  Bob's  │   │  Bob's  │
│ iPhone  │   │ Android │
└────┬────┘   └────┬────┘
     │             │
     │ 5. User taps notification
     │             │
     ▼             ▼
┌─────────────────────────────┐
│     App launches/resumes     │
└────┬────────────────────────┘
     │
     │ 6. Establish WebSocket connection
     ▼
┌──────────────────────────────────────────────┐
│         WebSocket Gateway                     │
│  1. Connection authenticated                 │
│  2. Register in connection registry          │
│  3. Update presence: online                  │
└────┬──────────────────────────────────────────┘
     │
     │ 7. Request pending messages
     ▼
┌──────────────────────────────────────────────┐
│         Delivery Service                      │
│                                               │
│  ┌────────────────────────────────────────┐  │
│  │ Fetch pending messages:                │  │
│  │   pending_msgs:bob → [msg-789, ...]    │  │
│  │   (up to 100 messages)                 │  │
│  └────────────────────────────────────────┘  │
│                                               │
│  ┌────────────────────────────────────────┐  │
│  │ Deliver via WebSocket:                 │  │
│  │   - Send in chronological order        │  │
│  │   - Wait for ACKs                      │  │
│  │   - Remove from pending queue          │  │
│  └────────────────────────────────────────┘  │
└────┬──────────────────────────────────────────┘
     │
     │ 8. Messages delivered
     ▼
┌─────────┐
│   Bob   │ Receives all pending messages
└─────────┘


┌───────────────────────────────────────────────────────┐
│         Pending Message Storage Strategy               │
└───────────────────────────────────────────────────────┘

Redis (Hot Storage - Recent messages):
  pending_msgs:bob → [msg-789, msg-790, ...]
  TTL: 7 days
  Purpose: Fast delivery when user comes online

Cassandra (Cold Storage - Historical):
  All messages persisted permanently
  Query on connection: "SELECT * WHERE recipient='bob'
                        AND delivered=false
                        ORDER BY timestamp"
  Purpose: Fallback if Redis evicts data

Hybrid Approach:
  1. Store in Redis for 7 days (fast)
  2. Mark as "pending" in Cassandra (durable)
  3. On delivery: clear from Redis, update Cassandra
  4. If Redis miss: fallback to Cassandra query
```

### 4.5 Message Storage Schema (Cassandra)

```sql
-- Messages table (main storage)
CREATE TABLE messages (
    conversation_id UUID,
    message_id TIMEUUID,          -- Time-ordered UUID (v1)
    sender_id UUID,
    content TEXT,
    media_url TEXT,               -- S3 URL if media message
    created_at TIMESTAMP,
    edited_at TIMESTAMP,
    deleted_at TIMESTAMP,         -- Soft delete
    encryption_key_id TEXT,       -- E2EE key reference
    PRIMARY KEY (conversation_id, message_id)
) WITH CLUSTERING ORDER BY (message_id ASC);

-- Delivery receipts
CREATE TABLE delivery_status (
    message_id TIMEUUID,
    recipient_id UUID,
    status TEXT,                  -- sent, delivered, read
    timestamp TIMESTAMP,
    PRIMARY KEY (message_id, recipient_id)
);

-- Conversations (metadata)
CREATE TABLE conversations (
    conversation_id UUID,
    type TEXT,                    -- 1-to-1, group, channel
    participant_ids SET<UUID>,    -- For 1-to-1, exactly 2 members
    created_at TIMESTAMP,
    last_message_id TIMEUUID,
    last_message_timestamp TIMESTAMP,
    PRIMARY KEY (conversation_id)
);

-- User's conversation index (for inbox)
CREATE TABLE user_conversations (
    user_id UUID,
    conversation_id UUID,
    unread_count INT,
    last_read_message_id TIMEUUID,
    muted BOOLEAN,
    pinned BOOLEAN,
    PRIMARY KEY (user_id, conversation_id)
) WITH CLUSTERING ORDER BY (conversation_id DESC);

-- Query patterns:
-- 1. Fetch conversation messages:
SELECT * FROM messages
WHERE conversation_id = ?
ORDER BY message_id DESC
LIMIT 50;

-- 2. Fetch user's conversations:
SELECT * FROM user_conversations
WHERE user_id = ?
ORDER BY conversation_id DESC;

-- 3. Check delivery status:
SELECT * FROM delivery_status
WHERE message_id = ?;
```

### 4.6 Decision Trees

#### Decision Tree: WebSocket vs Polling

```
┌─────────────────────────────────────────┐
│   Choose Communication Protocol         │
└────────────────┬────────────────────────┘
                 │
                 ▼
         ┌───────────────────┐
         │ Real-time latency │
         │   requirement?    │
         └────┬──────────┬───┘
              │          │
         < 1s │          │ > 5s
              │          │
              ▼          ▼
      ┌──────────┐  ┌──────────────┐
      │ Bidirect-│  │ Server-push  │
      │ ional?   │  │   needed?    │
      └─┬────┬───┘  └──┬───────┬───┘
        │    │         │       │
      Yes   No       Yes      No
        │    │         │       │
        ▼    ▼         ▼       ▼
   ┌─────────────┐  ┌─────┐  ┌─────────┐
   │ WebSocket   │  │ SSE │  │ Long    │
   │             │  │     │  │ Polling │
   │ Use when:   │  │Use  │  │         │
   │ - Chat      │  │when:│  │Use when:│
   │ - Gaming    │  │-Feed│  │- Simple │
   │ - Collab    │  │-Noti│  │- No WS  │
   │   editing   │  │ fic │  │  support│
   └─────────────┘  └─────┘  └─────────┘

Metrics comparison:

| Protocol      | Latency | Overhead | Server Load | Browser Support |
|---------------|---------|----------|-------------|-----------------|
| WebSocket     | 10-50ms | Low      | Medium      | 98%             |
| SSE           | 50-200ms| Medium   | Medium      | 95% (no IE)     |
| Long Polling  | 200-500ms| High    | High        | 100%            |
| Short Polling | 1-10s   | Very High| Very High   | 100%            |

Decision: WebSocket for chat (real-time + bidirectional)
```

#### Decision Tree: Message Persistence Strategy

```
┌─────────────────────────────────────────┐
│   Choose Message Storage Strategy       │
└────────────────┬────────────────────────┘
                 │
                 ▼
         ┌───────────────────┐
         │ Message volume?   │
         └────┬──────────┬───┘
              │          │
         < 1M/day   > 100M/day
              │          │
              ▼          ▼
      ┌──────────────┐  ┌──────────────┐
      │ SQL Database │  │ NoSQL needed │
      │ (Postgres)   │  │              │
      │              │  └──┬───────────┘
      │ - Transactions│     │
      │ - Relations   │     ▼
      │ - < 10K msg/s │  ┌──────────────────┐
      └──────────────┘  │ Access pattern?   │
                        └──┬──────────┬─────┘
                           │          │
                    Time-series   Complex queries
                           │          │
                           ▼          ▼
                    ┌──────────┐  ┌──────────┐
                    │Cassandra │  │MongoDB   │
                    │          │  │          │
                    │Use when: │  │Use when: │
                    │- Append  │  │- Search  │
                    │  heavy   │  │- Index   │
                    │- Time    │  │  many    │
                    │  ordered │  │  fields  │
                    │- 100K+   │  │- < 50K   │
                    │  writes/s│  │  writes/s│
                    └──────────┘  └──────────┘

For Chat System: Cassandra
  ✓ Write-heavy (23K msg/s, peak 115K)
  ✓ Time-ordered queries
  ✓ Partition by conversation
  ✓ Horizontal scaling
  ✓ Multi-datacenter replication
```

### 4.7 Production Architecture

#### Visual Diagram: Global Production Deployment

```
┌─────────────────────────────────────────────────────────────┐
│                    GLOBAL ARCHITECTURE                       │
└─────────────────────────────────────────────────────────────┘

                          ┌─────────────┐
                          │   Route 53  │
                          │  (GeoDNS)   │
                          └──────┬──────┘
                                 │
                 ┌───────────────┼───────────────┐
                 │               │               │
        US-EAST  │      EU-WEST  │      AP-SOUTH │
                 ▼               ▼               ▼

┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐
│   US-EAST-1 (N.Virginia)  EU-WEST-1 (Ireland) │ │  AP-SOUTH-1 (Mumbai) │
│                      │ │                      │ │                      │
│  ┌────────────────┐ │ │ ┌────────────────┐  │ │ ┌────────────────┐  │
│  │ CloudFront CDN │ │ │ │ CloudFront CDN │  │ │ │ CloudFront CDN │  │
│  │ (Media cache)  │ │ │ │ (Media cache)  │  │ │ │ (Media cache)  │  │
│  └────────────────┘ │ │ └────────────────┘  │ │ └────────────────┘  │
│                      │ │                      │ │                      │
│  ┌────────────────┐ │ │ ┌────────────────┐  │ │ ┌────────────────┐  │
│  │   ALB (L7)     │ │ │ │   ALB (L7)     │  │ │ │   ALB (L7)     │  │
│  │   HTTP/HTTPS   │ │ │ │   HTTP/HTTPS   │  │ │ │   HTTP/HTTPS   │  │
│  └────────────────┘ │ │ └────────────────┘  │ │ └────────────────┘  │
│                      │ │                      │ │                      │
│  ┌────────────────┐ │ │ ┌────────────────┐  │ │ ┌────────────────┐  │
│  │  NLB (L4)      │ │ │ │  NLB (L4)      │  │ │ │  NLB (L4)      │  │
│  │  WebSocket     │ │ │ │  WebSocket     │  │ │ │  WebSocket     │  │
│  └───────┬────────┘ │ │ └───────┬────────┘  │ │ └───────┬────────┘  │
│          │           │ │         │            │ │         │            │
│          ▼           │ │         ▼            │ │         ▼            │
│  ┌────────────────┐ │ │ ┌────────────────┐  │ │ ┌────────────────┐  │
│  │ WS Gateway     │ │ │ │ WS Gateway     │  │ │ │ WS Gateway     │  │
│  │ Auto-scaling   │ │ │ │ Auto-scaling   │  │ │ │ Auto-scaling   │  │
│  │ 100-500 nodes  │ │ │ │ 50-200 nodes   │  │ │ │ 50-200 nodes   │  │
│  └───────┬────────┘ │ │ └───────┬────────┘  │ │ └───────┬────────┘  │
│          │           │ │         │            │ │         │            │
│          ▼           │ │         ▼            │ │         ▼            │
│  ┌────────────────┐ │ │ ┌────────────────┐  │ │ ┌────────────────┐  │
│  │ Redis Cluster  │ │ │ │ Redis Cluster  │  │ │ │ Redis Cluster  │  │
│  │ (Connection    │ │ │ │ (Connection    │  │ │ │ (Connection    │  │
│  │  Registry)     │ │ │ │  Registry)     │  │ │ │  Registry)     │  │
│  │ 3 masters      │ │ │ │ 3 masters      │  │ │ │ 3 masters      │  │
│  │ 3 replicas     │ │ │ │ 3 replicas     │  │ │ │ 3 replicas     │  │
│  └────────────────┘ │ │ └────────────────┘  │ │ └────────────────┘  │
│                      │ │                      │ │                      │
│  ┌────────────────┐ │ │ ┌────────────────┐  │ │ ┌────────────────┐  │
│  │ Chat Service   │ │ │ │ Chat Service   │  │ │ │ Chat Service   │  │
│  │ (Stateless)    │ │ │ │ (Stateless)    │  │ │ │ (Stateless)    │  │
│  │ Auto-scaling   │ │ │ │ Auto-scaling   │  │ │ │ Auto-scaling   │  │
│  │ 20-100 nodes   │ │ │ │ 10-50 nodes    │  │ │ │ 10-50 nodes    │  │
│  └───────┬────────┘ │ │ └───────┬────────┘  │ │ └───────┬────────┘  │
│          │           │ │         │            │ │         │            │
│          ▼           │ │         ▼            │ │         ▼            │
│  ┌────────────────┐ │ │ ┌────────────────┐  │ │ ┌────────────────┐  │
│  │ Kafka Cluster  │ │ │ │ Kafka Cluster  │  │ │ │ Kafka Cluster  │  │
│  │ 10 brokers     │ │ │ │ 5 brokers      │  │ │ │ 5 brokers      │  │
│  │ RF=3           │ │ │ │ RF=3           │  │ │ │ RF=3           │  │
│  └────────────────┘ │ │ └────────────────┘  │ │ └────────────────┘  │
│          │           │ │         │            │ │         │            │
│          ▼           │ │         ▼            │ │         ▼            │
│  ┌────────────────┐ │ │ ┌────────────────┐  │ │ ┌────────────────┐  │
│  │ Delivery Svc   │ │ │ │ Delivery Svc   │  │ │ │ Delivery Svc   │  │
│  │ (Consumers)    │ │ │ │ (Consumers)    │  │ │ │ (Consumers)    │  │
│  │ 50-200 nodes   │ │ │ │ 20-100 nodes   │  │ │ │ 20-100 nodes   │  │
│  └────────────────┘ │ │ └────────────────┘  │ │ └────────────────┘  │
└──────────┬───────────┘ └──────────┬──────────┘ └──────────┬──────────┘
           │                        │                        │
           └────────────────────────┼────────────────────────┘
                                    │
                     ┌──────────────▼──────────────┐
                     │  GLOBAL SHARED SERVICES     │
                     └─────────────────────────────┘

                     ┌────────────────────────────┐
                     │ Cassandra Global Cluster   │
                     │ (Multi-DC Replication)     │
                     │                            │
                     │ US-EAST:   12 nodes (RF=3) │
                     │ EU-WEST:   8 nodes  (RF=3) │
                     │ AP-SOUTH:  8 nodes  (RF=3) │
                     │                            │
                     │ Total: 28 nodes            │
                     └────────────────────────────┘

                     ┌────────────────────────────┐
                     │ S3 + CloudFront (Media)    │
                     │                            │
                     │ Primary: us-east-1         │
                     │ Replicas: eu-west-1,       │
                     │           ap-south-1       │
                     │                            │
                     │ Cross-region replication   │
                     └────────────────────────────┘

                     ┌────────────────────────────┐
                     │ ElasticSearch (Search)     │
                     │                            │
                     │ 3 regional clusters        │
                     │ 5 nodes each               │
                     └────────────────────────────┘

                     ┌────────────────────────────┐
                     │ Push Notification Services │
                     │                            │
                     │ APNs: Regional endpoints   │
                     │ FCM: Regional endpoints    │
                     └────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    MONITORING & OBSERVABILITY                │
└─────────────────────────────────────────────────────────────┘

    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │  Prometheus  │  │   Grafana    │  │  DataDog     │
    │  (Metrics)   │  │ (Dashboard)  │  │   (APM)      │
    └──────────────┘  └──────────────┘  └──────────────┘

    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │     ELK      │  │  PagerDuty   │  │   Sentry     │
    │    (Logs)    │  │   (Alerts)   │  │   (Errors)   │
    └──────────────┘  └──────────────┘  └──────────────┘
```

#### Connection Server Architecture (Detailed)

```
┌─────────────────────────────────────────────────────────────┐
│              WEBSOCKET GATEWAY SERVER                        │
│                  (Single Node Detail)                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Hardware: c6i.4xlarge (16 vCPU, 32GB RAM)                  │
│  OS: Amazon Linux 2 (kernel tuned for high connections)     │
└─────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────┐
│  Process Architecture                 │
│                                       │
│  ┌─────────────────────────────────┐ │
│  │   Main Process (Node.js)        │ │
│  │   - Event loop (libuv)          │ │
│  │   - Non-blocking I/O            │ │
│  │   - V8 JavaScript engine        │ │
│  └─────────────────────────────────┘ │
│                                       │
│  Worker Threads (16×):                │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐│
│  │Thread│ │Thread│ │Thread│ │Thread││
│  │  1   │ │  2   │ │  3   │ │ ...  ││
│  └──────┘ └──────┘ └──────┘ └──────┘│
│   │         │        │        │      │
│   └─────────┴────────┴────────┘      │
│             │                         │
│   Each manages ~4,000 connections    │
│   Total: 65,000 connections/server   │
└───────────────────────────────────────┘

┌───────────────────────────────────────┐
│  Connection State (In-Memory)         │
│                                       │
│  connections: Map<conn_id, {          │
│    socket: WebSocket,                 │
│    user_id: string,                   │
│    device_id: string,                 │
│    last_heartbeat: timestamp,         │
│    send_buffer: Queue<Message>        │
│  }>                                   │
│                                       │
│  Memory per connection: ~4KB          │
│  Total memory: 65K × 4KB = 260MB     │
└───────────────────────────────────────┘

┌───────────────────────────────────────┐
│  Kernel Tuning (sysctl)               │
│                                       │
│  net.core.somaxconn = 65535           │
│  net.ipv4.ip_local_port_range =       │
│    1024 65535                         │
│  net.ipv4.tcp_tw_reuse = 1            │
│  net.ipv4.tcp_fin_timeout = 15        │
│  fs.file-max = 1000000                │
│  nofile limit: 1000000 (ulimit -n)   │
└───────────────────────────────────────┘

┌───────────────────────────────────────┐
│  Message Routing (Inter-Server)       │
│                                       │
│  RPC Framework: gRPC                  │
│                                       │
│  When message arrives:                │
│  1. Check local connections map       │
│  2. If found: deliver immediately     │
│  3. If not: query Redis for server    │
│  4. gRPC call to target server        │
│  5. Target server delivers via WS     │
└───────────────────────────────────────┘

┌───────────────────────────────────────┐
│  Health Checks                        │
│                                       │
│  Load Balancer health endpoint:       │
│    GET /health                        │
│    Returns 200 if:                    │
│      - CPU < 80%                      │
│      - Memory < 90%                   │
│      - Redis reachable               │
│      - Active connections < 65K       │
│                                       │
│  Graceful shutdown (SIGTERM):         │
│    1. Stop accepting new connections  │
│    2. Wait for existing to drain      │
│    3. Timeout: 30 seconds             │
│    4. Force close remaining           │
└───────────────────────────────────────┘
```

### 4.8 Monitoring Dashboard

#### Visual Diagram: Grafana Dashboard Layout

```
┌─────────────────────────────────────────────────────────────┐
│               CHAT SYSTEM MONITORING DASHBOARD               │
│                     [Last 1h] [Refresh: 30s]                │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────── CONNECTION METRICS ────────────────┐
│                                                             │
│  ┌─────────────────────┐  ┌─────────────────────┐         │
│  │ Active Connections  │  │  New Connections/s  │         │
│  │                     │  │                     │         │
│  │    24.8M            │  │       1,234         │         │
│  │    ████████▌        │  │    ▂▃▅▇▆▅▃▂        │         │
│  │    98% of capacity  │  │    (real-time)      │         │
│  └─────────────────────┘  └─────────────────────┘         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Connections by Region                              │  │
│  │                                                      │  │
│  │  US-EAST:    █████████████████ 12.5M (50%)         │  │
│  │  EU-WEST:    █████████ 6.2M (25%)                   │  │
│  │  AP-SOUTH:   ██████ 4.1M (17%)                      │  │
│  │  OTHER:      ███ 2.0M (8%)                          │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Connection Churn (Connects + Disconnects)         │  │
│  │  3000│        ╱╲                                     │  │
│  │  2000│    ╱╲ ╱  ╲  ╱╲                               │  │
│  │  1000│╱╲╱  ╲    ╲╱  ╲╱╲                             │  │
│  │     0└────────────────────────────                  │  │
│  │       10:00  10:15  10:30  10:45  11:00            │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────── MESSAGE METRICS ──────────────────┐
│                                                             │
│  ┌─────────────────────┐  ┌─────────────────────┐         │
│  │ Messages/sec        │  │  Message Latency    │         │
│  │                     │  │                     │         │
│  │    23,456           │  │       45ms          │         │
│  │    ▃▅▇▆▅▃▂         │  │    P50: 38ms        │         │
│  │    (avg: 23K)       │  │    P95: 89ms        │         │
│  │                     │  │    P99: 156ms       │         │
│  └─────────────────────┘  └─────────────────────┘         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Message Flow (End-to-End)                          │  │
│  │                                                      │  │
│  │  Sent:       ██████████ 23,456/s  (100%)           │  │
│  │  Queued:     ██████████ 23,450/s  (99.97%)         │  │
│  │  Delivered:  ██████████ 22,890/s  (97.6%)          │  │
│  │  Failed:     ▌ 566/s (2.4%)                         │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Delivery Success Rate (SLA: 99.9%)                │  │
│  │ 100%│████████████████████████████████████          │  │
│  │  99%│                                               │  │
│  │  98%│                                               │  │
│  │  97%│                                               │  │
│  │     └────────────────────────────────               │  │
│  │      Last 24h: 99.95% ✓                            │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────── PRESENCE METRICS ─────────────────┐
│                                                             │
│  ┌─────────────────────┐  ┌─────────────────────┐         │
│  │ Presence Updates/s  │  │  Presence Accuracy  │         │
│  │                     │  │                     │         │
│  │    15,234           │  │     99.2%           │         │
│  │    (batched)        │  │    (within 10s)     │         │
│  └─────────────────────┘  └─────────────────────┘         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Presence States Distribution                        │  │
│  │                                                      │  │
│  │  Online:   ████████████████ 24.8M (99.2%)          │  │
│  │  Away:     ▌ 150K (0.6%)                            │  │
│  │  Busy:     ▌ 50K (0.2%)                             │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────── SYSTEM HEALTH ────────────────────┐
│                                                             │
│  ┌─────────────────────┐  ┌─────────────────────┐         │
│  │ Cassandra Writes/s  │  │  Kafka Lag          │         │
│  │                     │  │                     │         │
│  │    23,500           │  │       125           │         │
│  │    Latency: 8ms     │  │    messages         │         │
│  │    P99: 45ms        │  │    (< 1s lag)       │         │
│  └─────────────────────┘  └─────────────────────┘         │
│                                                             │
│  ┌─────────────────────┐  ┌─────────────────────┐         │
│  │ Redis Operations/s  │  │  Server CPU Usage   │         │
│  │                     │  │                     │         │
│  │    450K             │  │       64%           │         │
│  │    Hit rate: 99.8%  │  │    ████████▌        │         │
│  │    Latency: 0.5ms   │  │    (healthy)        │         │
│  └─────────────────────┘  └─────────────────────┘         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Error Rate (SLA: < 0.1%)                           │  │
│  │                                                      │  │
│  │  0.05% │    ▂                                       │  │
│  │  0.03% │  ▃   ▂▃                                    │  │
│  │  0.01% │▁  ▁▁    ▁▁▁                                │  │
│  │      0%└────────────────────────────────            │  │
│  │         [Current: 0.024% ✓]                         │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────── PUSH NOTIFICATIONS ────────────────┐
│                                                             │
│  ┌─────────────────────┐  ┌─────────────────────┐         │
│  │ Push Sent/s         │  │  Push Delivery Rate │         │
│  │                     │  │                     │         │
│  │    3,456            │  │       98.7%         │         │
│  │    APNs: 1,800      │  │    APNs: 99.2%      │         │
│  │    FCM: 1,656       │  │    FCM: 98.1%       │         │
│  └─────────────────────┘  └─────────────────────┘         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────── RECENT ALERTS ─────────────────────┐
│                                                             │
│  ⚠️  Warning: Kafka lag increasing (partition 7)           │
│      Time: 10:45 AM   Action: Scaled consumers +2         │
│                                                             │
│  ✓  Resolved: High CPU on ws-gateway-45                    │
│      Time: 10:30 AM   Duration: 5 minutes                 │
└─────────────────────────────────────────────────────────────┘
```

#### Key Metrics to Monitor

```
Connection Metrics:
  - active_connections (gauge)
  - connection_rate (counter, rate 1m)
  - connection_errors (counter)
  - connection_duration (histogram)

Message Metrics:
  - messages_sent (counter)
  - messages_delivered (counter)
  - messages_failed (counter)
  - message_latency (histogram)
    - ws_to_chat_service
    - chat_to_storage
    - storage_to_delivery
    - delivery_to_recipient
  - message_size (histogram)

Presence Metrics:
  - presence_updates (counter)
  - presence_lag (histogram)
  - heartbeat_timeouts (counter)

System Metrics:
  - cpu_usage (gauge, per server)
  - memory_usage (gauge, per server)
  - disk_io (counter)
  - network_io (counter)

Database Metrics:
  - cassandra_write_latency (histogram)
  - cassandra_read_latency (histogram)
  - cassandra_errors (counter)
  - redis_operations (counter)
  - redis_memory_usage (gauge)

Queue Metrics:
  - kafka_produce_rate (counter)
  - kafka_consume_rate (counter)
  - kafka_lag (gauge)
  - kafka_errors (counter)

Push Notification Metrics:
  - push_sent (counter, by platform)
  - push_delivered (counter, by platform)
  - push_failed (counter, by platform)
  - push_latency (histogram)

Alerts (PagerDuty):
  Critical:
    - active_connections > 90% capacity
    - message_latency P99 > 500ms
    - delivery_rate < 99%
    - error_rate > 0.1%
    - cassandra_down (any node)

  Warning:
    - kafka_lag > 1000 messages
    - cpu_usage > 80%
    - memory_usage > 85%
    - push_failure_rate > 2%
```

---

## Step 5: Troubleshooting Guide

### 5.1 Connection Drops

#### Problem: Users experiencing frequent disconnections

```
Symptoms:
  - "Connection lost" errors in client logs
  - connection_errors metric spiking
  - Users reporting "offline" status incorrectly

Debugging Steps:

1. Check Load Balancer Health
   - View NLB target health in AWS Console
   - Unhealthy targets? → Investigate specific WS gateway servers

   $ aws elbv2 describe-target-health \
     --target-group-arn arn:aws:elasticloadbalancing:...

2. Check WebSocket Gateway Server Logs
   - SSH to affected server
   - Check application logs:

   $ tail -f /var/log/chat/ws-gateway.log | grep ERROR

   Common errors:
     - "Too many open files" → ulimit issue
     - "ENOMEM" → Out of memory
     - "ECONNRESET" → Client forcefully closed

3. Check Network Issues
   - Packet loss between client and server?

   $ netstat -s | grep -i retrans
   $ sar -n DEV 1 10  # Network stats

   - High retransmissions? → Network congestion

4. Check Redis Connection Registry
   - Is connection state stale?

   $ redis-cli
   > GET user:alice:devices
   > TTL user:alice:presence

   - Presence expired but user still connected? → Heartbeat failing

5. Check Client-Side Issues
   - Client logs: Is heartbeat being sent?
   - Network change? (WiFi → cellular)
   - App backgrounded? (iOS kills WebSockets after 30s)

Common Root Causes & Fixes:

Issue: Load balancer idle timeout
  Symptom: Drops after exactly 60 seconds
  Fix: Increase NLB idle timeout to 350s (default AWS is 350s, but check config)

Issue: Kernel connection limit reached
  Symptom: "Cannot assign requested address"
  Fix: Tune kernel parameters:
    sysctl -w net.ipv4.ip_local_port_range="1024 65535"
    sysctl -w net.ipv4.tcp_tw_reuse=1

Issue: Server memory exhaustion
  Symptom: OOM killer terminating process
  Fix:
    - Check memory per connection (should be ~4KB)
    - Reduce max connections per server
    - Add more servers to fleet

Issue: Client heartbeat not reaching server
  Symptom: Presence expires but client thinks connected
  Fix:
    - Check firewall rules (allow outbound WebSocket)
    - Increase heartbeat frequency (30s → 20s)
    - Add retry logic for heartbeat ACKs

Issue: Cascading failure during deploy
  Symptom: Mass disconnections during rolling update
  Fix:
    - Graceful shutdown (send "server_restart" frame to clients)
    - Clients pre-emptively reconnect to healthy servers
    - Slow rollout (5% → 25% → 100%)
```

### 5.2 Message Loss

#### Problem: Messages not delivered to recipients

```
Symptoms:
  - User reports "message not received"
  - messages_delivered < messages_sent (gap > 1%)
  - Delivery receipts stuck at "sent" status

Debugging Steps:

1. Trace Message Flow
   - Find message_id in logs:

   $ grep "msg-abc123" /var/log/chat/*.log

   Expected flow:
     [WS-Gateway] Received message from sender
     [Chat-Service] Validated and persisted to Cassandra
     [Chat-Service] Published to Kafka
     [Delivery-Service] Consumed from Kafka
     [Delivery-Service] Looked up recipient connection
     [WS-Gateway] Delivered to recipient WebSocket

   Where did it stop?

2. Check Kafka Queue
   - Is message stuck in queue?

   $ kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
     --describe --group delivery-consumers

   Output:
     TOPIC           PARTITION  LAG
     message-delivery    0      5432  ← High lag!
     message-delivery    1      12

   - High lag? → Consumers falling behind

3. Check Cassandra Write
   - Did message persist?

   $ cqlsh
   > SELECT * FROM messages
     WHERE conversation_id = <conv_id>
     AND message_id = <msg_id>;

   - Not found? → Write failed (check Chat Service logs)
   - Found? → Proceed to delivery stage

4. Check Recipient Connection
   - Is recipient actually online?

   $ redis-cli
   > HGET user:bob:devices "device_1"
   → "ws-server-12:conn-xyz789"

   > GET conn:xyz789:metadata
   → Validate this connection is active

   - Connection exists? → Check Delivery Service routing
   - No connection? → Should trigger push notification

5. Check Push Notification (if offline)
   - Was push sent?

   $ grep "user:bob" /var/log/chat/push-service.log

   - Push sent to APNs/FCM?
   - Did it succeed? (check response codes)

Common Root Causes & Fixes:

Issue: Kafka consumer lag
  Symptom: Messages delayed 10+ seconds
  Fix:
    - Scale up consumer instances
    - Increase consumer throughput (batch processing)
    - Check for slow consumers (profiling)

Issue: Delivery Service can't route to WS server
  Symptom: "Connection not found" in logs, but user is online
  Fix:
    - Redis connection registry out of sync
    - Implement heartbeat-based reconciliation
    - On routing failure, query Redis again (cache miss)

Issue: WebSocket send buffer full
  Symptom: Server logs "send buffer full", message dropped
  Fix:
    - Increase send buffer size: socket.setNoDelay(true)
    - Implement backpressure: pause Kafka consumer
    - Rate limit per-connection: max 100 msg/s

Issue: Cassandra write timeout
  Symptom: "WriteTimeout" in Chat Service logs
  Fix:
    - Check Cassandra cluster health (nodes down?)
    - Reduce write consistency level (QUORUM → ONE)
    - Increase write timeout (default 2s → 5s)

Issue: Message expired before delivery
  Symptom: Recipient offline >7 days, message in pending queue expired
  Fix:
    - Increase pending message TTL (7d → 30d)
    - Move to Cassandra for long-term pending storage
    - Implement "message missed" notification

Issue: Duplicate message delivery
  Symptom: User receives same message twice
  Root cause: Kafka consumer reprocessed message (failure + retry)
  Fix:
    - Implement idempotency: track delivered message IDs
    - Client deduplication: ignore msg_id already seen
    - Use exactly-once Kafka semantics (if possible)
```

### 5.3 Message Ordering Violations

#### Problem: Messages appear out of order in conversation

```
Symptoms:
  - "User B's reply appears before User A's question"
  - Timestamp T2 > T1, but displayed as T2, T1
  - Client reports "messages out of order"

Debugging Steps:

1. Check Message Timestamps
   - Fetch messages from Cassandra:

   $ cqlsh
   > SELECT message_id, sender_id, created_at, content
     FROM messages
     WHERE conversation_id = <conv_id>
     ORDER BY message_id ASC
     LIMIT 50;

   - Are message_id (TIMEUUID) and created_at in sync?
   - If mismatched → clock skew between servers

2. Check Client Display Logic
   - Is client sorting by message_id or created_at?
   - Should sort by message_id (server-assigned, monotonic)

   Client code (pseudocode):
     messages.sort((a, b) => a.message_id.compare(b.message_id))

3. Check Network Race Condition
   - Did messages arrive out of order due to routing?

   Example:
     Alice's message → ws-server-5 → chat-service-A → Cassandra
     Bob's reply → ws-server-12 → chat-service-B → Cassandra

   If chat-service-B writes before chat-service-A:
     - Bob's message gets earlier message_id
     - Appears before Alice's message (wrong!)

4. Check Clock Skew
   - Measure time difference between servers:

   $ for server in ws-server-{1..20}; do
       ssh $server 'date +%s%N'
     done | sort -n

   - Difference > 100ms? → NTP sync issue

Common Root Causes & Fixes:

Issue: TIMEUUID clock skew
  Symptom: message_id ordering doesn't match causality
  Fix:
    - Use NTP to sync server clocks (< 10ms drift)
    - Use centralized ID generation service (Twitter Snowflake)
    - Include sequence number: msg_id = timestamp + seq + server_id

Issue: Cassandra write latency variance
  Symptom: Message A sent first, but written to Cassandra last
  Fix:
    - Use lightweight transactions (IF NOT EXISTS) for ordering
    - Client-side sequence numbers per conversation
    - Optimistic locking with version field

Issue: Client-side race condition
  Symptom: WebSocket delivers messages out of order
  Fix:
    - Server maintains per-conversation sequence
    - Client buffers out-of-order messages
    - Client requests missing messages (gap detection)

  Example:
    Server sends: seq 1, 2, 3, 5 (4 missing)
    Client detects gap → requests seq 4
    Client buffers seq 5 until 4 arrives

Issue: Group chat fan-out ordering
  Symptom: Different group members see different order
  Root cause: Fan-out happens in parallel, recipients receive at different times
  Fix:
    - Assign global sequence number before fan-out
    - All recipients sort by same sequence
    - Trade-off: Slight delay to assign sequence

Ordering Guarantee Implementation:

Approach 1: Per-conversation sequence (simple)
  - Chat Service maintains: conversation:conv_id:seq → 123
  - Atomic increment on each message
  - Store in message: { seq: 123, ... }
  - Client sorts by seq

Approach 2: Vector clocks (advanced)
  - Each device has logical clock
  - Increment on send: clock[device_id]++
  - Message includes: { vector: {alice:5, bob:3} }
  - Client resolves conflicts using vector clock rules

Approach 3: Operational Transform (real-time collaborative)
  - Used for typing indicators, collaborative editing
  - Transform operations based on concurrent edits
  - Complex but handles true concurrency
```

### 5.4 High Latency

#### Problem: Messages taking >1 second to deliver

```
Symptoms:
  - message_latency P99 > 1000ms
  - Users complain "slow chat"
  - Delivery receipts delayed

Debugging Steps:

1. Break Down Latency by Stage
   - Instrument each stage with timing:

   Client → WS Gateway:        t1
   WS Gateway → Chat Service:  t2
   Chat Service → Cassandra:   t3
   Chat Service → Kafka:       t4
   Kafka → Delivery Service:   t5
   Delivery Service → WS Svr:  t6
   WS Server → Recipient:      t7

   Total latency = t1 + t2 + t3 + t4 + t5 + t6 + t7

   - Which stage is bottleneck?

2. Check Network Latency
   - Measure RTT between services:

   $ ping chat-service.internal
   $ traceroute chat-service.internal

   - High RTT (>50ms) within same region? → Network issue

3. Check Database Latency
   - Cassandra slow queries:

   $ nodetool tablestats keyspace.messages
   → Check "Read Latency" and "Write Latency"

   - P99 > 100ms? → Hot partition or compaction

4. Check Kafka Latency
   - Producer latency:

   $ kafka-run-class kafka.tools.EndToEndLatency \
     --broker-list localhost:9092 \
     --topic message-delivery \
     --num-messages 1000

   - E2E latency > 100ms? → Broker overloaded

5. Check Connection Server Load
   - CPU at 100%? → Event loop blocked

   $ top -H -p <pid>  # Check threads
   $ perf top -p <pid>  # Profiling

   - Identify hot functions (likely WebSocket write)

Common Root Causes & Fixes:

Issue: Cassandra hot partition
  Symptom: Some conversations slow, others fast
  Fix:
    - Identify hot partition: popular group chat
    - Shard large groups across multiple partitions
    - Use composite partition key: (conversation_id, shard_id)

Issue: Redis slow queries
  Symptom: Connection lookup taking >50ms
  Fix:
    - Check Redis memory usage (is it swapping?)
    - Use Redis SCAN instead of KEYS (O(N) → O(1))
    - Add read replicas for lookup queries

Issue: WebSocket send bottleneck
  Symptom: Delivery Service → WS Server fast, but WS → Client slow
  Fix:
    - Client's network slow (cellular)
    - Implement server-side send queue with timeout
    - If send blocks >500ms, mark connection as "slow"
    - Prioritize fast connections

Issue: Geographic distance
  Symptom: Cross-region messages slower than same-region
  Fix:
    - Deploy regionally (EU users → EU servers)
    - Use global routing (Route53 latency-based routing)
    - Replicate data closer to users

Issue: Message queue lag
  Symptom: Kafka lag 10K+ messages
  Fix:
    - Scale consumer group (more partitions + consumers)
    - Batch processing (process 100 msg at once)
    - Increase consumer throughput (parallel delivery)

Performance Optimization Techniques:

1. Connection Pooling
   - Reuse connections to Chat Service (HTTP/2 multiplexing)
   - Avoid creating new connection per message

2. Caching
   - Cache user:device mappings (Redis TTL 60s)
   - Cache conversation metadata (participants, etc.)
   - Reduces Cassandra reads by 80%

3. Batching
   - Batch Cassandra writes (100 messages → 1 batch)
   - Batch presence updates (aggregate 10s window)
   - Trade-off: Slight latency for throughput

4. Async Processing
   - Non-critical tasks (analytics, search indexing) → async queue
   - Don't block message delivery on search indexing

5. Protocol Optimization
   - Use binary WebSocket frames (vs text JSON)
   - Compress payloads (zlib)
   - Reduces bandwidth by 60%
```

---

## Step 6: Real-World Examples

### 6.1 WhatsApp Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    WHATSAPP ARCHITECTURE                     │
│            (2B users, 100B messages/day)                    │
└─────────────────────────────────────────────────────────────┘

Technology Stack:
  - Language: Erlang (for concurrency, fault tolerance)
  - Database: Custom sharded MySQL + Cassandra
  - Cache: Redis
  - Queue: Custom high-performance queue
  - Protocol: XMPP-based custom protocol
  - Media: Facebook CDN

Key Design Decisions:

1. Erlang for Connection Servers
   - Reason: Lightweight processes (1-2KB per connection)
   - Single server handles 2-3 million connections
   - OTP framework for fault tolerance (supervisor trees)
   - Hot code reloading (deploy without downtime)

2. End-to-End Encryption (E2EE)
   - Protocol: Signal Protocol (Double Ratchet)
   - Server never sees plaintext
   - Forward secrecy: New key per message
   - Implementation:

     Alice                  Server               Bob
       │                      │                   │
       │ 1. Fetch Bob's      │                   │
       │    prekey bundle    │                   │
       ├──────────────────────►                  │
       │◄─────────────────────┤                  │
       │                      │                   │
       │ 2. Derive shared secret (ECDH)          │
       │    encrypt("Hello", shared_key)         │
       │                      │                   │
       │ 3. Send ciphertext  │                   │
       ├──────────────────────►──────────────────►
       │                      │ 4. Forward       │
       │                      │    ciphertext    │
       │                      │                   │
       │                      │ 5. Bob decrypts  │
       │                      │    with shared   │
       │                      │    secret        │

3. Media Handling
   - Upload flow:
     Client → WhatsApp edge server → Facebook CDN → S3
   - Encryption: Media encrypted client-side before upload
   - Optimization: Progressive JPEG (render while downloading)
   - Compression: Aggressive (trade quality for bandwidth)

4. Message Sync Across Devices
   - Challenge: E2EE prevents server-side decryption
   - Solution: Multi-device protocol
     - Primary device (phone) holds master key
     - Secondary devices (web, desktop) get session keys
     - Messages encrypted separately for each device
   - Sync history:
     - On new device link, primary re-encrypts last 30 days
     - Incremental sync: Only new messages forwarded

5. Group Chat Optimization
   - WhatsApp groups limited to 256 members (originally)
   - Fan-out: Sender encrypts message 256 times (once per member)
   - Sender-side encryption reduces server load
   - Pairwise encryption (no group key)

6. Status / Stories
   - Different architecture from messages
   - Broadcast channel model
   - 24-hour expiration → aggressive deletion
   - Stored separately from messages (different database)

7. Connection Reliability
   - Persistent WebSocket connection
   - On disconnect: Exponential backoff (1s, 2s, 4s, ...)
   - Queue messages locally (SQLite on device)
   - Retry until acknowledged

8. Scalability Numbers
   - 50 data centers globally
   - 10,000+ servers
   - 2M connections per server
   - 100B messages/day (peak: 200K msg/s)
   - Cost per user: ~$0.50/year

Engineering Culture:
  - Small team (50 engineers for 1B users in 2015)
  - Focus on reliability over features
  - Emphasis on code quality and testing
  - Frequent small deploys (multiple times/day)
```

### 6.2 Slack Infrastructure

```
┌─────────────────────────────────────────────────────────────┐
│                     SLACK ARCHITECTURE                       │
│          (20M DAU, 100M+ messages/day)                      │
└─────────────────────────────────────────────────────────────┘

Technology Stack:
  - Backend: PHP (legacy), Java (new services), Go (infrastructure)
  - Database: MySQL (sharded), Vitess (sharding layer)
  - Cache: Redis, Memcached
  - Queue: Kafka
  - Search: Elasticsearch
  - Storage: S3 (media, files)
  - Real-time: WebSockets, Server-Sent Events (SSE)

Key Design Decisions:

1. Workspace Isolation
   - Each workspace (team) is isolated
   - Database sharding by workspace_id
   - Benefits:
     - Security: Workspace A can't see Workspace B data
     - Scalability: Large workspace doesn't affect others
     - Compliance: Per-workspace data residency

   Sharding Strategy:
     workspace_id → hash → shard_id (1 of 256 shards)
     shard_1: workspaces [1, 257, 513, ...]
     shard_2: workspaces [2, 258, 514, ...]

2. Message Storage
   - Short-term: MySQL (recent messages, fast queries)
   - Long-term: S3 (compressed JSON, cold storage)
   - Transition: 90-day cutoff
     - Day 0-90: MySQL (hot storage)
     - Day 90+: S3 (cold storage)
   - Search: All messages indexed in Elasticsearch

   Query strategy:
     - Recent search: Elasticsearch → MySQL
     - Historical search: Elasticsearch → S3
     - Pagination: Cursor-based (message_id)

3. Real-Time Message Delivery
   - WebSocket for active users
   - Server-Sent Events (SSE) as fallback
   - Long polling as last resort (corporate proxies)

   Connection Strategy:
     Client attempts:
       1. WebSocket (wss://)
       2. If fails → SSE (https://slack.com/sse)
       3. If fails → Long polling

   Gateway Routing:
     - 100+ connection servers globally
     - User connects to nearest (latency-based routing)
     - Server maintains workspace subscriptions
     - On message: Route to all users in channel

4. Channel Message Broadcast
   - Challenge: Large channels (10K+ members)
   - Solution: Fan-out on read (not write)

   Write (single):
     Message → Store in MySQL → Index in Elasticsearch

   Read (fan-out):
     User opens channel → Subscribe to channel feed
     New message → Server pushes to subscribed connections

   Optimization: Active subscribers only
     - User viewing channel: Real-time push
     - User not viewing: Store in "unread" queue
     - Reduces fanout by 95%

5. Presence System
   - Three-tier presence:
     - Online: Active in last 30s
     - Away: Idle for 30s - 30m
     - Offline: No activity >30m

   Implementation:
     - Client sends heartbeat every 30s
     - Redis: SET user:123:presence "online" EX 45
     - On expire: Presence service publishes "offline" event
     - Broadcast to workspace members

   Optimization: Batched updates
     - Aggregate presence changes over 10s
     - Single broadcast: 50 users went online
     - Reduces WebSocket traffic by 10×

6. File Uploads
   - Direct upload to S3 (signed URLs)
   - Flow:
     1. Client: "I want to upload file.png"
     2. Server: "Upload to S3 with this signed URL"
     3. Client → S3 (direct upload, no proxy)
     4. Client: "Upload complete: s3://bucket/file.png"
     5. Server: Store metadata, notify channel

   Benefits:
     - Server doesn't handle file bytes (scalability)
     - S3 handles durability and replication
     - CloudFront CDN for downloads

7. Threads (Nested Conversations)
   - Thread = parent message + replies
   - Storage:

     messages table:
       message_id | channel_id | thread_parent | content
       msg-1      | channel-a  | NULL          | "Main message"
       msg-2      | channel-a  | msg-1         | "Reply 1"
       msg-3      | channel-a  | msg-1         | "Reply 2"

   - Query: "SELECT * WHERE thread_parent = msg-1"
   - Unread tracking: Separate counter for threads

8. Integrations & Bots
   - Webhooks: External services → POST to Slack
   - Slash commands: /remind, /poll, etc.
   - Bot framework: Event-driven API

   Example: /giphy search cats
     1. Slack receives /giphy command
     2. Routes to Giphy bot server
     3. Giphy bot queries API, returns GIF URL
     4. Slack posts GIF to channel

   Rate limiting:
     - Per-bot: 100 requests/minute
     - Per-workspace: 1000 requests/minute

9. Elasticsearch for Search
   - All messages indexed in near-real-time
   - Index per workspace (isolation)
   - Replica shards for read scalability

   Query example:
     "from:alice in:#general has:link before:2026-02-01"
     → Elasticsearch query with filters
     → Returns message IDs
     → Fetch full messages from MySQL/S3

10. Reliability Techniques
    - Graceful degradation:
      - If Elasticsearch down → Disable search (not critical)
      - If MySQL slow → Serve from cache
      - If WebSocket fails → Fallback to polling

    - Circuit breakers:
      - After 5 consecutive errors, stop calling service
      - Retry with exponential backoff
      - Prevents cascading failures

    - Load shedding:
      - At 90% capacity, reject non-critical requests
      - Prioritize message delivery over search

Scalability Challenges & Solutions:

Challenge: MySQL write hot spots (popular channels)
  Solution: Sharded by workspace, not channel
            Spread large workspaces across multiple shards

Challenge: Elasticsearch indexing lag during spikes
  Solution: Batch indexing (100 messages → 1 bulk index)
            Separate index cluster per region

Challenge: WebSocket connection storms (all users reconnect)
  Solution: Randomized reconnect backoff (jitter)
            Connection draining during deploys

Cost Optimization:
  - S3 Glacier for historical messages (>1 year old)
  - Compress JSON payloads (gzip)
  - Delete old files (>1 year, free plan)
  - Reduce Elasticsearch retention (6 months)
```

### 6.3 Discord Message Delivery

```
┌─────────────────────────────────────────────────────────────┐
│                    DISCORD ARCHITECTURE                      │
│         (150M MAU, billions of messages/day)                │
└─────────────────────────────────────────────────────────────┘

Technology Stack:
  - Language: Elixir (Erlang VM), Python, Rust, Go
  - Database: Cassandra (messages), ScyllaDB (modern replacement)
  - Cache: Redis (presence, state)
  - Queue: Kafka-like internal system
  - Storage: Google Cloud Storage (GCS)
  - CDN: CloudFlare

Key Design Decisions:

1. Elixir for Distributed Systems
   - Why Elixir?
     - Built on Erlang VM (BEAM): Proven for telecom (99.9999% uptime)
     - Lightweight processes: Millions per server
     - OTP framework: Supervision trees, fault tolerance
     - Hot code swapping: Deploy without disconnecting users

   Architecture:
     - "Gateway" servers: Handle WebSocket connections
     - GenServer processes: One per connected user
     - Message passing: Inter-process communication
     - Fault isolation: One user crash ≠ server crash

2. Data Partitioning by Channel
   - Messages stored by (channel_id, message_id)
   - Benefits:
     - Fetching channel history: Single partition read
     - No cross-partition queries needed
     - Horizontal scaling: More channels = more partitions

   Cassandra Schema:
     CREATE TABLE messages (
       channel_id BIGINT,
       message_id BIGINT,
       author_id BIGINT,
       content TEXT,
       created_at TIMESTAMP,
       PRIMARY KEY (channel_id, message_id)
     ) WITH CLUSTERING ORDER BY (message_id DESC);

3. Snowflake IDs (Twitter Snowflake)
   - 64-bit ID: Timestamp (41b) + Worker (10b) + Sequence (12b)
   - Properties:
     - Time-ordered: Sorting by ID = sorting by time
     - Unique: No collisions across servers
     - Decentralized: No coordination needed

   Example: message_id = 1234567890123456789
     - Timestamp: Extract first 41 bits → creation time
     - Worker ID: Extract next 10 bits → which server generated it
     - Sequence: Extract last 12 bits → order within millisecond

4. Guild (Server) Sharding
   - Discord "guilds" (servers) have channels
   - Large guilds (millions of members): Shard across multiple clusters

   Sharding Strategy:
     - Small guild (<100K members): Single cluster
     - Large guild: Spread channels across clusters
     - Mega guild: Multiple shards per guild

   Example: Guild "Fortnite Official" (5M members)
     - Shard 1: Channels 1-100
     - Shard 2: Channels 101-200
     - Shard 3: Channels 201-300

5. Voice Chat Architecture (Out of Scope for This Doc)
   - Separate infrastructure from text chat
   - WebRTC + custom UDP protocol
   - Voice servers independent of message servers

6. Cassandra → ScyllaDB Migration
   - Why migrate?
     - Cassandra (Java): High GC pauses (100ms+)
     - ScyllaDB (C++): Low latency (1-10ms P99)
     - 10× better performance on same hardware

   Migration Strategy:
     - Dual-write: Write to both Cassandra and Scylla
     - Backfill: Copy historical data offline
     - Read from Scylla: Switch reads once data synced
     - Decommission Cassandra: After validation period

7. Read-After-Write Consistency
   - Problem: User sends message, but doesn't see it immediately
     - Reason: Eventual consistency (Cassandra)

   Solution: Optimistic UI + Confirmation
     1. Client sends message with temp_id
     2. Client displays message immediately (optimistic)
     3. Server assigns real message_id, persists
     4. Server sends confirmation: temp_id → message_id
     5. Client replaces temp message with real message
     6. If confirmation doesn't arrive (5s): Mark as "failed"

8. Lazy Guilds (On-Demand Loading)
   - Problem: User in 100 guilds, each with 50 channels
     - Loading all on connect = 5000 channels = slow

   Solution: Lazy loading
     - On connect: Load only active guild (currently viewing)
     - On switch guild: Load that guild's channels
     - Background: Preload recently used guilds

   Benefits:
     - Connect time: 5s → 500ms
     - Bandwidth: 10 MB → 100 KB
     - Server load: 95% reduction

9. Message Caching Strategy
   - Recent messages (last 50 per channel): Redis
   - Historical messages: Cassandra

   Read path:
     1. Check Redis: GET channel:123:messages
     2. If hit: Return cached messages
     3. If miss: Query Cassandra, populate Redis

   Write path:
     1. Write to Cassandra (durable)
     2. Write to Redis (cache)
     3. Broadcast to WebSockets

   Cache eviction: LRU with TTL (1 hour)

10. Rate Limiting (Anti-Spam)
    - Per-user rate limits:
      - Global: 50 requests/second
      - Per-channel: 5 messages/second
      - Per-guild: 10K messages/hour

    - Bot rate limits:
      - Stricter: 5 requests/second
      - Burst: 10 requests (bucket)

    - Implementation:
      - Token bucket algorithm
      - Distributed: Redis-based counter
      - Graceful: Return 429 with Retry-After header

11. Content Delivery Network (CDN)
    - All media proxied through CDN
    - Flow:
      1. User uploads image → Discord API → GCS
      2. Discord returns CDN URL: cdn.discordapp.com/attachments/...
      3. User downloads image → CloudFlare CDN → GCS

    Benefits:
      - Reduced latency (edge caching)
      - DDoS protection (CloudFlare)
      - Bandwidth savings (cache hit ratio: 80%)

12. Monitoring & Alerting
    - Metrics:
      - Message throughput: 100K msg/s (peak: 1M msg/s)
      - WebSocket connections: 10M concurrent
      - Database latency: P99 < 50ms
      - API error rate: < 0.01%

    - Alerts:
      - Critical: Database down, WebSocket gateway down
      - Warning: Latency spike, error rate increase
      - PagerDuty integration: On-call rotation

Scaling Lessons:

1. "Hot partitions" problem
   - Problem: Popular channel (millions of users) = hot partition
   - Solution: Read replicas + caching (Redis)

2. Connection storms
   - Problem: Deploy → all users reconnect → server overload
   - Solution: Graceful restarts (send close frame with "reconnect later")

3. Thundering herd
   - Problem: Cache expires → 10K requests hit database
   - Solution: Cache warming + probabilistic early expiration

4. Database hotspots
   - Problem: Single Cassandra node overwhelmed
   - Solution: Better partitioning (shard by channel, not guild)
```

---

## Conclusion

### Key Takeaways

1. **WebSocket for Real-Time**: Persistent bidirectional connections with <100ms latency
2. **Message Persistence**: Cassandra for write-heavy workloads with time-series data
3. **Presence Detection**: Redis TTL + heartbeat mechanism for efficient tracking
4. **Offline Delivery**: Message queues + push notifications ensure reliable delivery
5. **Scalability**: Horizontal scaling at every layer (stateless services, sharded databases)
6. **Reliability**: Graceful degradation, circuit breakers, and comprehensive monitoring

### Trade-Offs

| Decision | Benefits | Drawbacks |
|----------|----------|-----------|
| WebSocket vs Polling | Low latency (10ms vs 1s) | Complex connection management |
| Cassandra vs MySQL | High write throughput (100K/s) | Eventual consistency, limited queries |
| Fan-out on write | Guaranteed delivery | High write amplification (N writes/message) |
| End-to-end encryption | User privacy, security | Server can't index/search messages |
| Redis for presence | Fast (sub-ms latency) | Data loss on failure (cache, not durable) |
| Multi-region | Low global latency | Replication lag, complexity |

### Further Reading

- [[04_system_evolutions/scaling_a_chat_system]] — Evolution from 1K to 100M users
- [[02_building_blocks/message_queues]] — Deep dive into Kafka
- [[02_building_blocks/databases_nosql]] — Cassandra internals
- [[01_fundamentals/api_design]] — WebSocket protocol details

---

## Building Blocks Used

| Component | Building Block | Why? |
|-----------|---------------|------|
| Real-time delivery | WebSocket ([[01_fundamentals/api_design]]) | Bidirectional, low-latency communication |
| Connection registry | [[02_building_blocks/caching]] (Redis) | Fast lookup, TTL-based expiration |
| Message storage | [[02_building_blocks/databases_nosql]] (Cassandra) | High write throughput, time-series data |
| Async routing | [[02_building_blocks/message_queues]] (Kafka) | Decouple services, buffer spikes |
| Media storage | [[02_building_blocks/blob_storage]] (S3) | Scalable, durable file storage |
| Media delivery | [[02_building_blocks/cdn]] (CloudFront) | Global edge caching |
| Presence tracking | Redis with TTL | Automatic expiration, fast updates |
| Push notifications | APNs / FCM | Platform-specific offline delivery |
| Search | Elasticsearch | Full-text search across messages |
| Load balancing | L4 (NLB) + L7 (ALB) | Distribute traffic, health checks |

## Links

- [[04_system_evolutions/scaling_a_chat_system]] — Full evolution story
- [[05_case_studies/design_video_streaming]] — Related: Real-time video delivery
- [[05_case_studies/design_notification_system]] — Related: Push notification deep dive
