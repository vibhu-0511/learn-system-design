#system-design #outage #supply-chain #npm #dependencies

# left-pad npm Incident (2016)

## What Happened

On March 22, 2016, developer Azer Koculu **unpublished** his npm package `left-pad` — an 11-line JavaScript function that pads strings. This tiny package was a transitive dependency of **React, Babel**, and thousands of other projects. Builds broke worldwide. npm took the unprecedented step of **un-unpublishing** the package to restore the ecosystem.

## The Chain of Events

1. Koculu had a naming dispute with npm over another package (`kik`) and was unhappy with npm's resolution
2. In protest, he **unpublished all 273 of his npm packages**, including `left-pad`
3. `left-pad` had ~2.5 million downloads per month and was a dependency of Babel and many other tools
4. Within minutes, **CI/CD pipelines broke** across the JavaScript ecosystem as `npm install` failed to resolve `left-pad`
5. React, Babel, and thousands of downstream projects could not build
6. npm intervened and **restored the package** against the author's wishes — an unprecedented policy action
7. npm subsequently changed its policies to prevent unpublishing packages with significant dependents

## Root Cause

- The JavaScript ecosystem relied on a **micro-dependency** (11 lines of trivial code) from an external registry
- npm's policies allowed any author to unpublish any package at any time, regardless of downstream impact
- No vendoring or lockfile practices were standard at the time
- A single developer's frustration could break millions of builds

## Lessons for System Design

| Lesson | Concept |
|--------|---------|
| **Vendor critical dependencies** — don't trust external registries for build-time deps | Supply chain security |
| Lockfiles and caches prevent upstream disappearance from breaking builds | Reproducible builds |
| Micro-dependencies create fragile dependency trees | Dependency management |
| Registry policies must account for ecosystem-wide impact | Platform governance |
| A trivial function shouldn't be an external dependency | Code ownership |

## The Key Takeaway

If your entire build pipeline depends on a stranger's 11-line package hosted on a public registry, you have a supply chain problem. Vendor, cache, or write trivial utilities yourself.

## Links
- [[06_trade_offs/consistency_vs_availability]] — registry availability vs. author control
- [[02_building_blocks/api_gateway]] — dependency resolution as a critical path
