#system-design #outage #google #backend #availability

# YouTube Global Outage (2018)

## What Happened

On October 16, 2018, **YouTube went down globally for approximately 1 hour and 20 minutes**. Users worldwide could not load videos, access the homepage, or use YouTube TV, YouTube Music, or YouTube Premium. It was one of the longest outages for Google's largest consumer service, affecting an estimated **1.5+ billion users**.

## The Chain of Events

1. An internal backend change was deployed to YouTube's serving infrastructure
2. The change caused a failure in YouTube's **video serving pipeline**
3. Users saw blank pages, error screens, and infinite loading spinners
4. YouTube TV, YouTube Music, and the YouTube API were also affected — all shared backend infrastructure
5. Google's internal teams worked to identify and roll back the change
6. Service was gradually restored over ~80 minutes
7. Google confirmed an internal issue but provided **limited public postmortem details**

## Root Cause

- Google attributed the outage to an **internal system issue** without detailed public disclosure
- The failure affected all YouTube product surfaces, suggesting the issue was in a **shared backend layer** (likely the video metadata or serving path)
- The blast radius indicated insufficient isolation between YouTube's product lines
- Rollback took over an hour, suggesting the change was not easily reversible

## Lessons for System Design

| Lesson | Concept |
|--------|---------|
| **Even Google goes down** — scale doesn't guarantee availability | Humility in design |
| Shared backend infrastructure means shared failure modes | Service isolation |
| Fast rollback capability is as important as deployment speed | Deployment strategy |
| Multiple products on one backend multiply the blast radius | Fault isolation |
| Users need clear communication during outages | Incident communication |

## The Key Takeaway

When your biggest consumer service shares backend infrastructure across all its product lines, a single bad deployment can take everything down at once. Isolate critical serving paths so that YouTube Music failing doesn't also mean YouTube TV fails.

## Links
- [[06_trade_offs/consistency_vs_availability]] — availability at global scale
- [[02_building_blocks/cdn]] — video serving infrastructure and caching layers
