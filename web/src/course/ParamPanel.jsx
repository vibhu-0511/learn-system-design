// One slider per entry in a sim's PARAMS.
export default function ParamPanel({ params, values, onChange, onReset }) {
  return (
    <div className="params">
      {Object.entries(params).map(([key, p]) => {
        const id = `param-${key}`;
        return (
          <label key={key} className="param" htmlFor={id}>
            <span>{p.label}</span>
            <input id={id} type="range" min={p.min} max={p.max} step={p.step} value={values[key]} onChange={(e) => onChange(key, Number(e.target.value))} />
            <output htmlFor={id} className="mono">
              {values[key].toLocaleString("en-US")}
              {p.unit ? ` ${p.unit}` : ""}
            </output>
          </label>
        );
      })}
      <button className="chip" onClick={onReset}>
        Reset to defaults
      </button>
    </div>
  );
}
