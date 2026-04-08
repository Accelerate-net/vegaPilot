import React from 'react';

export default function LegacyScreenPage({ screen }) {
  return (
    <section className="screen-card">
      <div className="screen-card-header">
        <div>
          <p className="eyebrow">Legacy Source</p>
          <h3>{screen.title}</h3>
        </div>
        <a className="ghost-button" href={screen.legacyHtml} target="_blank" rel="noreferrer">
          Open Legacy Screen
        </a>
      </div>
      <div className="detail-grid">
        <article className="detail-panel">
          <h4>Migration Scope</h4>
          <p>{screen.summary}</p>
        </article>
        <article className="detail-panel">
          <h4>Legacy Files</h4>
          <p>HTML: {screen.legacyHtml}</p>
          <p>Controller: {screen.controller}</p>
        </article>
      </div>
      <div className="migration-note">
        <h4>Next Porting Step</h4>
        <p>
          Replace the legacy controller behavior with React state, shared hooks, and focused components while keeping
          this route stable.
        </p>
      </div>
    </section>
  );
}
