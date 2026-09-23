// Sims live in course/<track>/<id>_<slug>/sim.mjs, above web/. Each one is its own
// lazy chunk, so a lesson only downloads its own simulator.
const sims = import.meta.glob("../../../course/*/*/sim.mjs");

const byId = Object.fromEntries(
  Object.entries(sims).map(([path, load]) => [path.match(/\/([a-z]\d{2})_[^/]+\/sim\.mjs$/)[1], load]),
);

export async function loadSim(id) {
  return byId[id] ? byId[id]() : null;
}

// Clamp saved slider values into range; anything missing or bad falls back to the default.
export function sanitizeParams(stored, PARAMS) {
  return Object.fromEntries(
    Object.entries(PARAMS).map(([key, p]) => {
      const v = stored?.[key];
      return [key, Number.isFinite(v) && v >= p.min && v <= p.max ? v : p.default];
    }),
  );
}
