#system-design #outage #kubernetes #networking

# Reddit Pi Day Outage (2023)

## What Happened

On March 14, 2023 (Pi Day), Reddit went down for **314 minutes** (~5.2 hours). A Kubernetes cluster upgrade broke the Calico CNI networking layer, specifically the BGP route reflector configuration. Pods could no longer route traffic to each other across nodes.

## The Chain of Events

1. Reddit initiated a routine Kubernetes version upgrade on their production cluster
2. The upgrade changed the Calico CNI plugin version alongside the K8s control plane
3. The new Calico version had an incompatibility with Reddit's **BGP route reflector** configuration
4. BGP peering sessions between nodes broke — pods on different nodes lost network connectivity
5. Services appeared healthy individually but could not communicate cross-node
6. Reddit's monitoring showed pods as "Running" but actual inter-pod traffic was failing
7. The blast radius was unclear — engineers could not determine which services were affected
8. Team decided to **restore the entire cluster from backup** rather than debug under uncertainty
9. Full restoration took 314 minutes, coincidentally matching Pi Day (3.14)

## Root Cause

- Kubernetes upgrade was tested in staging, but staging did not replicate production's BGP route reflector topology
- The Calico CNI version bump introduced a breaking change in BGP peering behavior
- No canary upgrade path — the control plane upgrade applied to the entire cluster at once
- Monitoring checked pod health but not inter-pod network reachability

## Lessons for System Design

| Lesson | Concept |
|--------|---------|
| **Test infra upgrades with production traffic patterns**, not just in staging | Environment parity |
| Canary infrastructure changes the same way you canary application deploys | Progressive rollout |
| Monitor network reachability between nodes, not just pod liveness | Deep health checks |
| Understand blast radius before deciding on recovery strategy | Failure isolation |
| CNI and networking layer changes are as risky as application changes | Infrastructure as code |

## The Key Takeaway

Infrastructure upgrades (Kubernetes, CNI, service mesh) need the same canary rollout discipline as application deployments. A staging environment that doesn't mirror production's network topology will miss the exact failures that matter.

## Links
- [[02_building_blocks/load_balancer]] — routing and network path dependencies
- [[06_trade_offs/consistency_vs_availability]] — choosing full restore over partial recovery
