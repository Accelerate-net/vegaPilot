import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { setToken } from '../lib/auth';
import { defaultProtectedRoute } from '../lib/legacyScreens';

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [state, setState] = useState({ loading: false, error: '' });

  async function handleSubmit(event) {
    event.preventDefault();
    setState({ loading: true, error: '' });

    try {
      const response = await api.post(
        '/restricted/login/authenticate.php',
        { username, password },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (response.data?.status && response.data?.response) {
        setToken(response.data.response);
        navigate(defaultProtectedRoute, { replace: true });
        return;
      }

      setState({
        loading: false,
        error: response.data?.error || 'Authentication failed.',
      });
    } catch (error) {
      setState({
        loading: false,
        error: error.message || 'Authentication failed.',
      });
    }
  }

  return (
    <div className="login-page">
      <section className="login-panel">
        <p className="eyebrow">React Admin Preview</p>
        <h1>Crispr Pilot</h1>
        <p className="panel-copy">
          This is the new React entry point. Legacy Angular screens remain untouched while the migration is in
          progress.
        </p>
        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            <span>Username</span>
            <input value={username} onChange={(event) => setUsername(event.target.value)} />
          </label>
          <label>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <button className="primary-button" disabled={state.loading} type="submit">
            {state.loading ? 'Signing In...' : 'Sign In'}
          </button>
          {state.error ? <p className="error-text">{state.error}</p> : null}
        </form>
      </section>
      <section className="info-panel">
        <div className="info-card">
          <h2>Migration Status</h2>
          <ul>
            <li>React route map mirrors the existing root `.html` screens.</li>
            <li>Auth and API helpers are centralized for the new app.</li>
            <li>Legacy pages remain available until each screen is ported.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
