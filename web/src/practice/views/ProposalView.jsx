import { useMemo } from "react";
import { analyzeBrief, buildProposal } from "../lib/reviewEngine.js";

export function ProposalView({ reviewText, systemName }) {
  const result = useMemo(() => analyzeBrief(reviewText), [reviewText]);
  const proposal = useMemo(
    () => buildProposal(systemName || "current system", result.findings),
    [systemName, result.findings],
  );

  return (
    <div className="stack">
      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Founder Proposal Builder</p>
            <h2>Turn review findings into a crisp architecture recommendation.</h2>
          </div>
          <span className="pill">{result.findings.length} source findings</span>
        </div>
        <p className="muted">
          This is a draft. Use it to start the conversation, then refine numbers, rollout,
          ownership, and business impact before presenting.
        </p>
      </section>
      <article className="proposal-card">
        <h2>{proposal.title}</h2>
        <pre>{proposal.text}</pre>
      </article>
    </div>
  );
}

