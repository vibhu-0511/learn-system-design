import { Sprout, Target, Flame } from "lucide-react";

const OPTIONS = [
  {
    id: "beginner",
    title: "Beginner",
    Icon: Sprout,
    blurb:
      "I'm new to system design. I've heard of databases and APIs, but I haven't built or designed real systems yet.",
    next: "Starts you on a 14-lesson path through fundamentals.",
  },
  {
    id: "practicing",
    title: "Practicing",
    Icon: Target,
    blurb:
      "I've worked with backends. I know what a load balancer, cache, and queue do. I want to get sharp at designing them under pressure.",
    next: "Drops you straight into daily drills, outages, and skill practice.",
  },
  {
    id: "advanced",
    title: "Advanced",
    Icon: Flame,
    blurb:
      "I've designed and shipped real systems. I want a sparring partner — case practice, bug-finding, founder-ready proposals.",
    next: "Same daily loop as Practicing, with the drill scaffolds collapsed.",
  },
];

export function LevelPicker({ onPick }) {
  return (
    <div className="level-picker-overlay" role="dialog" aria-modal="true">
      <div className="level-picker-card panel">
        <p className="eyebrow">Welcome</p>
        <h1>Where are you in system design?</h1>
        <p className="muted">
          Pick the closest. You can change this any time from the Today tab.
        </p>
        <div className="level-grid">
          {OPTIONS.map(({ id, title, Icon, blurb, next }) => (
            <button
              key={id}
              className={`level-card level-${id}`}
              onClick={() => onPick(id)}
            >
              <Icon size={22} />
              <h3>{title}</h3>
              <p>{blurb}</p>
              <small>{next}</small>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
