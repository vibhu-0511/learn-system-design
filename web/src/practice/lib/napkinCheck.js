const SUFFIX = { k: 1e3, m: 1e6, b: 1e9, t: 1e12 };

export function parseEstimate(input) {
  if (typeof input === "number") return Number.isFinite(input) ? input : NaN;
  const s = String(input).trim().toLowerCase().replace(/,/g, "");
  const m = s.match(/^(-?\d+(?:\.\d+)?)\s*([kmbt])?/);
  if (!m || m[1] === undefined || m.index !== 0 || !/^\d|^-/.test(s)) return NaN;
  const base = parseFloat(m[1]);
  const mult = m[2] ? SUFFIX[m[2]] : 1;
  return base * mult;
}

export function gradeAnswer(input, expected) {
  const value = parseEstimate(input);
  if (!Number.isFinite(value) || value <= 0 || expected <= 0) {
    return { grade: "invalid", value: NaN, ratio: NaN };
  }
  const ratio = Math.max(value / expected, expected / value);
  let grade = "off";
  if (ratio <= 2) grade = "spot-on";
  else if (ratio <= 10) grade = "close";
  return { grade, value, ratio };
}
