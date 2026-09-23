#system-design #outage #cloud #google

# Google Cloud Outage (2022) — Config Push Gone Wrong

## What Happened

In November 2022, Google Cloud experienced a significant outage in the **europe-west9 (Paris)** region lasting **~12 hours**. The root cause: a water cooling system failure combined with an unexpected high-temperature event.

Additionally, in August 2022, Google Cloud's us-central1 region had networking issues caused by **a config change that triggered a software bug** in their network control plane, similar to the Facebook BGP incident.

## The Chain of Events (August 2022)

1. A planned network reconfiguration change was pushed
2. The change triggered a bug in the network control plane software
3. Network paths were incorrectly withdrawn
4. Services in us-central1 lost connectivity
5. Google's internal monitoring detected the issue within minutes
6. Rollback took several hours due to the complexity of the network change

## Lessons for System Design

| Lesson | Concept |
|--------|---------|
| **Config changes are code changes** — test them | Configuration management |
| Network control plane is critical infrastructure | Infrastructure as SPOF |
| Even Google has outages → design for failure at every level | Defense in depth |
| **Physical infrastructure** (cooling, power) can cause cloud outages | Data center redundancy |
| Multi-region/multi-cloud for critical workloads | Cloud strategy |

## The Key Takeaway

Cloud providers are not infallible. Google, AWS, and Azure all have multi-hour outages yearly. For truly critical systems, multi-region deployment is mandatory, and multi-cloud should be considered for the most critical workloads.

## Links

- [[aws_us_east_1_outage_2021]] — AWS equivalent
- [[facebook_bgp_outage_2021]] — Similar network config issue
- [[../15_intermediate_topics/cloud_architecture_patterns]] — Multi-region design
