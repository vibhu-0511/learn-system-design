// t01 sim: a decision calculator for a network partition during a flash sale.
// Assumptions: the partition lasts `partitionMin`; orders arrive at `ordersPerMin` with an
// average basket of `basketUsd` (2,000 x $50 x 5 min = the vault note's $500K); a
// consistency-first (CP) site refuses orders until the partition heals; an availability-first (AP)
// site keeps taking them, and the share `lowStockPct` of orders that hit an item with very little
// stock are oversold (two buyers get the last item); each oversold order costs
// `inconsistencyCostUsd` to fix (refund, apology, support); a hybrid site refuses only the
// low-stock orders.
// Runs in Node (node sim.mjs --inconsistencyCostUsd=5000) and in the browser.

export const PARAMS = {
  partitionMin: { label: "Partition length", unit: "min", min: 1, max: 60, step: 1, default: 5 },
  ordersPerMin: { label: "Orders", unit: "per min", min: 100, max: 10000, step: 100, default: 2000 },
  basketUsd: { label: "Average basket", unit: "$", min: 5, max: 500, step: 5, default: 50 },
  lowStockPct: { label: "Orders on nearly sold-out items", unit: "%", min: 0.5, max: 50, step: 0.5, default: 2 },
  inconsistencyCostUsd: { label: "Cost of one oversold order", unit: "$", min: 1, max: 20000, step: 1, default: 60 },
};

function outcome({ lossUsd, downMin, wrongOrders }) {
  return { totalLossUsd: Math.round(lossUsd), unavailableMin: downMin, inconsistentOrders: Math.round(wrongOrders) };
}

export function run({ partitionMin, ordersPerMin, basketUsd, lowStockPct, inconsistencyCostUsd }) {
  const orders = ordersPerMin * partitionMin;
  const revenue = orders * basketUsd;
  const atRisk = orders * (lowStockPct / 100);
  const breakEven = basketUsd / (lowStockPct / 100);

  const none = { ...outcome({ lossUsd: 0, downMin: 0, wrongOrders: 0 }) };
  const cp = outcome({ lossUsd: revenue, downMin: partitionMin, wrongOrders: 0 });
  const ap = outcome({ lossUsd: atRisk * inconsistencyCostUsd, downMin: 0, wrongOrders: atRisk });
  const hybrid = outcome({ lossUsd: atRisk * basketUsd, downMin: 0, wrongOrders: 0 });

  const winner = cp.totalLossUsd < ap.totalLossUsd ? "consistency" : "availability";
  const fmt = (n) => "$" + n.toLocaleString("en-US");

  return {
    frames: [
      {
        beat: "constraints",
        title: `A ${partitionMin} minute partition during a flash sale`,
        note: `${orders.toLocaleString("en-US")} orders (${fmt(revenue)}) arrive while the replicas cannot talk to the primary, and ${lowStockPct}% of them are for items that are almost sold out. Break-even is ${fmt(breakEven)} per oversold order.`,
        metrics: none,
      },
      {
        beat: "component",
        title: "Choose consistency: refuse orders until it heals",
        note: `No order is ever oversold, but the site is down for ${cp.unavailableMin} minutes and the lost sales are ${fmt(cp.totalLossUsd)}.`,
        metrics: cp,
      },
      {
        beat: "failure",
        title: "Choose availability: keep selling",
        note: `${ap.inconsistentOrders.toLocaleString("en-US")} orders are oversold at ${fmt(inconsistencyCostUsd)} each: ${fmt(ap.totalLossUsd)}. With these numbers, ${winner} is cheaper. Above ${fmt(breakEven)} per oversold order consistency wins, as with money movement or safety; below it availability wins.`,
        metrics: ap,
      },
      {
        beat: "tradeoff",
        title: "Split by data, not by system",
        note: `Refuse only the ${lowStockPct}% of orders that could oversell, and sell everything else: ${fmt(hybrid.totalLossUsd)} lost, no oversells, and the site stays up. It costs a way to tell which requests need the strong answer.`,
        metrics: hybrid,
      },
    ],
    summary: { breakEvenUsd: Math.round(breakEven), cheaper: winner },
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
