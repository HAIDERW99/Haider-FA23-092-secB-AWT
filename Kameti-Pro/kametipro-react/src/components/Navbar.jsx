import { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { isLoggedIn, getUser, logout } from '../utils/authUtils';
import './Navbar.css';

const NAV_LINKS = [
  { label: 'Features',     href: '/#features' },
  { label: 'How it Works', href: '/#how-it-works' },
  { label: 'Pricing',      href: '/#pricing' },
  { label: 'FAQ',          href: '/#faq' },
  { label: 'Contact',      href: '/#contact' },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate  = useNavigate();
  const loggedIn  = isLoggedIn();
  const user      = getUser();

  const handleDashboard = (e) => {
    e.preventDefault();
    setMenuOpen(false);
    navigate(loggedIn ? '/dashboard' : '/login');
  };

  const handleSignup = (e) => {
    e.preventDefault();
    setMenuOpen(false);
    navigate('/signup');
  };

  const handleLogout = (e) => {
    e.preventDefault();
    setMenuOpen(false);
    logout(); // clears localStorage + redirects to /login
  };

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="container">
        <div className="navbar__inner">
          {/* Brand */}
          <Link to="/" className="navbar__brand" aria-label="KametiPro home">
            <span>🔄</span> KametiPro
          </Link>

          {/* Desktop links */}
          <ul className="navbar__links" role="list">
            {NAV_LINKS.map((l) => (
              <li key={l.label}>
                <a href={l.href}>{l.label}</a>
              </li>
            ))}
          </ul>

          {/* Desktop actions */}
          <div className="navbar__actions">
            {loggedIn ? (
              <>
                {/* Logged-in: show user initials + dashboard + logout */}
                <span className="navbar__user-greeting">
                  👋 {user?.name?.split(' ')[0] || 'User'}
                </span>
                <NavLink to="/dashboard" className="btn btn-outline btn-sm">
                  📊 Dashboard
                </NavLink>
                <button onClick={handleLogout} className="btn btn-sm navbar__logout-btn">
                  Logout
                </button>
              </>
            ) : (
              <>
                <button onClick={handleDashboard} className="btn btn-outline btn-sm">
                  Dashboard
                </button>
                <button onClick={handleSignup} className="btn btn-primary btn-sm">
                  Free Shuru Karo →
                </button>
              </>
            )}
          </div>

          {/* Hamburger */}
          <button
            className="navbar__hamburger"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        {/* Mobile menu */}
        <div className={`navbar__mobile${menuOpen ? ' open' : ''}`} role="menu">
          {NAV_LINKS.map((l) => (
            <a key={l.label} href={l.href} role="menuitem" onClick={() => setMenuOpen(false)}>
              {l.label}
            </a>
          ))}
          {loggedIn ? (
            <>
              <NavLink
                to="/dashboard"
                className="btn btn-outline btn-sm"
                role="menuitem"
                onClick={() => setMenuOpen(false)}
              >
                📊 Dashboard
              </NavLink>
              <button onClick={handleLogout} className="btn btn-sm navbar__logout-btn" role="menuitem">
                Logout
              </button>
            </>
          ) : (
            <>
              <button onClick={handleDashboard} className="btn btn-outline btn-sm" role="menuitem">
                Dashboard
              </button>
              <button onClick={handleSignup} className="btn btn-primary btn-sm" role="menuitem">
                Free Shuru Karo →
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
