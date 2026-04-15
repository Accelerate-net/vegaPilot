import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { setToken } from '../lib/auth';
import { defaultProtectedRoute } from '../lib/legacyScreens';

export default function LoginPage() {
  const navigate = useNavigate();
  
  // View states: 'password', 'otp', 'forgot'
  const [view, setView] = useState('password');
  
  // Form fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  
  // OTP logic
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  
  const [state, setState] = useState({ loading: false, error: '', success: '' });

  // Handle countdown for OTP
  useEffect(() => {
    let interval;
    if (otpTimer > 0) {
      interval = setInterval(() => setOtpTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  const resetState = () => setState({ loading: false, error: '', success: '' });

  async function handlePasswordLogin(e) {
    if (e) e.preventDefault();
    setState({ loading: true, error: '', success: '' });

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
      setState({ loading: false, error: response.data?.error || 'Authentication failed.', success: '' });
    } catch (error) {
      setState({ loading: false, error: error.message || 'Authentication failed.', success: '' });
    }
  }

  async function handleSendOtp(e) {
    if (e) e.preventDefault();
    if (!username) return setState({ loading: false, error: 'Please enter your username/email.', success: '' });
    
    setState({ loading: true, error: '', success: '' });
    // Mocking API delay for OTP
    setTimeout(() => {
      setOtpSent(true);
      setOtpTimer(120); // 2 mins
      setState({ loading: false, error: '', success: 'OTP sent to your registered email/phone.' });
    }, 1000);
  }

  async function handleOtpLogin(e) {
    if (e) e.preventDefault();
    setState({ loading: true, error: '', success: '' });
    // Mock OTP logic, then fallback to standard login
    setTimeout(() => {
      // In a real app this would verify OTP. For now, pretend standard login works
      setState({ loading: false, error: 'Invalid OTP entered. Mock mode prevents real login.', success: '' });
    }, 1000);
  }

  async function handleForgotPassword(e) {
    if (e) e.preventDefault();
    if (!username) return setState({ loading: false, error: 'Please enter your registered email.', success: '' });
    
    setState({ loading: true, error: '', success: '' });
    // Mocking API delay
    setTimeout(() => {
      setState({ loading: false, error: '', success: 'Temporary password sent to your email.' });
    }, 1500);
  }

  return (
    <div className="login-wrapper">
      <div className="login-card">
        
        {/* Left Side: Brand Panel */}
        <div className="login-brand-side">
          <div className="login-brand-logo-block">
            <img
              src="/assets/logo/crispr-logo-for-dark-bg.png"
              alt="Crispr Logo"
              className="login-brand-logo-img"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <span className="login-brand-wordmark">PILOT</span>
          </div>
        </div>

        {/* Right Side: Form Panel */}
        <div className="login-form-side">
          
          {view === 'password' && (
            <div className="login-form-inner fade-in">
              <div className="login-header">
                <h3>Welcome!</h3>
                <p>Continue with your registered credentials</p>
              </div>

              <form onSubmit={handlePasswordLogin}>
                <input 
                  className="login-input" 
                  placeholder="Username or Email" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                />
                <input 
                  className="login-input" 
                  type="password" 
                  placeholder="Password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                />

                {state.error && <div className="login-alert error">{state.error}</div>}

                <button type="submit" className="login-btn primary" disabled={state.loading}>
                  {state.loading ? 'Logging in...' : 'Login'}
                </button>

                <div className="login-options">
                  <button type="button" className="text-btn" onClick={() => { setView('otp'); resetState(); }}>Login with OTP</button>
                  <button type="button" className="text-btn" onClick={() => { setView('forgot'); resetState(); }}>Forgot Password?</button>
                </div>
              </form>
            </div>
          )}

          {view === 'otp' && (
            <div className="login-form-inner fade-in">
              <div className="login-header">
                <h3>Login with OTP</h3>
                <p>Secure login using a One-Time Password.</p>
              </div>

              <form onSubmit={otpSent ? handleOtpLogin : handleSendOtp}>
                <input 
                  className="login-input" 
                  placeholder="Username or Email" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  disabled={otpSent}
                />
                
                {otpSent && (
                  <input 
                    className="login-input" 
                    placeholder="4-Digit OTP" 
                    value={otp} 
                    onChange={(e) => setOtp(e.target.value)} 
                    maxLength={4}
                  />
                )}

                {otpSent && (
                  <div className="login-options">
                    {otpTimer > 0 ? (
                      <span className="timer-text">Resend in {Math.floor(otpTimer/60)}:{(otpTimer%60).toString().padStart(2, '0')}</span>
                    ) : (
                      <button type="button" className="text-btn" onClick={handleSendOtp}>Resend OTP</button>
                    )}
                  </div>
                )}

                {state.error && <div className="login-alert error">{state.error}</div>}
                {state.success && <div className="login-alert success">{state.success}</div>}

                <button type="submit" className="login-btn primary" disabled={state.loading}>
                  {state.loading ? 'Processing...' : (otpSent ? 'Login' : 'Send OTP')}
                </button>
              </form>

              <div className="login-secondary-actions">
                <button type="button" className="text-btn" onClick={() => { setView('password'); resetState(); }}>Login with Password</button>
              </div>
            </div>
          )}

          {view === 'forgot' && (
            <div className="login-form-inner fade-in">
              <div className="login-header">
                <h3>Recover Password</h3>
                <p>Enter your registered email to receive a temporary password.</p>
              </div>

              <form onSubmit={handleForgotPassword}>
                <input 
                  className="login-input" 
                  placeholder="Email Address" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                />

                {state.error && <div className="login-alert error">{state.error}</div>}
                {state.success && <div className="login-alert success">{state.success}</div>}

                <button type="submit" className="login-btn primary" disabled={state.loading}>
                  {state.loading ? 'Sending...' : 'Send Temporary Password'}
                </button>
              </form>

              <div className="login-secondary-actions">
                <button type="button" className="text-btn" onClick={() => { setView('password'); resetState(); }}>Back to Login</button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
