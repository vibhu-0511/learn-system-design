#system-design #outage #data-deletion #disaster-recovery

# Atlassian Site Deletion Incident (2022)

## What Happened

In April 2022, Atlassian accidentally deleted approximately **775 customer sites** — including Jira, Confluence, Trello, and Opsgenie instances. Affected customers lost access to their entire Atlassian stack for up to **2 weeks** while Atlassian restored data from backups.

## The Chain of Events

1. Atlassian needed to deactivate a legacy app ("Insight Asset Management") from customer sites
2. A maintenance script was built to perform the cleanup
3. The script **called the wrong API** — instead of deactivating an app, it deleted entire cloud sites
4. The script used site IDs where it should have used app IDs
5. 775 customer sites were permanently deleted, including all associated data
6. Atlassian had no automated rollback mechanism for site-level deletions
7. Recovery required manually restoring each site from backups — a slow, per-customer process
8. Some customers were without service for **14 days**

## Root Cause

- The deletion script used the wrong API endpoint (site deletion instead of app deactivation)
- No dry-run or preview step before executing destructive bulk operations
- No soft-delete mechanism — deletion was immediate and permanent
- No incremental execution (batch-of-10 with verification) — the script ran against all targets at once
- Restoration process was not automated and could not be parallelized at scale

## Lessons for System Design

| Lesson | Concept |
|--------|---------|
| **Destructive operations need dry-run mode** — preview before executing | Safe deployment practices |
| Use soft-delete with retention windows, never hard-delete immediately | Data protection |
| Execute bulk operations incrementally with verification between batches | Incremental rollout |
| Automate disaster recovery — manual restore doesn't scale | [[06_trade_offs/consistency_vs_availability]] |
| Validate API parameters match the intended scope of change | Input validation |

## The Key Takeaway

Any script that can delete production data should have a dry-run mode, a soft-delete buffer, and incremental execution with verification gates. The difference between deleting an app and deleting an entire site was one wrong API call.

## Links
- [[06_trade_offs/consistency_vs_availability]] — recovery time directly impacts availability SLAs
- [[02_building_blocks/blob_storage]] — backup and restore architecture
