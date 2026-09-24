# e04: Monolith to Microservices — Split by team pain, not by fashion

Evolutions · e03 → **e04** → b01

> *"Start with a monolith, and extract a service only when you can name the pain"*
>
> **Concern**: scalability · cost

## The Problem

A startup with 8 engineers decides to build microservices from day one. Month 2: six services deployed and three engineers writing infrastructure. Month 3: a simple feature touches four services and needs coordinated deploys. Month 4: distributed transactions and surprising eventual consistency. Month 6: competitors with a monolith have shipped five times more features.

In the sim, that split leaves 4.8 productive engineers out of 8, and every request pays 20 ms in network hops.

## The Idea

Starting a business with microservices is like building a house by constructing 15 tiny houses first and connecting them with tunnels. You spend your time managing the tunnels instead of living in the house.

A **monolith** is one codebase and one deploy. It is simple and fast to change, and it only becomes a problem when many people must change it at once. A **microservice** architecture splits it into independently deployable services, each owned by a team. That buys independent releases and independent scaling, and it costs a network hop on every call, a platform to run, and distributed-systems problems you did not have before.

## How It Works

The sim models the team, not the servers. A team loses output to coordination, and the loss grows with the number of people who must agree (1% per extra person, capped at 60%):

```js
// sim.mjs
const coordinationLoss = (peopleWhoMustAgree) => Math.min(COORDINATION_CAP, COORDINATION_PER_PERSON * (peopleWhoMustAgree - 1));
```

1. **A monolith of 8 engineers** loses 7% and has 7.4 productive engineers, with nothing to operate.
2. **A modular monolith** keeps one deploy but draws clear module boundaries inside it, which halves the coordination loss to 3.5%: 7.7 productive engineers with no new infrastructure.
3. **Services** shrink each team but need someone to run them.

The vault note's migration path adds one piece at a time: extract the first service (often auth), add an API gateway, service discovery, event-driven messaging, tracing, and only then a service mesh.

## When It Breaks

Split too early and the platform tax dominates. Six services need three platform engineers:

```js
// sim.mjs
  const earlyInfra = Math.ceil(services * ENGINEERS_PER_PLATFORM_SERVICE);
```

That leaves 4.8 productive engineers, worse than the monolith's 7.4, and the note lists what follows: distributed transactions, data consistency problems, service discovery failures and cascading failures.

## The Trade-off

At scale the arithmetic flips. With 120 engineers a monolith loses 60% of output to coordination and has 48 productive engineers. Twenty services need 10 platform engineers and add 20 ms per request, yet 104.5 engineers are productive, more than twice as many. Independent deploys and small teams are the benefit that finally outweighs the tax.

The middle is honest too: at 30 engineers a 6-service split (25.7 productive) only ties the modular monolith (also 25.7) while adding latency and complexity. Split when you can name the pain, such as deploy contention, one component needing to scale on its own, or teams blocked on each other.

## In The Wild

The vault note traces Netflix, Uber and Amazon from monolith to services. They did it as they grew, over years, in response to specific pain, and not at the start. It also lists when to stay a monolith: fewer than about 10 engineers, fast-changing requirements, a single team and simple scaling needs. The warning signs that you split too early are services that always change together, distributed transactions everywhere, and more time on infrastructure than on features.

## Try It

```sh
node course/2_evolutions/e04_monolith_microservices/sim.mjs --engineers=30
```

You should see four frames. With 30 engineers the monolith reports `productiveEngineers=21.3`, the modular monolith `25.7`, and the 120-engineer split `104.5  infraEngineers=10`. Try `--teamSize=10` for bigger service teams.

## Say It In The Interview

1. Start with a monolith, then a modular monolith. Extract services only for a named pain.
2. Give the signals: deploy contention, independent scaling, or a team blocked on another.
3. Name the costs: network hops, distributed transactions, observability, and a platform team.
4. Say what you would extract first, often something with a clear boundary such as authentication.

## Boundary

This chapter is the decision. The mechanics are covered elsewhere: the API gateway is b08, service discovery is b11, sagas for distributed transactions are p19, and observability is b12.

## What's Next

You have watched one system grow through its blocks. The next track takes each block apart, starting with the one that spreads traffic: the load balancer, b01.

## Source notes

- [From monolith to microservices](../../../vault/system_design/04_system_evolutions/from_monolith_to_microservices.md)
