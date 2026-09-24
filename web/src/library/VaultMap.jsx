import { VAULT_ROOT, VAULT_SECTIONS } from "./vaultIndex.js";

export function VaultMap() {
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Vault Map</p>
          <h2>Use your notes as source material, not as a maze.</h2>
        </div>
        <span className="pill">
          {VAULT_SECTIONS.reduce((sum, item) => sum + item.count, 0)} indexed notes
        </span>
      </div>
      <div className="vault-grid">
        {VAULT_SECTIONS.map((section) => (
          <article key={section.folder} className="vault-card">
            <div className="vault-card-top">
              <span className="priority">{section.priority}</span>
              <span>{section.count} files</span>
            </div>
            <h3>{section.title}</h3>
            <p>{section.summary}</p>
            <strong>{section.role}</strong>
          </article>
        ))}
      </div>
      <p className="source-path">Source: {VAULT_ROOT}</p>
    </section>
  );
}
