// m02 sim: a time budget across the four steps of a system design interview.
// Assumptions: the vault plan is requirements 5 min, estimation 5 min, high-level design 15 min, then
// a deep dive, with the last 2 minutes for a wrap-up. Whatever is left after the first three steps
// and the wrap-up is the deep dive, which is where the interviewer's follow-ups land. The vault says
// to cap questions at 3-4 minutes, so the fixed plan below caps requirements at 4 and estimation at 5.
// Runs in Node (node sim.mjs --reqMin=6) and in the browser.

export const PARAMS = {
  totalMin: { label: "Interview length", unit: "min", min: 30, max: 60, step: 5, default: 45 },
  reqMin: { label: "Time you spend on requirements", unit: "min", min: 1, max: 20, step: 1, default: 12 },
  estMin: { label: "Time you spend on estimation", unit: "min", min: 1, max: 20, step: 1, default: 8 },
  hldMin: { label: "Time you spend on high-level design", unit: "min", min: 5, max: 30, step: 1, default: 15 },
};

const WRAP_MIN = 2;
const PLAN = { reqMin: 5, estMin: 5, hldMin: 15 };
const REQ_CAP = 4;
const EST_CAP = 5;

export function run(params) {
  const { totalMin, reqMin, estMin, hldMin } = params;
  const deepFor = (r, e, h) => Math.max(0, totalMin - r - e - h - WRAP_MIN);
  const pctOf = (deep) => Math.round((deep / totalMin) * 100);
  const build = (r, e, h) => {
    const deep = deepFor(r, e, h);
    return { reqMin: r, estMin: e, hldMin: h, deepMin: deep, deepPct: pctOf(deep) };
  };

  const plan = build(PLAN.reqMin, PLAN.estMin, PLAN.hldMin);
  const you = build(reqMin, estMin, hldMin);
  const capped = build(Math.min(reqMin, REQ_CAP), Math.min(estMin, EST_CAP), hldMin);
  const lost = plan.deepMin - you.deepMin;

  return {
    frames: [
      {
        beat: "constraints",
        title: `${totalMin} minutes, four steps`,
        note: `Requirements, estimation, high-level design, deep dive, plus ${WRAP_MIN} minutes to wrap up. The design is judged on breaking down the problem, making trade-offs and handling failure, and most of that shows in the deep dive. Time is the only fixed resource.`,
        metrics: { reqMin: 0, estMin: 0, hldMin: 0, deepMin: 0, deepPct: 0 },
      },
      {
        beat: "component",
        title: "The plan: 5 / 5 / 15, then the deep dive",
        note: `Requirements ${plan.reqMin} min, estimation ${plan.estMin} min, high-level design ${plan.hldMin} min. That leaves ${plan.deepMin} minutes (${plan.deepPct}%) for the deep dive after the ${WRAP_MIN}-minute wrap-up.`,
        metrics: plan,
      },
      {
        beat: "failure",
        title: `Spending ${reqMin} / ${estMin} / ${hldMin} squeezes the deep dive`,
        note: `Questions and arithmetic take ${reqMin + estMin} minutes instead of ${plan.reqMin + plan.estMin}. The deep dive shrinks to ${you.deepMin} minutes (${you.deepPct}%), ${lost > 0 ? `${lost} fewer than the plan` : "no smaller than the plan"}. ${you.deepMin === 0 ? "You run out of time before the interviewer's follow-ups start." : "The follow-ups get cut short."}`,
        metrics: you,
      },
      {
        beat: "tradeoff",
        title: `Cap requirements at ${REQ_CAP} and estimation at ${EST_CAP}, state assumptions`,
        note: `Say "I'll assume X, tell me if that's off" and move on. Capping the first two steps gives the deep dive ${capped.deepMin} minutes (${capped.deepPct}%). The cost is real: you commit to assumptions the interviewer might have wanted to change, so state them out loud.`,
        metrics: capped,
      },
    ],
    summary: { deepMin: capped.deepMin, lostMin: lost },
  };
}

// CLI: only when this file is the entry point, and safe where `process` does not exist.
const entry = typeof process !== "undefined" ? process.argv?.[1] : undefined;
if (entry && decodeURIComponent(import.meta.url).endsWith(entry.replace(/\\/g, "/"))) {
  const params = Object.fromEntries(Object.entries(PARAMS).map(([k, p]) => [k, p.default]));
  for (const arg of process.argv.slice(2)) {
    const [key, value] = arg.replace(/^--/, "").split("=");
    if (key in params) params[key] = Number(value);
  }
  console.log("params:", JSON.stringify(params));
  for (const [i, f] of run(params).frames.entries()) {
    console.log(`\n${i + 1}. [${f.beat}] ${f.title}\n   ${f.note}`);
    console.log("   " + Object.entries(f.metrics).map(([k, v]) => `${k}=${v}`).join("  "));
  }
}
