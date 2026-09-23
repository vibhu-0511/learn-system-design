#system-design #outage #database #backup

# GitLab Database Deletion (2017)

## What Happened

On January 31, 2017, a GitLab engineer accidentally ran `rm -rf` on the **production database directory** instead of the replica during a late-night maintenance task. **300GB of production data deleted.**

## The Chain of Events

1. GitLab was experiencing replication lag issues between primary and replica databases
2. An engineer attempted to fix replication by re-syncing the replica
3. In a fatigued state at night, the engineer ran the **deletion command on the wrong server** (production instead of replica)
4. 300GB of PostgreSQL data deleted instantly
5. Recovery attempt began — checking backups:
   - **pg_dump backups:** Failed silently for months. Last successful backup: unknown.
   - **Disk snapshots:** Only 6 hours old — some data loss but recoverable
   - **Replication:** The replica they were trying to fix was also behind
6. Restored from disk snapshot. **6 hours of data lost** (issues, merge requests, comments)
7. GitLab live-streamed the entire recovery process on YouTube (radical transparency)

## Root Cause

- Human error under fatigue (night operations)
- **Backups were broken and nobody knew** — no backup verification
- Multiple backup strategies all had issues simultaneously
- No safeguard against running destructive commands on production

## Lessons for System Design

| Lesson | Concept |
|--------|---------|
| **Test your backups regularly** — untested backup = no backup | Backup verification |
| **Never do manual operations on production at night** | Operational procedures |
| **Multiple backup strategies** — don't rely on just one | Redundant backups |
| Production servers should have **safeguards against rm -rf** | `molly-guard`, protected directories |
| **Automated backup verification** — restore to test env nightly | Backup testing |

## The Key Takeaway

A backup that hasn't been tested is not a backup. GitLab had 5 different backup strategies — and most of them were broken. Regularly restore from backups to a test environment to verify they actually work.

## Links
- [[03_design_patterns/replication]] — Replication is not a backup strategy
- [[02_building_blocks/databases_sql]] — Database backup strategies
