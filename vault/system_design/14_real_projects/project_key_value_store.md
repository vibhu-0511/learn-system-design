#system-design #project #hands-on #java

# Build It: In-Memory Key-Value Store (Java)

> Build a simplified Redis from scratch. Teaches: hash maps, TTL expiration, LRU eviction, thread safety, network protocol.

---

## What You Build

A TCP server that supports: `GET key`, `SET key value [EX seconds]`, `DEL key`, `TTL key`, `KEYS pattern`

## Architecture

```
Client (telnet/custom) → TCP Server → Command Parser → Storage Engine
                                                        ├── HashMap (data)
                                                        ├── TTL Tracker
                                                        └── LRU Eviction
```

## Core Implementation (Java)

```java
public class KVStore {
    private final int maxSize;
    private final Map<String, Entry> store;
    private final LinkedHashMap<String, Entry> lruOrder; // For eviction

    public KVStore(int maxSize) {
        this.maxSize = maxSize;
        this.store = new ConcurrentHashMap<>();
        this.lruOrder = new LinkedHashMap<>(maxSize, 0.75f, true); // access-order
    }

    public synchronized String get(String key) {
        Entry entry = store.get(key);
        if (entry == null) return "(nil)";
        if (entry.isExpired()) {
            store.remove(key);
            lruOrder.remove(key);
            return "(nil)";
        }
        lruOrder.get(key); // Update access order
        return entry.value;
    }

    public synchronized void set(String key, String value, Integer ttlSeconds) {
        if (store.size() >= maxSize && !store.containsKey(key)) {
            evict();
        }
        Entry entry = new Entry(value, ttlSeconds);
        store.put(key, entry);
        lruOrder.put(key, entry);
    }

    public synchronized boolean delete(String key) {
        lruOrder.remove(key);
        return store.remove(key) != null;
    }

    private void evict() {
        Iterator<Map.Entry<String, Entry>> it = lruOrder.entrySet().iterator();
        if (it.hasNext()) {
            Map.Entry<String, Entry> oldest = it.next();
            store.remove(oldest.getKey());
            it.remove();
        }
    }

    static class Entry {
        String value;
        Instant expiresAt;

        Entry(String value, Integer ttlSeconds) {
            this.value = value;
            this.expiresAt = ttlSeconds != null
                ? Instant.now().plusSeconds(ttlSeconds) : null;
        }

        boolean isExpired() {
            return expiresAt != null && Instant.now().isAfter(expiresAt);
        }
    }
}

// TCP Server
public class KVServer {
    public static void main(String[] args) throws IOException {
        KVStore store = new KVStore(10000);
        ServerSocket server = new ServerSocket(6380);

        ExecutorService pool = Executors.newFixedThreadPool(10);
        while (true) {
            Socket client = server.accept();
            pool.submit(() -> handleClient(client, store));
        }
    }

    static void handleClient(Socket client, KVStore store) {
        try (BufferedReader in = new BufferedReader(new InputStreamReader(client.getInputStream()));
             PrintWriter out = new PrintWriter(client.getOutputStream(), true)) {

            String line;
            while ((line = in.readLine()) != null) {
                String[] parts = line.split(" ");
                String command = parts[0].toUpperCase();

                switch (command) {
                    case "GET" -> out.println(store.get(parts[1]));
                    case "SET" -> {
                        Integer ttl = parts.length > 3 && parts[2].equals("EX")
                            ? Integer.parseInt(parts[3]) : null;
                        store.set(parts[1], parts[2].equals("EX") ? parts[1] : parts[2], ttl);
                        out.println("OK");
                    }
                    case "DEL" -> out.println(store.delete(parts[1]) ? "(integer) 1" : "(integer) 0");
                    default -> out.println("ERR unknown command");
                }
            }
        } catch (IOException e) { /* handle */ }
    }
}
```

## What You Learn

| Concept | How Applied |
|---------|------------|
| Hash map internals | ConcurrentHashMap for thread-safe storage |
| LRU eviction | LinkedHashMap with access-order |
| TTL expiration | Lazy expiry on access |
| TCP networking | ServerSocket + thread pool |
| Thread safety | synchronized + ConcurrentHashMap |
| Command parsing | Simple protocol parser |

## Extensions
1. Add persistence (RDB snapshots — serialize HashMap to disk)
2. Add pub/sub channels
3. Add data types (lists, sets, sorted sets)
4. Add replication (primary-replica with WAL)

## Links
- [[../05_case_studies/design_distributed_cache]] — Full distributed cache design
- [[../05_case_studies/design_key_value_store]] — Distributed KV store
- [[../15_intermediate_topics/redis_deep_dive]] — How Redis actually works
