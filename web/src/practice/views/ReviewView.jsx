import { useMemo } from "react";
import { AlertTriangle, CheckCircle2, Sparkles } from "lucide-react";
import { REVIEW_CATEGORIES } from "../data/learning.js";
import { analyzeBrief } from "../lib/reviewEngine.js";
import { cx } from "../../ui/cx.js";

const sampleBrief = `System: Order checkout
Flow: Mobile app calls checkout API. API writes order to PostgreSQL, calls payment provider, sends email notification, updates analytics, and returns response.
Data: PostgreSQL stores orders and payments. Redis cache is used for product price lookup.
Traffic: 150 RPS today, sale events can spike to 1500 RPS. Target p95 latency under 300ms.
Pain points: Checkout sometimes times out when payment provider is slow. Duplicate orders happened during retry. We have basic logs but no tracing dashboard.`;

export function ReviewView({ reviewText, setReviewText, systemName, setSystemName }) {
  const result = useMemo(() => analyzeBrief(reviewText), [reviewText]);

  return (
    <div className="stack">
      <section className="two-column review-layout">
        <div className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Architecture Review</p>
              <h2>Paste a system brief. Get useful review points.</h2>
            </div>
          </div>
          <label className="field-label">
            System name
            <input
              value={systemName}
              onChange={(event) => setSystemName(event.target.value)}
              placeholder="Order checkout, notifications, search..."
            />
          </label>
          <label className="field-label">
            Architecture brief
            <textarea
              value={reviewText}
              onChange={(event) => setReviewText(event.target.value)}
              placeholder="Describe request flow, services, data stores, scale, pain points, failures, and constraints."
            />
          </label>
          <div className="button-row">
            <button onClick={() => setReviewText(sampleBrief)}>
              <Sparkles size={15} />
              Load sample
            </button>
            <button onClick={() => setReviewText("")}>Clear</button>
          </div>
        </div>

        <aside className="panel score-panel">
          <p className="eyebrow">Review Score</p>
          <div className="score">{result.score}</div>
          <p>{result.summary}</p>
          <div className="checklist-column">
            {REVIEW_CATEGORIES.map((item) => (
              <span key={item}>
                <CheckCircle2 size={15} />
                {item}
              </span>
            ))}
          </div>
        </aside>
      </section>

      <section className="findings-list">
        {result.findings.map((finding) => (
          <article key={finding.id} className="finding-card">
            <div>
              <span className={cx("severity", finding.severity.toLowerCase())}>{finding.severity}</span>
              <span className="area">{finding.area}</span>
            </div>
            <h3>{finding.issue}</h3>
            <p>{finding.whyItMatters}</p>
            <div className="recommendation">
              <AlertTriangle size={17} />
              <span>{finding.suggestedFix}</span>
            </div>
            <div className="concept-row compact">
              {finding.relatedConcepts.map((concept) => (
                <span key={concept}>{concept}</span>
              ))}
            </div>
          </article>
        ))}
        {result.findings.length === 0 && reviewText && (
          <div className="empty-state">No obvious gaps found. Add failure cases and traffic details for deeper review.</div>
        )}
      </section>
    </div>
  );
}

