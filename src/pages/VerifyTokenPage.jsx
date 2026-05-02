import React from 'react';
import { getToken, isAuthenticated } from '../lib/auth';
import { BASE_URL } from '../lib/api';

export default function VerifyTokenPage() {
  return (
    <div className="verify-page">
      <section className="screen-card">
        <p className="eyebrow">Utility</p>
        <h1>Token Verification</h1>
        <div className="detail-grid">
          <article className="detail-panel">
            <h4>Auth State</h4>
            <p>{isAuthenticated() ? 'Authenticated token found.' : 'No admin token detected.'}</p>
          </article>
          <article className="detail-panel">
            <h4>API Base URL</h4>
            <p>{BASE_URL}</p>
          </article>
        </div>
        <article className="detail-panel">
          <h4>Token Preview</h4>
          <pre className="token-preview">{getToken() || 'No token available.'}</pre>
        </article>
      </section>
    </div>
  );
}
