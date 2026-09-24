# e03: Scaling a Chat System — Stop asking the server for messages and let it tell you

Evolutions · e02 → **e03** → e04

> *"Poll less, push more, and plan for the reconnect"*
>
> **Concern**: scalability · latency

## The Problem

You launch a chat app that asks the server "anything new?" every 2 seconds. It works for 100 beta users. Then you go viral. With 100,000 users online that is 50,000 requests a second, and 93.3% of them come back empty. A message waits about a second to arrive, and you need 25 servers to answer the question "no".

## The Idea

Chat evolves like a postal service. First, customers walk to the mailbox every few minutes (**polling**). Then the postal worker waits at the door until mail arrives (**long polling**). Finally the mail is delivered the moment it comes (**WebSockets**, a connection that stays open and lets the server push).

The vault note takes it further: how to fan a message out to a group, how to detect who is online (heartbeats), how to store and sync messages across devices, and how to keep them end-to-end encrypted. The sim covers the first, largest step and the failure that follows it.

## How It Works

1. **Polling** costs a request per user per interval whether or not anything happened. Delivery takes half the interval on average:

```js
// sim.mjs
  const pollsPerSec = users / pollIntervalSec;
  const polling = outcome({
    requestsPerSec: pollsPerSec,
    wastedPct: Math.max(0, (1 - messagesPerSec / pollsPerSec) * 100),
```

2. **WebSockets** hold one connection per user, and traffic is just the real messages: 3,333 a second, pushed in about 50 ms. The load moves from requests to connections, so each server is sized by how many it can hold (10,000 here, so 10 servers).
3. **Sizing changes shape.** Polling is bounded by request rate, WebSockets by open connections and memory.

Polling more slowly only trades one cost for another. At 5 seconds the wasted share falls to 83.3% but a message now waits 2.5 seconds.

## When It Breaks

Persistent connections have a new failure. A deploy or a load balancer restart drops every connection, and every client reconnects within about a second. The sim's fleet accepts 20,000 new connections a second and 100,000 arrive, so 80% are turned away and retry. That is the retry storm from p10: the retries keep the fleet overloaded, and the fix is backoff with jitter on the client, plus rolling restarts so only a slice drops at once.

## The Trade-off

Group chats raise a design choice. **Fan-out on write** copies each message into every member's inbox, so reads are instant but a message to a group of 50 costs 50 writes: 166,667 storage writes a second at this volume. **Fan-out on read** stores the message once and each member reads it from the shared store, which is cheap to write and slower to read. Chat apps often mix them: copy for small groups, read for large ones.

## In The Wild

The vault note follows WhatsApp and Discord, which both keep one long-lived connection per user and spend their effort on connection density, reconnect handling and message storage rather than on request rates.

## Try It

```sh
node course/2_evolutions/e03_scaling_chat/sim.mjs --pollIntervalSec=5
```

You should see four frames. The polling frame reports `requestsPerSec=20000  wastedPct=83.3  latencyMs=2500`, and the failure frame reports `requestsPerSec=100000  wastedPct=80` for the reconnect storm. Try `--connectionsPerServer=50000` to see fewer servers accept fewer reconnects per second.

## Say It In The Interview

1. Walk the evolution: polling, then long polling, then WebSockets, and say what each fixes.
2. Do the polling math and show why it wastes requests.
3. Bring up presence (heartbeats), message ordering and storage, and offline delivery through a queue.
4. Discuss the reconnect storm and the fan-out choice for groups.

## Boundary

This chapter is the delivery path. Message queues are b05, pub/sub for fan-out is p16, and the full chat design is a case study for later. The retry storm in depth is p10.

## What's Next

Growth eventually hurts the team as much as the servers. When should one codebase become many services? That is e04.

## Source notes

- [Scaling a chat system](../../../vault/system_design/04_system_evolutions/scaling_a_chat_system.md)
