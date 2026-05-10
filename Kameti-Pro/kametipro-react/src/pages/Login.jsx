import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { loginUser } from '../api/authApi';
import { saveAuth, isLoggedIn } from '../utils/authUtils';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  // After login, go back to where the user came from (or dashboard)
  const from = location.state?.from?.pathname || '/dashboard';

  // Redirect if already logged in — inside useEffect to avoid render-loop
  useEffect(() => {
    if (isLoggedIn()) navigate(from, { replace: true });
  }, [navigate, from]);

  const [form, setForm]         = useState({ email: '', password: '' });
  const [errors, setErrors]     = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPwd, setShowPwd]   = useState(false);

  // ── Validation ──────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.email.trim())                          e.email    = 'Email daalna zaroori hai';
    else if (!/^\S+@\S+\.\S+$/.test(form.email))    e.email    = 'Valid email daalo';
    if (!form.password)                              e.password = 'Password daalna zaroori hai';
    else if (form.password.length < 6)               e.password = 'Password kam az kam 6 characters ka hona chahiye';
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    // Clear field error on change
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    setApiError('');
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const fieldErrors = validate();
    if (Object.keys(fieldErrors).length) {
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    setApiError('');

    try {
      const data = await loginUser({ email: form.email, password: form.password });
      saveAuth(data.token, data.user);
      navigate(from, { replace: true });
    } catch (err) {
      setApiError(err.message || 'Login fail ho gaya. Dobara koshish karo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page" aria-label="Login page">
      <div className="auth-card">
        <div className="auth-card__logo">🔄</div>
        <h1 className="auth-card__title">Wapas Aaiye!</h1>
        <p className="auth-card__subtitle">Apne KametiPro account mein login karo</p>

        {/* API error */}
        {apiError && (
          <div className="auth-api-error" role="alert">
            <span>⚠️</span> {apiError}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email Address</label>
            <input
              id="login-email"
              type="email"
              name="email"
              className={`form-input${errors.email ? ' error' : ''}`}
              placeholder="aapka@email.com"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              aria-describedby={errors.email ? 'login-email-err' : undefined}
            />
            {errors.email && (
              <span id="login-email-err" className="form-error" role="alert">⚠ {errors.email}</span>
            )}
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <div className="form-input-wrap">
              <input
                id="login-password"
                type={showPwd ? 'text' : 'password'}
                name="password"
                className={`form-input${errors.password ? ' error' : ''}`}
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                aria-describedby={errors.password ? 'login-pwd-err' : undefined}
              />
              <button
                type="button"
                className="form-eye-btn"
                onClick={() => setShowPwd((s) => !s)}
                aria-label={showPwd ? 'Password chupaao' : 'Password dikhaao'}
              >
                {showPwd ? '🙈' : '👁️'}
              </button>
            </div>
            {errors.password && (
              <span id="login-pwd-err" className="form-error" role="alert">⚠ {errors.password}</span>
            )}
          </div>

          {/* Submit */}
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? (
              <><div className="btn-spinner" aria-hidden="true" /> Login ho raha hai...</>
            ) : (
              '🔐 Login Karo'
            )}
          </button>
        </form>

        <div className="auth-divider">ya</div>

        <p className="auth-footer">
          Account nahi hai?{' '}
          <Link to="/signup">Free mein banao →</Link>
        </p>
      </div>
    </main>
  );
}
