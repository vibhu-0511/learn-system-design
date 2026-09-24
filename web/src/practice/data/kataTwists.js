export const KATA_TWISTS = [
  { id: "budget-halved", label: "Budget halved", description: "Finance cut infra spend 50%. Cost ceiling drops one tier; cloud bill is now a board-level topic.", mutate: (c) => ({ ...c, cost: "low" }) },
  { id: "two-engineers", label: "Team of two", description: "Layoffs. Two engineers run this system including on-call.", mutate: (c) => ({ ...c, team: "2" }) },
  { id: "eu-residency", label: "EU data residency", description: "Legal: EU user data must stay in the EU. You now have at least two regions whether you like it or not.", mutate: (c) => c },
  { id: "viral-100x", label: "Going viral", description: "A celebrity endorsement is scheduled in 6 weeks. Expect 100× read traffic for 48 hours, then 5× permanently.", mutate: (c) => ({ ...c, growth: "100x" }) },
  { id: "five-nines", label: "Enterprise SLA", description: "Biggest customer signed a 99.99% availability SLA with penalties. Single points of failure are now contract breaches.", mutate: (c) => ({ ...c, durability: "high" }) },
  { id: "latency-halved", label: "Latency SLO halved", description: "Product demands p95 cut in half after losing a deal to a faster competitor.", mutate: (c) => ({ ...c, latencyP95: String(Math.max(25, Math.round((parseInt(c.latencyP95 || "300", 10) || 300) / 2))) }) },
];

export function pickTwist(seed) {
  return KATA_TWISTS[Math.abs(seed) % KATA_TWISTS.length];
}
