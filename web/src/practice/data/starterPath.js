// Beginner starter path. Fourteen lessons in order, each tied to one note in
// the indexed vault. Beginners progress lesson-by-lesson at their own pace
// (no calendar pressure). After lesson 14, level auto-promotes to "practicing"
// and the regular daily-loop Today tab takes over.
//
// Each lesson is small on purpose: read one note, answer two reflection
// questions, click "Mark complete." Should fit in 10–15 minutes.

export const STARTER_LESSONS = [
  {
    number: 1,
    id: "client-server",
    title: "Client-Server Model",
    notePath: "01_fundamentals/client_server_architecture.md",
    whyThisMatters:
      "Almost every system you'll ever design starts here. Knowing who asks and who answers makes everything downstream easier.",
    checkQuestions: [
      "In your own words: what's the difference between a client and a server?",
      "Name three apps you use daily. Identify the client and the server in each.",
    ],
  },
  {
    number: 2,
    id: "networking",
    title: "Networking basics",
    notePath: "01_fundamentals/networking_basics.md",
    whyThisMatters:
      "When a button is clicked, a request travels through the network. Knowing the hops helps you reason about latency, failures, and timeouts.",
    checkQuestions: [
      "Roughly, what's the difference between TCP and UDP?",
      "Why do most APIs use HTTPS instead of HTTP?",
    ],
  },
  {
    number: 3,
    id: "apis",
    title: "API design",
    notePath: "01_fundamentals/api_design.md",
    whyThisMatters:
      "APIs are the contract between clients and servers. Sloppy API design leaks into every problem you'll solve later — caching, retries, errors, evolution.",
    checkQuestions: [
      "What's the high-level difference between REST and gRPC?",
      "Name two reasons you'd use POST instead of GET.",
    ],
  },
  {
    number: 4,
    id: "latency-throughput",
    title: "Latency & throughput",
    notePath: "01_fundamentals/latency_and_throughput.md",
    whyThisMatters:
      "These are the two numbers you'll argue about in every design review. They drive almost every decision.",
    checkQuestions: [
      "If a single request takes 200 ms, is that latency or throughput?",
      "Why is p99 latency more useful than average latency?",
    ],
  },
  {
    number: 5,
    id: "scalability",
    title: "Scalability basics",
    notePath: "01_fundamentals/scalability.md",
    whyThisMatters:
      "Small systems stay simple; big systems force trade-offs. Knowing when to scale (and when not to) is the architect's first real judgment call.",
    checkQuestions: [
      "What's the difference between vertical and horizontal scaling?",
      "Name one risk of scaling too early.",
    ],
  },
  {
    number: 6,
    id: "load-balancers",
    title: "Load balancers",
    notePath: "02_building_blocks/load_balancers.md",
    whyThisMatters:
      "Once you have more than one server, you need a traffic cop. Load balancers are the most common middle box in any web system.",
    checkQuestions: [
      "Name two ways a load balancer decides where to send traffic.",
      "Why does the load balancer itself need to be highly available?",
    ],
  },
  {
    number: 7,
    id: "sql-databases",
    title: "SQL databases",
    notePath: "02_building_blocks/databases_sql.md",
    whyThisMatters:
      "SQL stores are the default home for structured, related data. Most systems start with one. Knowing what they're good at — and what they aren't — saves bad decisions later.",
    checkQuestions: [
      "What does ACID stand for? Pick one letter and describe it in your own words.",
      "Why is denormalization sometimes worth the cost?",
    ],
  },
  {
    number: 8,
    id: "caching",
    title: "Caching",
    notePath: "02_building_blocks/caching.md",
    whyThisMatters:
      "A cache is the simplest and most dangerous performance fix. It can make systems 10× faster — or quietly serve wrong data to users.",
    checkQuestions: [
      "What problem does caching solve?",
      "Name one risk that comes with caching.",
    ],
  },
  {
    number: 9,
    id: "queues",
    title: "Message queues",
    notePath: "02_building_blocks/message_queues.md",
    whyThisMatters:
      "Queues turn \"do this now\" into \"do this later, safely.\" They're how real systems handle spikes and decouple services that don't need to wait on each other.",
    checkQuestions: [
      "Why would you put a notification email behind a queue instead of sending it directly?",
      "What is back pressure, in plain language?",
    ],
  },
  {
    number: 10,
    id: "cap",
    title: "CAP theorem",
    notePath: "01_fundamentals/cap_theorem.md",
    whyThisMatters:
      "The fundamental trade-off of distributed systems. If you only remember one theorem, this is it.",
    checkQuestions: [
      "What do C, A, and P stand for?",
      "During a network partition, what trade-off must you make?",
    ],
  },
  {
    number: 11,
    id: "acid-base",
    title: "ACID vs BASE",
    notePath: "01_fundamentals/acid_vs_base.md",
    whyThisMatters:
      "Different data needs different guarantees. Money and inventory need ACID; like counts and feeds can live with BASE. Mixing them up is how production breaks.",
    checkQuestions: [
      "Pick a workflow at a company you know (Amazon orders, Instagram likes, etc). Should it be ACID or BASE? Why?",
      "What does \"eventually consistent\" mean in plain words?",
    ],
  },
  {
    number: 12,
    id: "idempotency",
    title: "Idempotency",
    notePath: "03_design_patterns/idempotency.md",
    whyThisMatters:
      "Networks fail. Clients retry. Without idempotency, retries create duplicate orders, double charges, and angry users. This single pattern prevents a huge class of production bugs.",
    checkQuestions: [
      "Why are GET requests naturally idempotent but POST often isn't?",
      "How does Stripe's Idempotency-Key header solve duplicate payments?",
    ],
  },
  {
    number: 13,
    id: "observability",
    title: "Monitoring & observability",
    notePath: "02_building_blocks/monitoring_and_logging.md",
    whyThisMatters:
      "A system without observability is a black box. You can't fix what you can't see. This is the difference between a 5-minute incident and a 5-hour one.",
    checkQuestions: [
      "What's the difference between logs, metrics, and traces?",
      "Why is alerting on CPU usage often a poor signal?",
    ],
  },
  {
    number: 14,
    id: "hld-thinking",
    title: "How to think about HLD",
    notePath: "10_hld/hld_thinking_system.md",
    whyThisMatters:
      "This wraps everything together. Constraints first, components second, failure modes always. After this lesson, the drills on the Skills tab will make sense.",
    checkQuestions: [
      "Before you draw any boxes, what should you state first?",
      "Pick one component you've learned about (cache, queue, load balancer, DB). What specific problem does it remove?",
    ],
  },
];

export const TOTAL_LESSONS = STARTER_LESSONS.length;

export function getLesson(number) {
  return STARTER_LESSONS.find((l) => l.number === number) ?? null;
}

export function nextLesson(completedLessons) {
  const set = new Set(completedLessons);
  for (const lesson of STARTER_LESSONS) {
    if (!set.has(lesson.number)) return lesson;
  }
  return null;
}

export function isPathComplete(completedLessons) {
  return completedLessons.length >= TOTAL_LESSONS;
}
