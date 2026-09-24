// Outage Replay drills — curated postmortem replays.
//
// Each replay is structured so the user can reason about the failure BEFORE
// reading the postmortem. The `preIncident` section is spoiler-free; it
// describes the architecture and a thin trigger hint. The `reveal` section is
// the postmortem.
//
// Predict prompts are intentionally identical across all replays so the user
// builds a habit of asking the same four questions every time.

export const PREDICT_PROMPTS = [
  {
    id: "rootCause",
    label: "Root cause",
    helper:
      "What single change, event, or hidden bug do you think kicked this off? Name the trigger, not the symptom.",
  },
  {
    id: "blastRadius",
    label: "Blast radius",
    helper:
      "How did the trigger propagate? Walk the dependency chain that took it from one bad thing to a user-visible outage.",
  },
  {
    id: "recovery",
    label: "Recovery time",
    helper:
      "How long do you think this took to fix, and what made recovery slow? (mins / hours / days?)",
  },
  {
    id: "prevention",
    label: "Prevention",
    helper:
      "What single architectural change would have prevented or contained this? Justify in one sentence.",
  },
];

export const OUTAGE_REPLAYS = [
  {
    id: "aws_s3_2017",
    path: "09_real_outages/amazon_s3_outage_2017.md",
    title: "Amazon S3 Outage",
    year: 2017,
    duration: "4 hours",
    impact:
      "Slack, Trello, Quora, IFTTT, AWS status page itself — all dark in US-East-1.",
    difficulty: "starter",
    preIncident: {
      summary:
        "Amazon S3 in US-East-1 — the largest object store in the world. A small team is doing routine maintenance to remove a few billing servers from the fleet.",
      components: [
        "S3 index subsystem (object metadata)",
        "S3 placement subsystem (write allocation)",
        "Billing servers (the maintenance target)",
        "AWS status dashboard (hosted on S3)",
        "Thousands of downstream services (Slack, Trello, Quora…)",
      ],
      normalState:
        "S3 serves billions of requests/sec across the region. Maintenance commands occasionally remove a handful of servers at a time.",
      triggerHint:
        "An engineer ran a normal-looking maintenance command. Something about how the command was typed had outsized consequences.",
    },
    reveal: {
      rootCause:
        "A typo in the maintenance command removed a much larger set of servers than intended. There was no rate limit and no \"are you sure?\" guard on the destructive operation.",
      blastRadius:
        "Removing those servers took down two foundational subsystems: the index (object → location lookup) and placement (where to write new objects). Without them, S3 couldn't read or write anything in US-East-1. Every service depending on S3 went dark — including AWS's own status page, which couldn't even tell users the truth because it lived on S3.",
      recovery:
        "~4 hours. The subsystems hadn't been fully restarted in years and brought up slowly with cold caches. The status page's circular dependency meant communication to customers was also blocked.",
      prevention:
        "Rate-limit destructive infra operations. Require quorum or confirmation for high-blast-radius commands. Host status pages on completely independent infrastructure (different cloud, even).",
    },
    keyLessons: [
      "Blast radius matters — one operator action shouldn't kill a region.",
      "Status pages must not depend on the system they're reporting on.",
      "If your business runs in one region, you go down with that region.",
    ],
    relatedNotes: [
      "09_real_outages/aws_us_east_1_outage_2021.md",
      "02_building_blocks/blob_storage.md",
      "06_trade_offs/consistency_vs_availability.md",
    ],
  },

  {
    id: "facebook_bgp_2021",
    path: "09_real_outages/facebook_bgp_outage_2021.md",
    title: "Facebook BGP Outage",
    year: 2021,
    duration: "6 hours",
    impact:
      "3.5B users lost FB, IG, WhatsApp, Messenger. Engineers locked out of their own data centers.",
    difficulty: "starter",
    preIncident: {
      summary:
        "Facebook's global backbone — the private network that interconnects their data centers and announces routes to the public internet via BGP. A scheduled maintenance window is starting.",
      components: [
        "Backbone routers (announce BGP routes)",
        "Authoritative DNS servers (facebook.com, instagram.com)",
        "Internal tooling (depends on the same DNS)",
        "Data center physical access systems (badges)",
        "Engineers' communication tools (also Facebook-hosted)",
      ],
      normalState:
        "BGP advertises FB's IP ranges to the internet. DNS resolves facebook.com → IP. Internal tools share that DNS.",
      triggerHint:
        "Engineers pushed a routine BGP configuration change during a maintenance window.",
    },
    reveal: {
      rootCause:
        "The BGP config change accidentally withdrew all routes to Facebook's authoritative DNS servers. The DNS servers were technically up — just unreachable from the internet.",
      blastRadius:
        "No DNS → no facebook.com / instagram.com / whatsapp.com resolution → every Facebook property simultaneously vanished from the internet. Worse: Facebook's *internal* tools (Slack-equivalent, deploy systems, even badge readers at data centers) shared the same DNS infrastructure. Engineers couldn't push a fix remotely because the tools to push fixes were down. They couldn't even physically enter the data centers — badge systems were offline.",
      recovery:
        "~6 hours. Required physically dispatching engineers to data centers, manually overriding badge systems, and reverting the BGP config from a console. Most of the 6 hours was access logistics, not the technical fix.",
      prevention:
        "Out-of-band recovery path that does not depend on the production system: separate DNS, separate VPN, separate physical access. The recovery path cannot share fate with the thing being recovered.",
    },
    keyLessons: [
      "Your recovery path cannot depend on the system that's broken.",
      "DNS is a near-universal SPOF — protect it like one.",
      "Internal tooling must be reachable when production is dark.",
    ],
    relatedNotes: [
      "01_fundamentals/networking_basics.md",
      "02_building_blocks/monitoring_and_logging.md",
    ],
  },

  {
    id: "cloudflare_regex_2019",
    path: "09_real_outages/cloudflare_regex_outage_2019.md",
    title: "Cloudflare Regex Outage",
    year: 2019,
    duration: "27 minutes",
    impact:
      "Millions of sites returned 502s globally. ~10% of the web went dark.",
    difficulty: "starter",
    preIncident: {
      summary:
        "Cloudflare's edge — 200+ city POPs running a Web Application Firewall (WAF) in front of customer sites. The security team is shipping a new WAF rule.",
      components: [
        "Edge servers (run WAF on every request)",
        "WAF rule engine (regex-based)",
        "Global config push pipeline",
        "Origin servers (customers')",
      ],
      normalState:
        "WAF rules are evaluated on every HTTP request. New rules are added regularly as new attack patterns emerge.",
      triggerHint:
        "A new WAF rule went out. It contained a complex-looking regex.",
    },
    reveal: {
      rootCause:
        "Catastrophic regex backtracking. The new rule contained a regex pattern whose worst-case complexity was exponential in input length; on certain HTTP request payloads, a single regex evaluation took seconds and pinned a CPU at 100%.",
      blastRadius:
        "The rule was pushed globally to all 200+ POPs at once with no canary. Every edge server simultaneously hit 100% CPU, dropping all customer traffic — not just the targeted attack pattern. ~10% of the entire HTTP web went down within seconds.",
      recovery:
        "~27 minutes. Identifying the regex as the cause was fast (CPU pinned right after deploy), then a global kill switch disabled the new WAF ruleset.",
      prevention:
        "Canary deploys for config — push to one POP, watch CPU/error rates, then expand. Per-rule CPU budgets so one rule can't starve others. Test regex patterns against pathological inputs before shipping.",
    },
    keyLessons: [
      "Config deploys are code deploys. They need canaries too.",
      "Test for performance, not just correctness.",
      "Resource isolation per rule/component prevents one bad input from killing the host.",
    ],
    relatedNotes: [
      "03_design_patterns/circuit_breaker.md",
      "02_building_blocks/monitoring_and_logging.md",
    ],
  },

  {
    id: "crowdstrike_2024",
    path: "09_real_outages/crowdstrike_global_outage_2024.md",
    title: "CrowdStrike Global Outage",
    year: 2024,
    duration: "Days to weeks",
    impact:
      "8.5M Windows machines BSOD'd globally. Airlines, hospitals, banks, 911. ~$5.4B+ damages.",
    difficulty: "core",
    preIncident: {
      summary:
        "CrowdStrike Falcon — endpoint security software running as a kernel-level driver on millions of Windows machines worldwide, including critical infrastructure. The threat team is pushing a new content update (a Channel File, not a code update).",
      components: [
        "Falcon kernel driver (Windows kernel, ring 0)",
        "Channel files (threat detection definitions)",
        "Auto-update channel (pushed to all customers)",
        "Customer endpoints (PCs, servers, kiosks, ATMs)",
      ],
      normalState:
        "Channel files update many times per day. Code updates go through review and staged rollout. Channel files are treated as low-risk \"data\" updates.",
      triggerHint:
        "A new Channel File (291) was published. The team treated it as a routine content update.",
    },
    reveal: {
      rootCause:
        "Channel File 291 contained a logic error that triggered an out-of-bounds read inside the Falcon kernel driver. Because the driver runs at ring 0, any crash takes down the whole OS.",
      blastRadius:
        "Pushed to 100% of customers simultaneously with no canary. Every Falcon-protected Windows machine that received the file crashed into BSOD on the next boot. Because the driver loads early in boot, machines entered an infinite BSOD loop and couldn't even start. Airlines, hospitals, payment terminals, 911 dispatch — all of them down at once.",
      recovery:
        "Days to weeks. The fix was known within ~80 minutes, but recovery required physical access to each machine to boot into Safe Mode and delete the bad file. 8.5M machines × manual remediation = enormous tail. Some machines weren't fixed for weeks because they were in remote/inaccessible locations.",
      prevention:
        "Canary even \"just config\" updates — kernel components especially. Make rollback automatic and remote (boot loader can detect repeated crashes and roll back to last-known-good). Treat content/data updates with the same review rigor as code.",
    },
    keyLessons: [
      "\"It's just a config update\" is the most dangerous sentence in deployment.",
      "Kernel-level components need extra safety, not less, because their blast radius is the whole machine.",
      "Manual recovery doesn't scale. If the only fix is hands-on, rollout was wrong.",
    ],
    relatedNotes: [
      "09_real_outages/cloudflare_regex_outage_2019.md",
      "03_design_patterns/circuit_breaker.md",
    ],
  },

  {
    id: "github_db_2018",
    path: "09_real_outages/github_database_incident_2018.md",
    title: "GitHub Database Incident",
    year: 2018,
    duration: "24 hours",
    impact:
      "Webhook deliveries delayed, GitHub Pages stale, partial UI degradation across the platform.",
    difficulty: "core",
    preIncident: {
      summary:
        "GitHub's MySQL fleet: a primary in one US data center, replicas in another DC across the country. Orchestrator runs automated failover when the primary is unreachable.",
      components: [
        "Primary MySQL (writes)",
        "Cross-DC MySQL replicas (reads + failover candidates)",
        "Orchestrator (detects primary failure, promotes a replica)",
        "Inter-DC network link",
        "Application layer (issues writes, expects strong reads)",
      ],
      normalState:
        "Replication is asynchronous; replicas lag by tens of milliseconds. Orchestrator promotes a replica if the primary is unreachable for a configured threshold.",
      triggerHint:
        "Routine 43-second network maintenance briefly disconnected the primary from the replicas.",
    },
    reveal: {
      rootCause:
        "Orchestrator's threshold was aggressive enough that a 43-second network blip looked like a primary failure. It promoted a remote replica to primary. When the original primary's network came back, both nodes accepted writes for a brief window — split brain.",
      blastRadius:
        "Writes diverged across the two \"primaries.\" When the split was detected, GitHub had to manually reconcile data — figuring out which writes happened on which node and merging them safely. Background pipelines (webhooks, GitHub Pages builds, email) were paused or replayed to avoid corruption. Total degraded service: ~24h.",
      recovery:
        "~24 hours. The fix wasn't restoring uptime — it was reconciling diverged data without losing or corrupting writes. That's careful, slow, mostly manual work.",
      prevention:
        "Fencing tokens so a demoted primary can't write after it's been replaced. Less aggressive failover thresholds, especially for known-brief network events. Better cross-DC topology awareness so replicas with high lag aren't candidates.",
    },
    keyLessons: [
      "Automated failover is a sharp tool — wrong threshold = self-inflicted split brain.",
      "Replication lag matters at the moment of promotion.",
      "After a split, the hard part is data reconciliation, not restarting servers.",
    ],
    relatedNotes: [
      "03_design_patterns/leader_election.md",
      "03_design_patterns/replication.md",
      "01_fundamentals/consistency_models.md",
    ],
  },

  {
    id: "gitlab_2017",
    path: "09_real_outages/gitlab_data_deletion_2017.md",
    title: "GitLab Database Deletion",
    year: 2017,
    duration: "~6 hours of data lost",
    impact:
      "300GB primary DB deleted. 6 hours of issues, MRs, and comments lost forever.",
    difficulty: "starter",
    preIncident: {
      summary:
        "GitLab.com's PostgreSQL: primary plus a replica that's been having replication lag issues. An on-call engineer is trying to fix the replica late at night.",
      components: [
        "Primary PostgreSQL (production data)",
        "Replica PostgreSQL (lagging)",
        "pg_dump backups (nightly)",
        "Disk snapshots (every 24 hours)",
        "Continuous archive (WAL shipping)",
        "S3 backups",
      ],
      normalState:
        "Five overlapping backup strategies are documented. Most have not been verified by an actual restore in months.",
      triggerHint:
        "The engineer wanted to clear and re-sync the replica's data directory.",
    },
    reveal: {
      rootCause:
        "Tired engineer, two SSH sessions in different terminals, ran `rm -rf` on the wrong host. Deleted the production primary's data directory.",
      blastRadius:
        "300GB instantly gone. Then the recovery story unraveled: pg_dump had been silently failing for months. The S3 backup bucket was empty — credentials expired. WAL archive had a gap. Only the disk snapshot survived, ~6 hours stale.",
      recovery:
        "Several hours to find a usable backup, then restore from the disk snapshot. ~6 hours of writes (issues, MRs, comments) were unrecoverable.",
      prevention:
        "Verify backups by actually restoring them on a schedule (nightly, automatic, alerting). Make it impossible to mistake the primary for the replica in interactive sessions (different shell prompts, different colors, sudo gates). Two-person rule for destructive commands on prod.",
    },
    keyLessons: [
      "An untested backup is not a backup.",
      "Five backup strategies, all silently broken, equal zero backups.",
      "Humans at 1am make mistakes — design the environment to make those mistakes impossible.",
    ],
    relatedNotes: [
      "03_design_patterns/replication.md",
      "02_building_blocks/databases_sql.md",
    ],
  },

  {
    id: "knight_capital_2012",
    path: "09_real_outages/knight_capital_2012.md",
    title: "Knight Capital Trading Disaster",
    year: 2012,
    duration: "45 minutes",
    impact: "$440M loss in 45 minutes. Knight Capital effectively ended.",
    difficulty: "core",
    preIncident: {
      summary:
        "Knight Capital was one of the largest US equity market makers — automated trading at thousands of orders per second. Today's deploy: a new feature called RLP that reuses an old configuration flag (\"Power Peg\") that hadn't been used in years.",
      components: [
        "8 production trading servers",
        "Order routing system",
        "Risk controls (position limits, kill switches)",
        "Old \"Power Peg\" code (dead, but still on disk)",
        "Configuration flags (one repurposed for RLP)",
      ],
      normalState:
        "Trading at high frequency. The Power Peg code path hasn't been used since 2003 but was never deleted. The deploy script copies the new binary to all 8 servers.",
      triggerHint:
        "The deploy ran. Eight servers needed the new code.",
    },
    reveal: {
      rootCause:
        "The deploy script silently failed on 1 of 8 servers. Server 8 still had the old binary. When the new config flag (intended for RLP) flipped, server 8 interpreted it as the old Power Peg flag and started running ancient code that bought aggressively at market with no limits.",
      blastRadius:
        "Server 8 began executing thousands of unintended orders per second — buying high, selling low, accumulating $7B in unwanted positions. The other 7 servers behaved correctly, which made the symptom confusing. Engineers tried to roll back, which made it worse — they redeployed the new binary but didn't kill the runaway trades fast enough.",
      recovery:
        "45 minutes from first bad trade to halt. By that point, $440M was gone. The company never recovered.",
      prevention:
        "Delete dead code. Don't reuse config flags. Verify every server post-deploy (binary checksums match expected). Pre-trade risk controls with an automatic kill switch that fires on anomalous order rates, not just position size.",
    },
    keyLessons: [
      "Dead code in production is a loaded gun.",
      "A partial deploy is worse than a failed deploy — divergent behavior is invisible until it isn't.",
      "Critical systems need real-time anomaly detection with auto-halt, not just position limits.",
    ],
    relatedNotes: [
      "03_design_patterns/circuit_breaker.md",
      "02_building_blocks/monitoring_and_logging.md",
    ],
  },

  {
    id: "tsb_2018",
    path: "09_real_outages/tsb_bank_migration_2018.md",
    title: "TSB Bank Migration Disaster",
    year: 2018,
    duration: "Weeks to months",
    impact:
      "1.9M customers locked out. Some saw OTHER customers' accounts. £366M cost. CEO resigned.",
    difficulty: "deep",
    preIncident: {
      summary:
        "TSB (UK retail bank) is migrating 5.4M customer accounts from the legacy Lloyds platform to a new core banking system built by their parent Sabadell. Plan: a single \"big bang\" weekend cutover.",
      components: [
        "Legacy Lloyds core banking platform",
        "New Sabadell core banking platform",
        "Mobile + web channels",
        "Customer service phone lines",
        "Migration ETL jobs (5.4M accounts)",
        "Authentication / session systems on both sides",
      ],
      normalState:
        "Customers expect 24/7 access to balances, payments, transfers. Banking regulations require strong customer isolation.",
      triggerHint:
        "Migration ran Sunday night. Systems went live Monday morning.",
    },
    reveal: {
      rootCause:
        "The new platform had not been load-tested at production scale. When 5.4M users hit it Monday morning, sessions, auth, and account lookups buckled. Worse, defective session handling caused some customers' sessions to be served other customers' account data — a regulatory catastrophe on top of an outage.",
      blastRadius:
        "1.9M customers locked out. Some who got in saw strangers' balances and transactions. Phone support was overwhelmed (hours-long holds). Fraud spiked as criminals exploited the chaos. There was no rollback plan — the legacy platform had been decommissioned the same weekend.",
      recovery:
        "Weeks. Some issues took months. Total cost £366M+; CEO resigned; regulator imposed a multi-year monitoring regime.",
      prevention:
        "Strangler fig migration — run both platforms in parallel, route 1% then 10% then 50% of traffic, with a rollback button at every stage. Load test at 1.5x peak before any cutover. Never decommission the old system until the new one has handled real traffic for weeks.",
    },
    keyLessons: [
      "Big bang migrations are how you blow up a company.",
      "Load test at production scale before cutover, not after.",
      "Always keep the legacy system live until the new one has earned trust.",
    ],
    relatedNotes: [
      "04_system_evolutions/from_monolith_to_microservices.md",
      "09_real_outages/knight_capital_2012.md",
    ],
  },

  {
    id: "fastly_2021",
    path: "09_real_outages/fastly_cdn_outage_2021.md",
    title: "Fastly CDN Outage",
    year: 2021,
    duration: "~1 hour",
    impact:
      "Amazon, Reddit, GitHub, NYT, BBC, UK gov — major chunks of the web returned 503s.",
    difficulty: "starter",
    preIncident: {
      summary:
        "Fastly's edge CDN, fronting a huge slice of the web. Customers configure their own caching/routing rules through Fastly's API.",
      components: [
        "Edge POPs (global)",
        "Configuration push system",
        "Customer config UI/API",
        "Origin servers (customers')",
      ],
      normalState:
        "Customers push config changes regularly. Fastly's software is supposed to handle any valid customer input.",
      triggerHint:
        "A customer pushed a perfectly valid configuration change.",
    },
    reveal: {
      rootCause:
        "A customer's valid config triggered a latent bug in Fastly's edge software that had been shipped weeks earlier but never exercised. The bug caused 85% of edge POPs to return 503s.",
      blastRadius:
        "Within seconds, the broken config propagated to most POPs globally. Sites with Fastly as their sole CDN went dark — Amazon, Reddit, GitHub, NYT, UK gov. Sites with a multi-CDN strategy stayed up.",
      recovery:
        "~1 hour. Fastly identified the issue in ~1 minute and pushed a fix in ~49 minutes. Most affected sites recovered shortly after.",
      prevention:
        "Multi-CDN with DNS-based failover so any single CDN's outage degrades — not collapses — your site. Internally for Fastly: fuzz-test config parsers, canary config-handling code paths, isolate POPs so one bad config can't take down 85% at once.",
    },
    keyLessons: [
      "If your site depends on one CDN, you own that CDN's outages.",
      "Latent bugs surface when novel valid inputs arrive — \"valid\" doesn't mean \"tested.\"",
      "Multi-CDN is cheap insurance for sites where uptime matters.",
    ],
    relatedNotes: [
      "02_building_blocks/cdn.md",
      "09_real_outages/amazon_s3_outage_2017.md",
    ],
  },

  {
    id: "roblox_2021",
    path: "09_real_outages/roblox_73h_outage_2021.md",
    title: "Roblox 73-Hour Outage",
    year: 2021,
    duration: "73 hours",
    impact:
      "50M+ daily users (mostly children) locked out for 3 days during a popular promotion.",
    difficulty: "deep",
    preIncident: {
      summary:
        "Roblox runs thousands of microservices that find each other through HashiCorp Consul (service discovery). Consul also stores config and does health checking. A new streaming feature is being gradually enabled.",
      components: [
        "Consul cluster (service discovery, KV store, health checks)",
        "Thousands of microservices that depend on Consul",
        "Streaming feature (newly enabled)",
        "Monitoring (also depends on Consul)",
      ],
      normalState:
        "Services query Consul on startup and periodically to find each other. Consul is treated as critical infra. Most engineers don't think about it daily.",
      triggerHint:
        "A routine Consul upgrade landed. The new streaming feature was scaled up shortly after.",
    },
    reveal: {
      rootCause:
        "The Consul upgrade enabled streaming-style updates by default. Under high load from the streaming feature, Consul nodes started spending all their CPU on streaming bookkeeping. Health checks slowed down and started failing.",
      blastRadius:
        "Failed health checks caused Consul to remove nodes from the cluster. Fewer nodes meant more load per remaining node — which then failed too. The cluster slowly cannibalized itself. Without service discovery, microservices couldn't find each other; new pods couldn't register; the platform died. Monitoring also depended on Consul, so engineers were debugging blind.",
      recovery:
        "73 hours. Most of that time was diagnosis — the failure mode was novel and monitoring was unreliable. Recovery required rebuilding the Consul cluster carefully under controlled load, with the streaming feature disabled.",
      prevention:
        "Treat service discovery as the most critical system you own — more redundancy and testing than the app, not less. Monitoring must run on infrastructure independent of what it monitors. Feature flags for backend infra changes (the streaming behavior) so they can be reverted instantly.",
    },
    keyLessons: [
      "Service discovery / config / DNS are the foundation — they need the most paranoia.",
      "If monitoring depends on the broken thing, you fly blind exactly when you most need to see.",
      "Cascading failures love positive feedback loops — every dropped node makes the next more likely.",
    ],
    relatedNotes: [
      "03_design_patterns/circuit_breaker.md",
      "03_design_patterns/leader_election.md",
      "02_building_blocks/monitoring_and_logging.md",
    ],
  },

  {
    id: "slack_db_2024",
    path: "09_real_outages/slack_database_incident_2024.md",
    title: "Slack Database Incident",
    year: 2024,
    duration: "Several hours",
    impact:
      "Messages stuck sending, channels not loading, \"connecting…\" spinner platform-wide.",
    difficulty: "core",
    preIncident: {
      summary:
        "Slack's MySQL fleet under planned maintenance. Application servers connect through bounded connection pools; a load balancer in front does health-check based routing.",
      components: [
        "MySQL primary + replicas",
        "Application servers (bounded connection pools)",
        "Load balancer (health checks)",
        "Maintenance task (running on prod tables)",
      ],
      normalState:
        "Apps hold tens of pooled DB connections. Health checks query the DB; if unhealthy, the LB drops the server.",
      triggerHint:
        "A planned database maintenance operation kicked off during low-traffic hours.",
    },
    reveal: {
      rootCause:
        "The maintenance op took unexpected locks on hot tables. Application reads piled up behind the locks. Each blocked query held a pooled connection, and the pools rapidly exhausted across all app servers.",
      blastRadius:
        "With pools full, app health checks (which themselves use the DB) started timing out. The load balancer marked servers unhealthy and removed them from rotation. Fewer servers meant the surviving ones got hit harder, exhausting their pools faster — a cascading collapse. Users saw spinners and \"connecting…\" everywhere.",
      recovery:
        "Several hours. Required killing the maintenance op, manually clearing locks, then ramping traffic back gradually so pools could refill before LB declared servers healthy.",
      prevention:
        "Run maintenance on a replica or with explicit lock budgets. Bounded query timeouts at the app layer so pooled connections release fast. Circuit breakers so the app sheds load rather than queueing forever. Health checks that don't depend on the same hot path as user traffic.",
    },
    keyLessons: [
      "Connection pools are the hidden back-pressure system; they fail silently then catastrophically.",
      "Maintenance operations can take production down — test on replicas first.",
      "Health checks that query the DB will lie when the DB is the problem.",
    ],
    relatedNotes: [
      "02_building_blocks/databases_sql.md",
      "03_design_patterns/circuit_breaker.md",
    ],
  },

  {
    id: "southwest_2022",
    path: "09_real_outages/southwest_airlines_2022.md",
    title: "Southwest Airlines Meltdown",
    year: 2022,
    duration: "10 days",
    impact:
      "16,700+ flights cancelled. 2M+ passengers stranded. ~$800M cost.",
    difficulty: "deep",
    preIncident: {
      summary:
        "Southwest runs point-to-point routing (no hubs). Crew assignments are tracked in SkySolver — a 30-year-old scheduling system. Crew availability changes are reported by phone calls between crew and operations.",
      components: [
        "SkySolver crew scheduling system (legacy)",
        "Phone-based crew check-in",
        "Point-to-point flight network",
        "Aircraft fleet",
      ],
      normalState:
        "Routine schedule changes are within SkySolver's capacity. Phone-based check-ins are slow but functional under normal disruptions.",
      triggerHint:
        "Winter Storm Elliott hit in late December 2022. Other airlines saw initial disruption but recovered within 1–2 days.",
    },
    reveal: {
      rootCause:
        "The storm cancelled enough flights that SkySolver's rebooking algorithm exceeded its scaling limits. The system couldn't reassign crews fast enough to keep up with cascading rebookings. Crews and aircraft were available, but the system couldn't match them to flights.",
      blastRadius:
        "Phone-based check-in collapsed under the load — crews waited hours to report availability. Point-to-point routing had no hub-based containment, so disruption in one city cascaded everywhere immediately. Other airlines used hub-and-spoke recovery to localize disruption; Southwest had no equivalent.",
      recovery:
        "10 days. Required essentially manual re-creation of the entire schedule. Other airlines were back to normal within 1–2 days.",
      prevention:
        "Modernize critical legacy systems before the worst-case scenario forces it. Capacity-test against extreme but plausible disruption (not just steady state). Build degraded-but-functioning modes — e.g., online crew check-in as a phone-line bypass.",
    },
    keyLessons: [
      "Tech debt in critical systems is a business survival risk, not an engineering preference.",
      "Steady-state capacity is the wrong number — measure worst-case rebooking spikes.",
      "Networks without natural containment (no hubs) require stronger system-level resilience.",
    ],
    relatedNotes: [
      "03_design_patterns/circuit_breaker.md",
      "06_trade_offs/simplicity_vs_scalability.md",
    ],
  },

  {
    id: "discord_db_2024",
    path: "09_real_outages/discord_message_outage_2024.md",
    title: "Discord Database Scaling Incident",
    year: 2024,
    duration: "Hours",
    impact:
      "Message sending degraded, \"message not found\" errors at peak.",
    difficulty: "deep",
    preIncident: {
      summary:
        "Discord stores trillions of messages in ScyllaDB. The partition key is channel_id — every message in a channel lives on the same partition.",
      components: [
        "ScyllaDB cluster (LSM-tree storage)",
        "Message Service (writes/reads)",
        "Partition key: channel_id",
        "Background compaction",
        "Replication across nodes",
      ],
      normalState:
        "Most channels have small-to-medium traffic. Compaction runs continuously to merge SSTables. Replication keeps up easily.",
      triggerHint:
        "A handful of very large servers (1M+ members) saw a traffic surge in their general-channel.",
    },
    reveal: {
      rootCause:
        "Hot partitions. A 1M+ member server's general channel hashes to a single partition; that partition's primary node became a bottleneck. Compaction on that node started competing with live reads/writes for I/O.",
      blastRadius:
        "Reads on that partition slowed → applications retried → load on the partition increased. Replication fell behind, so reads going to replicas saw stale data — including \"message not found\" for messages that had just been written. Other channels on the same nodes were collateral damage.",
      recovery:
        "Hours. Mitigations: throttle compaction during peak, route hot partition reads to specific replicas, and at the application layer split very-hot channels into sub-partitions.",
      prevention:
        "Choose partition keys that distribute load even in worst-case servers (sub-shard hot channels by time bucket or user-segment). Monitor per-partition load, not just per-node. Run compaction with I/O budgets so it can't starve live traffic.",
    },
    keyLessons: [
      "Partition key choice determines whether a system scales.",
      "\"Worst-case user\" defines your hot partition, not the average.",
      "Background work (compaction, GC, indexing) needs its own I/O budget.",
    ],
    relatedNotes: [
      "03_design_patterns/sharding.md",
      "02_building_blocks/databases_nosql.md",
    ],
  },

  {
    id: "aws_us_east_2021",
    path: "09_real_outages/aws_us_east_1_outage_2021.md",
    title: "AWS us-east-1 Outage",
    year: 2021,
    duration: "~7 hours",
    impact:
      "Netflix, Disney+, Slack, DoorDash, Venmo, Robinhood — much of the consumer internet stuttered.",
    difficulty: "core",
    preIncident: {
      summary:
        "AWS's oldest, biggest region — us-east-1. An automated capacity-management process is set to scale up internal networking devices to handle anticipated holiday-season load.",
      components: [
        "EC2, ECS, Lambda, DynamoDB, SQS (every major service)",
        "Internal AWS network fabric",
        "Automated networking-capacity controller",
        "AWS status page (depends on us-east-1)",
        "Customer workloads pinned to us-east-1",
      ],
      normalState:
        "Internal capacity scaling runs continuously, mostly invisible.",
      triggerHint:
        "The capacity controller kicked off an internal scale-up.",
    },
    reveal: {
      rootCause:
        "The capacity controller emitted a flood of connection-establishment requests that overwhelmed internal networking devices. The devices became congested, dropping inter-service traffic.",
      blastRadius:
        "EC2, Lambda, ECS, DynamoDB, SQS — basically every us-east-1 service degraded simultaneously. Customers' multi-AZ deployments inside us-east-1 didn't help because the impairment was at the regional network fabric level. The AWS status page was also degraded (same dependency story as 2017).",
      recovery:
        "~7 hours. Required throttling the runaway controller, draining congestion, and bringing services back gradually to avoid re-triggering the storm.",
      prevention:
        "Multi-region for any business that genuinely cares about uptime. Inside the cloud provider: rate-limit internal automation, design control planes with circuit breakers, never assume \"a region\" is a single failure domain.",
    },
    keyLessons: [
      "Even AWS's flagship region has multi-hour outages. Plan for it.",
      "Multi-AZ inside one region doesn't protect against regional control-plane failure.",
      "Internal automation is a frequent root cause — it can act faster than humans can stop it.",
    ],
    relatedNotes: [
      "09_real_outages/amazon_s3_outage_2017.md",
    ],
  },

  {
    id: "google_cloud_2022",
    path: "09_real_outages/google_cloud_outage_2022.md",
    title: "Google Cloud Outage",
    year: 2022,
    duration: "~12 hours (Paris) / hours (us-central1)",
    impact:
      "europe-west9 (Paris) hardware-down for ~12h after a cooling failure; us-central1 networking degraded after a config push.",
    difficulty: "core",
    preIncident: {
      summary:
        "Google Cloud's europe-west9 region in Paris is operating normally. The data center has water-based cooling sized for typical European summer conditions. Separately, the us-central1 region has a planned network configuration change scheduled.",
      components: [
        "Data center physical cooling (Paris)",
        "Network control plane (us-central1)",
        "Customer VMs and managed services",
        "Internal monitoring",
      ],
      normalState:
        "Cooling normally absorbs heat well within design limits. Network control-plane changes go through a review pipeline.",
      triggerHint:
        "Two distinct triggers in the same period: a heat anomaly hit Paris; a network config change shipped to us-central1.",
    },
    reveal: {
      rootCause:
        "Paris: a water-cooling system failure during an unusual high-temperature event meant heat couldn't be removed fast enough. Equipment had to be shut down to prevent damage. us-central1: a config push triggered a latent bug in the network control plane that incorrectly withdrew routes.",
      blastRadius:
        "Paris: customers running only in europe-west9 lost compute and managed services for ~12 hours. us-central1: services in that region lost network connectivity until the change was reverted.",
      recovery:
        "Paris: hours to restore cooling and bring equipment back safely. us-central1: rollback was complicated by the very networking change that broke it — took several hours.",
      prevention:
        "Multi-region deployment for anything critical, including across cloud providers if needed. Inside cloud: physical infra design for thermal extremes well above current climate norms; treat config pushes as code with canary + rollback paths that don't require the broken network.",
    },
    keyLessons: [
      "Physical infrastructure (cooling, power) still bites in 2020s cloud.",
      "All major cloud providers have multi-hour outages annually — plan accordingly.",
      "Config changes are the most common trigger for control-plane outages.",
    ],
    relatedNotes: [
      "09_real_outages/aws_us_east_1_outage_2021.md",
      "09_real_outages/facebook_bgp_outage_2021.md",
    ],
  },
  {
    id: "cloudflare_2025",
    path: "09_real_outages/cloudflare_outage_2025.md",
    title: "Cloudflare Global Outage",
    year: 2025,
    duration: "20 minutes",
    impact: "All Cloudflare services degraded globally — CDN, WAF, bot management, Workers.",
    difficulty: "deep",
    preIncident: {
      summary: "Cloudflare's edge proxy processes every HTTP request through a pipeline of features: WAF, bot management, caching. A routine update ships a new version of a bot-management configuration file to every edge node.",
      components: [
        "Edge proxy (Rust-based, runs on every PoP)",
        "Bot-management feature module",
        "Configuration distribution pipeline",
        "Global anycast network (~300 cities)",
      ],
      normalState: "Config updates ship continuously. Each feature module loads its config into memory at startup and on update.",
      triggerHint: "The configuration file had been growing over time. This update pushed it past an important boundary.",
    },
    reveal: {
      rootCause: "The bot-management configuration file exceeded a hard-coded 32 MB size limit in the Rust proxy. The proxy panicked on the oversized allocation, crashing globally.",
      blastRadius: "Every edge node worldwide received the same oversized config simultaneously. The proxy restart loop meant all HTTP traffic through Cloudflare was disrupted — CDN, security, compute, everything.",
      recovery: "~20 minutes. Engineers identified the panic, rolled back the config file, and proxies recovered on restart.",
      prevention: "Add size validation before distributing configs. Canary config changes to a small percentage of nodes first. Remove hard-coded limits or make them configurable with alerts well below the threshold.",
    },
    keyLessons: [
      "Static configs grow — never assume they stay small.",
      "Canary all config changes, not just code deploys.",
      "A panic in a hot path means global outage when deployed everywhere at once.",
    ],
    relatedNotes: [
      "09_real_outages/cloudflare_regex_outage_2019.md",
      "09_real_outages/crowdstrike_global_outage_2024.md",
    ],
  },
  {
    id: "dyn_dns_2016",
    path: "09_real_outages/dyn_dns_ddos_2016.md",
    title: "Dyn DNS DDoS Attack",
    year: 2016,
    duration: "~6 hours (multiple waves)",
    impact: "Twitter, Spotify, Reddit, GitHub, PayPal, Netflix — DNS resolution failed across US East.",
    difficulty: "starter",
    preIncident: {
      summary: "Dyn is a managed DNS provider. Many major websites use Dyn as their sole or primary DNS resolver. A massive flood of traffic arrives at Dyn's infrastructure.",
      components: [
        "Dyn managed DNS resolvers",
        "Mirai botnet (~100K IoT devices)",
        "Anycast DNS infrastructure",
        "Customer domains (Twitter, Spotify, Reddit…)",
      ],
      normalState: "Dyn handles billions of DNS queries daily across globally distributed resolvers.",
      triggerHint: "The traffic wasn't legitimate. It came from an army of compromised devices — cameras, DVRs, routers — all pointed at one target.",
    },
    reveal: {
      rootCause: "The Mirai botnet launched a ~1.2 Tbps DDoS attack against Dyn's DNS infrastructure. The sheer volume overwhelmed resolvers, making DNS resolution fail for all Dyn customers.",
      blastRadius: "Any website using Dyn as sole DNS provider became unreachable. Users couldn't resolve domain names, so sites appeared completely down even though the actual servers were healthy.",
      recovery: "~6 hours across three attack waves. Dyn mitigated by re-routing traffic and working with upstream providers to filter botnet traffic.",
      prevention: "Use multiple DNS providers (multi-homing). Implement anycast with sufficient over-provisioning. IoT devices need security standards to prevent botnet recruitment.",
    },
    keyLessons: [
      "DNS is a single point of failure for the entire internet experience.",
      "Multi-provider DNS is table stakes for critical services.",
      "IoT botnets make DDoS attacks orders of magnitude larger than before.",
    ],
    relatedNotes: [
      "01_fundamentals/networking_basics.md",
      "02_building_blocks/cdn.md",
    ],
  },
  {
    id: "leftpad_2016",
    path: "09_real_outages/leftpad_npm_2016.md",
    title: "left-pad npm Incident",
    year: 2016,
    duration: "~2.5 hours",
    impact: "React, Babel, and thousands of JS projects worldwide broke — npm builds failed globally.",
    difficulty: "starter",
    preIncident: {
      summary: "npm is the package registry for JavaScript. A developer publishes a tiny 11-line utility package called left-pad. Thousands of packages depend on it transitively. The developer has a dispute with npm.",
      components: [
        "npm registry",
        "left-pad package (11 lines of code)",
        "Babel, React, and thousands of transitive dependents",
        "CI/CD pipelines worldwide",
      ],
      normalState: "npm install fetches packages from the registry. Packages reference exact or semver-ranged dependencies.",
      triggerHint: "The developer decided to remove all their packages from npm in protest. One of them was deeply embedded in the dependency tree.",
    },
    reveal: {
      rootCause: "The developer unpublished left-pad from npm. Any project with a transitive dependency on left-pad immediately failed on npm install because the package no longer existed in the registry.",
      blastRadius: "Babel (the most popular JS compiler) depended on left-pad transitively. This meant React, Angular, and thousands of other projects couldn't build. CI/CD pipelines broke globally.",
      recovery: "~2.5 hours. npm took the unprecedented step of un-unpublishing the package, restoring it against the author's wishes. npm then changed policy to prevent unpublishing packages with dependents.",
      prevention: "Vendor critical dependencies (commit node_modules or use a lockfile with integrity hashes). Use a private registry mirror. Registries should prevent unpublishing packages with significant downstream dependents.",
    },
    keyLessons: [
      "A single 11-line dependency can break the entire JS ecosystem — supply chain risk is real.",
      "Vendor or mirror your critical dependencies.",
      "Registry policies must account for the social contract of publishing.",
    ],
    relatedNotes: [
      "01_fundamentals/networking_basics.md",
    ],
  },
  {
    id: "youtube_2018",
    path: "09_real_outages/youtube_outage_2018.md",
    title: "YouTube Global Outage",
    year: 2018,
    duration: "~1 hour",
    impact: "YouTube completely down worldwide — no video playback, no uploads, no YouTube TV.",
    difficulty: "starter",
    preIncident: {
      summary: "YouTube is the world's largest video platform, serving billions of views daily. Google's internal infrastructure powers video storage, transcoding, and delivery. A backend change is being rolled out.",
      components: [
        "YouTube frontend and API servers",
        "Video serving and CDN infrastructure",
        "Backend storage and metadata systems",
        "Google internal infrastructure",
      ],
      normalState: "YouTube handles over a billion hours of video watched daily with five-nines availability.",
      triggerHint: "An internal change had an unexpected interaction with YouTube's serving stack. The details were never fully disclosed.",
    },
    reveal: {
      rootCause: "Google disclosed only that it was an internal issue. External analysis suggests a backend change affected YouTube's serving infrastructure globally. The lack of canary deployment meant it hit all traffic at once.",
      blastRadius: "Complete global outage — every YouTube product (main site, mobile, YouTube TV, YouTube Music, embedded players) went down simultaneously. Google's advertising revenue was directly impacted.",
      recovery: "~1 hour. Google engineers rolled back the change. YouTube recovered gradually as caches repopulated.",
      prevention: "Canary all changes to a small percentage of traffic. Implement automated rollback on error-rate spikes. Ensure large services have independent failure domains.",
    },
    keyLessons: [
      "Even Google has global outages — no one is immune.",
      "Canary deployments are essential for services at scale.",
      "When a billion-user service goes down, the economic impact is measured in minutes of lost revenue.",
    ],
    relatedNotes: [
      "02_building_blocks/cdn.md",
      "09_real_outages/facebook_bgp_outage_2021.md",
    ],
  },
  {
    id: "salesforce_dns_2021",
    path: "09_real_outages/salesforce_dns_2021.md",
    title: "Salesforce DNS Outage",
    year: 2021,
    duration: "~5 hours",
    impact: "Salesforce, Heroku, and Pardot globally unreachable — enterprise CRM down worldwide.",
    difficulty: "core",
    preIncident: {
      summary: "Salesforce runs a multi-tenant SaaS platform serving hundreds of thousands of enterprises. An emergency break-fix change is applied to DNS configuration outside the normal change management process.",
      components: [
        "Salesforce perimeter services",
        "Internal DNS resolution",
        "Change management / review process",
        "Multi-tenant application platform",
      ],
      normalState: "DNS resolves internal service names for every request. Change management requires peer review and staged rollout.",
      triggerHint: "An 'emergency' DNS change bypassed the normal review process. The change had a subtle error that wasn't caught because no one else reviewed it.",
    },
    reveal: {
      rootCause: "A DNS configuration change was applied via an emergency process, bypassing peer review. The change broke internal hostname resolution for the perimeter service, making the entire platform unreachable.",
      blastRadius: "All Salesforce services globally — CRM, Service Cloud, Heroku, Pardot, Marketing Cloud. Enterprises worldwide lost access to their customer data and workflows.",
      recovery: "~5 hours. Engineers had to identify the DNS misconfiguration, but debugging was complicated because internal tooling also depended on the broken DNS.",
      prevention: "Never bypass change review for DNS changes — they are the highest blast-radius changes possible. Implement automated DNS validation. Keep emergency change processes that still require a second pair of eyes.",
    },
    keyLessons: [
      "DNS changes are the highest blast-radius changes in any system.",
      "Emergency processes that skip review are the most dangerous kind.",
      "When DNS is broken, your debugging tools are broken too — plan for that.",
    ],
    relatedNotes: [
      "01_fundamentals/networking_basics.md",
      "09_real_outages/facebook_bgp_outage_2021.md",
    ],
  },
  {
    id: "atlassian_2022",
    path: "09_real_outages/atlassian_deletion_2022.md",
    title: "Atlassian Site Deletion",
    year: 2022,
    duration: "Up to 2 weeks",
    impact: "~775 customer sites (Jira, Confluence, Opsgenie) deleted and inaccessible for days to weeks.",
    difficulty: "deep",
    preIncident: {
      summary: "Atlassian runs multi-tenant SaaS for Jira, Confluence, and Opsgenie. A decommissioning script is being run to remove a legacy app from customer sites. The script needs a site ID to know what to clean up.",
      components: [
        "Multi-tenant site provisioning system",
        "Decommissioning / cleanup scripts",
        "Backup and restore pipeline",
        "Customer sites (Jira, Confluence, Opsgenie instances)",
      ],
      normalState: "Each customer has a 'site' containing their Jira, Confluence, and Opsgenie instances. Scripts regularly clean up deprecated features.",
      triggerHint: "The script was given the wrong kind of identifier. Instead of deleting an app from a site, it did something much more destructive.",
    },
    reveal: {
      rootCause: "The decommissioning script was passed a site ID instead of an app ID. Instead of removing one app, it deleted entire customer sites — including all their Jira, Confluence, and Opsgenie data.",
      blastRadius: "~775 customer sites were completely deleted. Customers lost all access to their project management, documentation, and incident management tools. Some customers were down for up to 2 weeks.",
      recovery: "Up to 2 weeks. Atlassian had backups but no automated site-restore process. Each site had to be manually rebuilt from backup data. The restore pipeline hadn't been tested at this scale.",
      prevention: "Destructive operations need dry-run mode and soft-delete with a grace period. Validate input types (site ID vs app ID) before execution. Test backup restoration regularly and at scale.",
    },
    keyLessons: [
      "Untested backup restore is not a backup — it's a hope.",
      "Destructive scripts must validate their inputs and support dry-run.",
      "Two weeks of downtime destroys customer trust permanently.",
    ],
    relatedNotes: [
      "09_real_outages/gitlab_data_deletion_2017.md",
      "09_real_outages/amazon_s3_outage_2017.md",
    ],
  },
  {
    id: "reddit_2023",
    path: "09_real_outages/reddit_pi_day_2023.md",
    title: "Reddit Pi Day Outage",
    year: 2023,
    duration: "314 minutes",
    impact: "Reddit completely down — all subreddits, API, mobile apps inaccessible.",
    difficulty: "core",
    preIncident: {
      summary: "Reddit runs on Kubernetes. A scheduled Kubernetes version upgrade is being performed. The upgrade includes changes to networking components including Calico for BGP route reflection between nodes.",
      components: [
        "Kubernetes cluster",
        "Calico CNI with BGP route reflectors",
        "Reddit application pods",
        "Load balancers and ingress",
      ],
      normalState: "K8s nodes communicate via BGP routes managed by Calico route reflectors. Pod-to-pod networking depends on correct route propagation.",
      triggerHint: "The K8s upgrade changed something about how the networking layer initialized. It worked in staging but not in production.",
    },
    reveal: {
      rootCause: "The Kubernetes upgrade broke Calico route reflectors. BGP peering between nodes failed, meaning pods couldn't communicate across nodes. Staging didn't catch it because staging had different traffic patterns and node counts.",
      blastRadius: "Complete Reddit outage — no inter-node communication meant the application was effectively partitioned. Every service was isolated on its own node.",
      recovery: "314 minutes. The team initially tried to fix forward, then made the decision to restore the previous K8s version from backup under unknown blast radius — a high-stakes call.",
      prevention: "Test infrastructure upgrades with production-like traffic and scale, not just in staging. Implement canary upgrades (upgrade one node pool first). Have a tested rollback procedure for control-plane changes.",
    },
    keyLessons: [
      "Staging ≠ production for infrastructure changes — node count and traffic matter.",
      "K8s upgrades are among the riskiest changes you can make.",
      "The decision to restore from backup under uncertainty takes courage and practice.",
    ],
    relatedNotes: [
      "09_real_outages/roblox_73h_outage_2021.md",
      "01_fundamentals/networking_basics.md",
    ],
  },
  {
    id: "datadog_2023",
    path: "09_real_outages/datadog_outage_2023.md",
    title: "Datadog Systemd Outage",
    year: 2023,
    duration: "~5 hours",
    impact: "Datadog monitoring platform partially down — metrics, traces, and logs delayed or unavailable.",
    difficulty: "core",
    preIncident: {
      summary: "Datadog runs monitoring infrastructure across multiple cloud providers. OS-level security patches are managed by an automated system. A systemd security update is queued for deployment.",
      components: [
        "Datadog monitoring platform",
        "Automated OS patching system",
        "systemd (init system managing services)",
        "iptables / network rules on each host",
      ],
      normalState: "Security patches are auto-applied on a schedule. Each host runs systemd to manage services and iptables for network segmentation.",
      triggerHint: "The security patch was applied to all hosts, across all cloud providers, at the same time. It changed something fundamental about how services start.",
    },
    reveal: {
      rootCause: "A systemd security update was auto-applied simultaneously across all cloud providers. The update changed iptables/network rules, breaking inter-service communication. Because it was applied everywhere at once, there was no healthy baseline to compare against.",
      blastRadius: "Datadog's own monitoring infrastructure was affected — the monitoring platform couldn't monitor itself. Metrics ingestion, trace processing, and log pipelines all degraded simultaneously.",
      recovery: "~5 hours. Engineers identified the systemd update as the cause, rolled back the network rules, and staggered the re-application of the patch.",
      prevention: "Never auto-apply OS-level patches globally. Stagger across availability zones and cloud providers. The monitoring platform should have a separate, minimal monitoring stack that doesn't share the same patch schedule.",
    },
    keyLessons: [
      "Auto-patching without staggering is a global outage waiting to happen.",
      "Monitoring systems monitoring themselves is a circular dependency.",
      "OS-level changes are invisible to application-level canaries.",
    ],
    relatedNotes: [
      "09_real_outages/crowdstrike_global_outage_2024.md",
      "09_real_outages/cloudflare_regex_outage_2019.md",
    ],
  },
  {
    id: "unitedhealth_2024",
    path: "09_real_outages/unitedhealth_change_2024.md",
    title: "Change Healthcare Ransomware",
    year: 2024,
    duration: "Weeks",
    impact: "US-wide healthcare claims processing down. 100M+ patient records exposed. $872M+ in response costs.",
    difficulty: "deep",
    preIncident: {
      summary: "Change Healthcare processes ~15 billion healthcare claims annually — roughly 1 in 3 US patient records flow through their systems. They are a subsidiary of UnitedHealth Group. A remote access server exists in their network.",
      components: [
        "Claims processing platform",
        "Remote access server (Citrix)",
        "Network segmentation boundaries",
        "Pharmacy and hospital billing integrations",
      ],
      normalState: "Claims flow from providers (hospitals, pharmacies) through Change Healthcare to insurers. The platform processes billions of transactions annually.",
      triggerHint: "One server in the network didn't have multi-factor authentication enabled. Someone found it.",
    },
    reveal: {
      rootCause: "Attackers (ALPHV/BlackCat) gained access via a Citrix remote access server that lacked MFA. They moved laterally through the network, exfiltrated data, and deployed ransomware across the claims processing infrastructure.",
      blastRadius: "All US healthcare claims processing through Change Healthcare stopped. Pharmacies couldn't process prescriptions. Hospitals couldn't verify insurance. 100M+ patient records were exposed. The attack revealed a critical single-point-of-failure in US healthcare infrastructure.",
      recovery: "Weeks to restore core services. Months for full recovery. UnitedHealth paid $22M ransom. Total costs exceeded $872M in the first quarter alone.",
      prevention: "MFA on every remote access point — no exceptions. Network segmentation to limit lateral movement. No single company should be a SPOF for an entire industry. Regular security audits of acquired companies' infrastructure.",
    },
    keyLessons: [
      "One missing MFA = $872M+ incident. Security basics matter most.",
      "Industry-wide single points of failure create systemic risk.",
      "Acquired companies' security debt becomes your security debt instantly.",
    ],
    relatedNotes: [
      "09_real_outages/southwest_airlines_2022.md",
      "09_real_outages/tsb_bank_migration_2018.md",
    ],
  },
  {
    id: "openai_dns_2024",
    path: "09_real_outages/openai_dns_2024.md",
    title: "OpenAI K8s/DNS Outage",
    year: 2024,
    duration: "~4 hours",
    impact: "ChatGPT, API, and all OpenAI services globally down.",
    difficulty: "core",
    preIncident: {
      summary: "OpenAI runs on Kubernetes. A new telemetry service is being deployed to improve observability. The service makes API calls to the Kubernetes control plane to discover endpoints. DNS caching is used throughout the cluster.",
      components: [
        "Kubernetes API servers (control plane)",
        "CoreDNS (cluster DNS)",
        "New telemetry/observability service",
        "ChatGPT and API serving pods",
      ],
      normalState: "K8s API servers handle cluster management. DNS caches reduce load on CoreDNS. New services are deployed via standard K8s rollout.",
      triggerHint: "The new service was chattier with the K8s API than anyone expected. DNS caching hid the problem — until the caches expired.",
    },
    reveal: {
      rootCause: "The new telemetry service made far more K8s API calls than anticipated, overwhelming the API servers. DNS caching initially masked the overload. When DNS caches expired simultaneously (thundering herd), the flood of DNS queries plus API calls overwhelmed the control plane entirely.",
      blastRadius: "K8s control plane failure meant no pod scheduling, no service discovery, no health checks. All OpenAI services went down — ChatGPT, API, Sora, everything. The control plane couldn't recover because the telemetry service kept hammering it on restart.",
      recovery: "~4 hours. Engineers had to identify and kill the telemetry service, then gradually restore the control plane. Recovery was slow because the overloaded API servers couldn't process the kill commands quickly.",
      prevention: "Load-test new services against the control plane, not just the data plane. Rate-limit K8s API access per service. Stagger DNS TTL expiry to prevent thundering herd. New services should canary to a tiny fraction of the cluster first.",
    },
    keyLessons: [
      "The K8s control plane is a shared resource — one bad service can kill everything.",
      "DNS caching can mask problems and then amplify them via thundering herd.",
      "Load-test against infrastructure, not just application endpoints.",
    ],
    relatedNotes: [
      "09_real_outages/roblox_73h_outage_2021.md",
      "01_fundamentals/networking_basics.md",
    ],
  },
];

export function getReplay(id) {
  return OUTAGE_REPLAYS.find((r) => r.id === id) || null;
}

export function getReplayByPath(path) {
  return OUTAGE_REPLAYS.find((r) => r.path === path) || null;
}
