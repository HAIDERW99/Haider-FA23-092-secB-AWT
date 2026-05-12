import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../api/authApi';
import { saveAuth, isLoggedIn } from '../utils/authUtils';
import './Login.css'; // reuse same auth styles

// ── Field helper — defined OUTSIDE the component so it is never re-created ────
// If defined inside, React treats it as a new component type on every render,
// unmounts the old input, and the focused field loses focus after each keystroke.
function Field({ id, label, name, type = 'text', placeholder, autoComplete, form, errors, onChange }) {
  return (
    <div className="form-group">
      <label className="form-label" htmlFor={id}>{label}</label>
      <input
        id={id}
        type={type}
        name={name}
        className={`form-input${errors[name] ? ' error' : ''}`}
        placeholder={placeholder}
        value={form[name]}
        onChange={onChange}
        autoComplete={autoComplete}
        aria-describedby={errors[name] ? `${id}-err` : undefined}
      />
      {errors[name] && (
        <span id={`${id}-err`} className="form-error" role="alert">⚠ {errors[name]}</span>
      )}
    </div>
  );
}

export default function Signup() {
  const navigate = useNavigate();

  // Redirect if already logged in — inside useEffect to avoid render-loop
  useEffect(() => {
    if (isLoggedIn()) navigate('/dashboard', { replace: true });
  }, [navigate]);

  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
  });
  const [errors, setErrors]     = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPwd, setShowPwd]   = useState(false);

  // ── Validation ──────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.name.trim())
      e.name = 'Naam daalna zaroori hai';
    else if (form.name.trim().length < 2)
      e.name = 'Naam kam az kam 2 characters ka hona chahiye';

    if (!form.email.trim())
      e.email = 'Email daalna zaroori hai';
    else if (!/^\S+@\S+\.\S+$/.test(form.email))
      e.email = 'Valid email daalo';

    if (!form.phone.trim())
      e.phone = 'Phone number daalna zaroori hai';
    else if (!/^(\+92|0)[0-9]{10}$/.test(form.phone))
      e.phone = 'Pakistani number daalo (e.g. 03001234567)';

    if (!form.password)
      e.password = 'Password daalna zaroori hai';
    else if (form.password.length < 6)
      e.password = 'Password kam az kam 6 characters ka hona chahiye';

    if (!form.confirmPassword)
      e.confirmPassword = 'Password confirm karo';
    else if (form.password !== form.confirmPassword)
      e.confirmPassword = 'Dono passwords match nahi karte';

    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
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
      const data = await registerUser({
        name:     form.name.trim(),
        email:    form.email.trim(),
        phone:    form.phone.trim(),
        password: form.password,
      });
      saveAuth(data.token, data.user);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setApiError(err.message || 'Signup fail ho gaya. Dobara koshish karo.');
    } finally {
      setLoading(false);
    }
  };

  // ── Field helper moved outside component — see top of file ──────────────────

  return (
    <main className="auth-page" aria-label="Signup page">
      <div className="auth-card">
        <div className="auth-card__logo">🔄</div>
        <h1 className="auth-card__title">Free Account Banao</h1>
        <p className="auth-card__subtitle">KametiPro join karo — bilkul free, koi hidden charges nahi</p>

        {/* API error */}
        {apiError && (
          <div className="auth-api-error" role="alert">
            <span>⚠️</span> {apiError}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <Field
            id="signup-name"
            label="Poora Naam"
            name="name"
            placeholder="Ahmed Khan"
            autoComplete="name"
            form={form}
            errors={errors}
            onChange={handleChange}
          />
          <Field
            id="signup-email"
            label="Email Address"
            name="email"
            type="email"
            placeholder="aapka@email.com"
            autoComplete="email"
            form={form}
            errors={errors}
            onChange={handleChange}
          />
          <Field
            id="signup-phone"
            label="Phone Number"
            name="phone"
            type="tel"
            placeholder="03001234567"
            autoComplete="tel"
            form={form}
            errors={errors}
            onChange={handleChange}
          />

          {/* Password with toggle */}
          <div className="form-group">
            <label className="form-label" htmlFor="signup-password">Password</label>
            <div className="form-input-wrap">
              <input
                id="signup-password"
                type={showPwd ? 'text' : 'password'}
                name="password"
                className={`form-input${errors.password ? ' error' : ''}`}
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
                aria-describedby={errors.password ? 'signup-pwd-err' : undefined}
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
              <span id="signup-pwd-err" className="form-error" role="alert">⚠ {errors.password}</span>
            )}
          </div>

          {/* Confirm password */}
          <div className="form-group">
            <label className="form-label" htmlFor="signup-confirm">Password Confirm Karo</label>
            <input
              id="signup-confirm"
              type={showPwd ? 'text' : 'password'}
              name="confirmPassword"
              className={`form-input${errors.confirmPassword ? ' error' : ''}`}
              placeholder="••••••••"
              value={form.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
              aria-describedby={errors.confirmPassword ? 'signup-confirm-err' : undefined}
            />
            {errors.confirmPassword && (
              <span id="signup-confirm-err" className="form-error" role="alert">⚠ {errors.confirmPassword}</span>
            )}
          </div>

          {/* Submit */}
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? (
              <><div className="btn-spinner" aria-hidden="true" /> Account ban raha hai...</>
            ) : (
              '🚀 Free Account Banao'
            )}
          </button>
        </form>

        <div className="auth-divider">ya</div>

        <p className="auth-footer">
          Pehle se account hai?{' '}
          <Link to="/login">Login karo →</Link>
        </p>
      </div>
    </main>
  );
}
