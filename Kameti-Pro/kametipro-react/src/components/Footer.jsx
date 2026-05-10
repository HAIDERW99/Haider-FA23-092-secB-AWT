import { Link } from 'react-router-dom';
import './Footer.css';

const PRODUCT_LINKS = [
  { label: 'Features',    href: '/#features' },
  { label: 'Pricing',     href: '/#pricing' },
  { label: 'How it Works', href: '/#how-it-works' },
  { label: 'Dashboard',   to: '/dashboard' },
];

const COMPANY_LINKS = [
  { label: 'About Us',  href: '#' },
  { label: 'Blog',      href: '#' },
  { label: 'Careers',   href: '#' },
  { label: 'Contact',   href: '#' },
];

const LEGAL_LINKS = [
  { label: 'Privacy Policy',    href: '#' },
  { label: 'Terms & Conditions', href: '#' },
  { label: 'Refund Policy',     href: '#' },
  { label: 'Help Center',       href: '#' },
];

export default function Footer() {
  return (
    <footer className="footer" role="contentinfo">
      <div className="container">
        <div className="footer__grid">
          {/* Brand */}
          <div>
            <div className="footer__brand-name">
              <span>🔄</span> KametiPro
            </div>
            <p className="footer__brand-desc">
              Pakistan ka smartest kameti management platform. Apne group finances ko
              digital aur transparent banao.
            </p>
          </div>

          {/* Product */}
          <div className="footer__col">
            <h4>Product</h4>
            <ul>
              {PRODUCT_LINKS.map((l) => (
                <li key={l.label}>
                  {l.to ? (
                    <Link to={l.to}>{l.label}</Link>
                  ) : (
                    <a href={l.href}>{l.label}</a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div className="footer__col">
            <h4>Company</h4>
            <ul>
              {COMPANY_LINKS.map((l) => (
                <li key={l.label}><a href={l.href}>{l.label}</a></li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="footer__col">
            <h4>Legal</h4>
            <ul>
              {LEGAL_LINKS.map((l) => (
                <li key={l.label}><a href={l.href}>{l.label}</a></li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="footer__bottom">
          <p>© 2025 KametiPro. All rights reserved. Made with ❤️ in Pakistan.</p>
          <div className="footer__socials" aria-label="Social media links">
            <a 
              href="https://www.facebook.com/profile.php?id=100077446284306" 
              aria-label="Facebook"
              target="_blank" 
              rel="noopener noreferrer"
            >f</a>
            <a 
              href="https://www.linkedin.com/in/haider-raza-4341063a9/" 
              aria-label="LinkedIn"
              target="_blank" 
              rel="noopener noreferrer"
            >in</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
