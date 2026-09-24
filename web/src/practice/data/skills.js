// Ten architect behaviors. Each is a *skill* you practice — not a course you
// finish. Skills surface in three places:
//   - SkillsView (deep dive: behavior, cue, drill, bug scenario, readiness)
//   - TodayView (one skill is highlighted per day)
//   - Workspaces (P4) and Calibration (P12) score against these
//
// Drills and bug scenarios are reused from existing phase data where the
// fit is good; otherwise they're written inline. Source notes are vault
// paths resolved through getNote() — missing ones render as disabled.

import { LEARNING_PHASES } from "./learning.js";

function fromPhase(id) {
  return LEARNING_PHASES.find((p) => p.id === id) || null;
}

const phase0 = fromPhase("phase-0");
const phase1 = fromPhase("phase-1");
const phase2 = fromPhase("phase-2");
const phase3 = fromPhase("phase-3");
const phase4 = fromPhase("phase-4");
const phase5 = fromPhase("phase-5");
const phase7 = fromPhase("phase-7");
const phase8 = fromPhase("phase-8");

export const SKILLS = [
  {
    id: "constraints-first",
    number: 1,
    name: "Reads constraints first",
    short: "Constraints",
    accent: "#2f68d8",
    behavior:
      "Refuses to draw components until QPS, latency, consistency, durability, cost, and team size are stated.",
    cue:
      "First move on any problem: what are we optimizing for, at what scale, with what trade-offs? If you can't say, you can't design.",
    sourceNotes: [
      "10_hld/hld_thinking_system.md",
      "10_hld/problem_taxonomy_hld.md",
      "07_interview_framework/the_four_step_framework.md",
      "07_interview_framework/requirements_gathering.md",
    ],
    drill: phase0.caseExercise,
    bugScenario: phase0.bugScenario,
    readiness: phase0.readiness,
  },
  {
    id: "defends-components",
    number: 2,
    name: "Defends every component",
    short: "Defend boxes",
    accent: "#0f8b6f",
    behavior:
      "Each component on the diagram exists because of a named bottleneck or risk. No template thinking.",
    cue:
      "Every box answers \"what does this remove?\" If the reason is \"because everyone uses it,\" it isn't a reason.",
    sourceNotes: [
      "02_building_blocks/load_balancers.md",
      "02_building_blocks/caching.md",
      "02_building_blocks/message_queues.md",
      "02_building_blocks/databases_sql.md",
      "02_building_blocks/databases_nosql.md",
      "02_building_blocks/api_gateway.md",
    ],
    drill: phase1.caseExercise,
    bugScenario: phase1.bugScenario,
    readiness: phase1.readiness,
  },
  {
    id: "trade-offs",
    number: 3,
    name: "Speaks in trade-offs, not tools",
    short: "Trade-offs",
    accent: "#7c3aed",
    behavior:
      "Never \"Postgres\"; always \"single SQL store with read replicas because writes are 200/s and reads are 20K/s.\"",
    cue:
      "For any choice, say what you give up. If the answer is a tool, your reasoning is upstream of where it should be.",
    sourceNotes: [
      "06_trade_offs/consistency_vs_availability.md",
      "06_trade_offs/sql_vs_nosql.md",
      "06_trade_offs/latency_vs_throughput.md",
      "06_trade_offs/read_vs_write_optimization.md",
      "06_trade_offs/cost_vs_performance.md",
      "06_trade_offs/simplicity_vs_scalability.md",
      "10_hld/architecture_decision_records.md",
    ],
    drill: {
      title: "Defend a SQL vs NoSQL choice",
      prompt:
        "Pick one workload from your work or notes (orders, feed, analytics, search). Defend SQL or NoSQL with constraints, not preferences.",
      steps: [
        {
          id: "constraints",
          title: "State the constraints",
          question:
            "What are the read/write ratio, item size, query patterns, transaction needs, and team experience?",
          hint:
            "Without numbers, this becomes opinion vs opinion. Numbers force a real comparison.",
          reference:
            "Example: orders are 80/20 read/write, ~2 KB rows, joins across user/order/payment, transactions required, team knows SQL well — SQL wins.",
        },
        {
          id: "alternative",
          title: "Steelman the other side",
          question: "When would the opposite choice win? Name the specific shift in workload that flips your decision.",
          hint:
            "If you can't articulate the alternative, you don't understand the trade-off.",
          reference:
            "If item size jumps to 50 KB JSON with no joins and 100K writes/s with eventual consistency tolerated, NoSQL becomes the right answer.",
        },
      ],
    },
    bugScenario: {
      title: "Tool-first reasoning",
      flawed:
        "We should use Cassandra because it scales horizontally. Also Kafka, because everyone uses Kafka.",
      bugs: [
        "No workload stated",
        "No alternative considered",
        "No trade-off named",
        "Tool worship",
      ],
      fix:
        "Lead with workload (QPS, item size, query pattern, consistency need). Pick the tool that fits. State what you give up.",
    },
    readiness: [
      "I can articulate at least three trade-offs in any design.",
      "I can name the workload shift that would flip each decision.",
      "I never name a tool before the constraint that forces it.",
    ],
  },
  {
    id: "napkin-math",
    number: 4,
    name: "Does napkin math fast",
    short: "Napkin math",
    accent: "#d99a21",
    behavior:
      "QPS, storage, bandwidth, cost — within two minutes, in your head.",
    cue:
      "Ratios beat absolute numbers. 80/20 read/write, 10× peak, 1 KB payload, 30-day retention. Every designer should have these reflexes.",
    sourceNotes: [
      "10_hld/capacity_planning.md",
      "07_interview_framework/estimation_cheat_sheet.md",
      "01_fundamentals/latency_and_throughput.md",
      "01_fundamentals/scalability.md",
    ],
    drill: {
      title: "Estimate a URL shortener at scale",
      prompt:
        "100M URLs created total. 500M redirects per day. 5-year retention. Compute storage, redirect QPS at peak, and bandwidth.",
      steps: [
        {
          id: "qps",
          title: "Redirect QPS",
          question:
            "What is the average and peak redirect QPS? Show your math.",
          hint:
            "Average = 500M / 86,400. Peak ≈ 3× average is a typical assumption for diurnal traffic.",
          reference:
            "Average ≈ 5,800 QPS. Peak ≈ 17K QPS. This is read-heavy and latency-sensitive — cache the short→long mapping.",
        },
        {
          id: "storage",
          title: "Storage and bandwidth",
          question:
            "How much storage for the URL table? How much daily egress for redirects?",
          hint:
            "Per row: short code (7 B) + long URL (avg 100 B) + metadata (50 B) ≈ 200 B. Egress per redirect ≈ 200 B response.",
          reference:
            "Storage ≈ 100M × 200 B = 20 GB (small, fits in one node). Egress ≈ 500M × 200 B = 100 GB/day. Storage is trivial; QPS and cache hit rate dominate the design.",
        },
      ],
    },
    bugScenario: {
      title: "No math, hand-wavy scaling claim",
      flawed:
        "We need to handle massive scale, so let's start with sharded Cassandra, Kafka, and Kubernetes.",
      bugs: [
        "No QPS estimate",
        "No storage estimate",
        "Complexity chosen before need is proven",
        "Operational cost not considered",
      ],
      fix:
        "Estimate QPS, storage, and bandwidth before component selection. Start at the scale you have, not the scale you imagine.",
    },
    readiness: [
      "I can estimate QPS, storage, bandwidth without lookups.",
      "I know my product's read/write ratio and peak factor.",
      "I refuse to pick infrastructure before the math is on paper.",
    ],
  },
  {
    id: "failure-first",
    number: 5,
    name: "Thinks failure-first",
    short: "Failure-first",
    accent: "#c2412d",
    behavior:
      "For every component answers timeout, retry, breaker, fallback, alert, and user-visible degraded mode without prompting.",
    cue:
      "Before drawing happy paths, name the worst that can happen for each dependency. The 09_real_outages folder is full of designs that worked until they didn't.",
    sourceNotes: [
      "10_hld/hld_review_checklist.md",
      "03_design_patterns/circuit_breaker.md",
      "03_design_patterns/back_pressure.md",
      "03_design_patterns/retry_with_backoff.md",
      "02_building_blocks/monitoring_and_logging.md",
      "09_real_outages/aws_us_east_1_outage_2021.md",
      "09_real_outages/cloudflare_regex_outage_2019.md",
    ],
    drill: phase5.caseExercise,
    bugScenario: phase5.bugScenario,
    readiness: phase5.readiness,
  },
  {
    id: "patterns",
    number: 6,
    name: "Recognizes patterns across domains",
    short: "Patterns",
    accent: "#0f8b6f",
    behavior:
      "Sees backpressure, leader election, idempotency, CDC, fanout where they hide.",
    cue:
      "Most \"new problems\" are old patterns wearing different clothes. The 03_design_patterns folder is a reference catalogue — keep referencing it.",
    sourceNotes: [
      "03_design_patterns/idempotency.md",
      "03_design_patterns/saga_pattern.md",
      "03_design_patterns/pub_sub.md",
      "03_design_patterns/cqrs.md",
      "03_design_patterns/event_sourcing.md",
      "03_design_patterns/leader_election.md",
      "03_design_patterns/consistent_hashing.md",
      "03_design_patterns/sharding.md",
    ],
    drill: phase4.caseExercise,
    bugScenario: phase4.bugScenario,
    readiness: phase4.readiness,
  },
  {
    id: "phases-complexity",
    number: 7,
    name: "Phases complexity",
    short: "Phase v1/10x/100x",
    accent: "#2f68d8",
    behavior:
      "Knows what belongs in v1 vs 10× vs 100× and refuses to add the 100× thing on day one.",
    cue:
      "Earn each new component. Add when measured, not when imagined. The 04_system_evolutions folder shows real progression paths.",
    sourceNotes: [
      "04_system_evolutions/scaling_a_web_app.md",
      "04_system_evolutions/scaling_a_database.md",
      "04_system_evolutions/scaling_a_chat_system.md",
      "04_system_evolutions/from_monolith_to_microservices.md",
      "10_hld/capacity_planning.md",
    ],
    drill: phase3.caseExercise,
    bugScenario: phase3.bugScenario,
    readiness: phase3.readiness,
  },
  {
    id: "communicates",
    number: 8,
    name: "Communicates to non-engineers",
    short: "Communicate",
    accent: "#7c3aed",
    behavior:
      "Writes ADRs and proposals that connect technical choice to user experience, revenue, support load, or engineering speed.",
    cue:
      "Founders care about outcomes, not architecture. \"This change reduces duplicate orders by ~3% during sales\" beats \"this change adds idempotency keys.\"",
    sourceNotes: [
      "10_hld/architecture_decision_records.md",
      "10_hld/hld_review_checklist.md",
      "07_interview_framework/signal_moments.md",
    ],
    drill: phase8.caseExercise,
    bugScenario: phase8.bugScenario,
    readiness: phase8.readiness,
  },
  {
    id: "calibrated",
    number: 9,
    name: "Stays calibrated",
    short: "Calibrated",
    accent: "#65717f",
    behavior:
      "Treats own (and any LLM's) confident claims as drafts; flags absolutes; revises beliefs against real outages.",
    cue:
      "143 of your own notes carry reliability flags right now. \"Always\" and \"never\" are red flags. Confident claims need evidence.",
    sourceNotes: [
      "09_real_outages/knight_capital_2012.md",
      "09_real_outages/gitlab_data_deletion_2017.md",
      "09_real_outages/tsb_bank_migration_2018.md",
      "07_interview_framework/common_red_flags.md",
    ],
    drill: {
      title: "Calibrate a flagged note",
      prompt:
        "Open a note flagged absolute-language. Mark each absolute claim, then find a real outage or design that violates it.",
      steps: [
        {
          id: "scan",
          title: "Find the absolutes",
          question:
            "Highlight every always / never / must / cannot / will not / no system / every system in the note.",
          hint: "These are the words your future self should re-read with skepticism.",
          reference:
            "Most absolute claims are accurate ~80% of the time, but the remaining 20% breaks production. The outage folder is full of those 20%.",
        },
        {
          id: "counterexample",
          title: "Find the counterexample",
          question:
            "Pick one absolute. Find one real outage or company case where it didn't hold.",
          hint:
            "Ex: \"Caches always speed things up\" → look at cache stampedes during cold starts.",
          reference:
            "Calibration is the willingness to update. If you can't find a counterexample, the claim might be safe; more often, you haven't looked hard enough.",
        },
      ],
    },
    bugScenario: {
      title: "Memorized template applied to wrong context",
      flawed:
        "We should always have a load balancer, cache, queue, microservices, and Kafka. That's how all systems work.",
      bugs: [
        "Absolute claim about architecture",
        "Ignores team size, scale, product needs",
        "No evidence for the assertion",
        "Treats one design as universal",
      ],
      fix:
        "Replace \"always\" with \"often, when\". Name the conditions under which the claim holds, and the conditions under which it doesn't.",
    },
    readiness: [
      "I revise claims when evidence contradicts them.",
      "I flag my own absolute language before others do.",
      "I cross-check confident notes against the outage library.",
    ],
  },
  {
    id: "loop",
    number: 10,
    name: "Practices on a loop",
    short: "Daily loop",
    accent: "#d99a21",
    behavior:
      "Reads one outage, designs one system, defends one trade-off — every day. Architects don't graduate; they keep practicing.",
    cue:
      "Compound interest beats one-time effort. The Today tab exists for this. Streaks aren't gamification; they're proof you didn't skip.",
    sourceNotes: [
      "07_interview_framework/the_four_step_framework.md",
      "10_hld/hld_thinking_system.md",
    ],
    drill: {
      title: "Use the Today tab",
      prompt:
        "Open Today. Read the outage. Skim the term. Skim the skill of the day. That's it. Do it tomorrow.",
      steps: [
        {
          id: "rep",
          title: "One small rep",
          question:
            "Did you open Today and complete one card today? (Yes / No.)",
          hint: "Habit > intensity. Five minutes daily beats one Saturday burst.",
          reference: "Streak counter tracks this. Don't break the chain.",
        },
      ],
    },
    bugScenario: {
      title: "Saving practice for a special occasion",
      flawed:
        "I'll start designing seriously when I have a free weekend / when this project ends / when I feel ready.",
      bugs: [
        "Practice deferred indefinitely",
        "No compounding",
        "Skill atrophies between bursts",
      ],
      fix:
        "Five minutes today beats two hours next week. Open the app on your worst day; that's when the streak is most valuable.",
    },
    readiness: [
      "I have a streak greater than 14 days.",
      "I touched all 10 skills in the past month.",
      "I can show recent workspaces, not just intentions.",
    ],
  },
];

export function getSkill(id) {
  return SKILLS.find((s) => s.id === id) || null;
}
