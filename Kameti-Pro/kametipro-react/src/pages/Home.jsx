import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { isLoggedIn } from '../utils/authUtils';
import './Home.css';

// ─── Data ────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: '🔔',
    title: 'Auto Payment Reminders',
    desc: 'Due date se pehle automatically WhatsApp aur SMS reminder chala jata hai — aapko kuch karna nahi padta.',
  },
  {
    icon: '📊',
    title: 'Real-time Payment Tracking',
    desc: 'Har member ka payment status live dekhein — kisne dia, kitna dia, aur kab dia.',
  },
  {
    icon: '🔄',
    title: 'Turn Management (Hissa)',
    desc: 'Automatic turn rotation — sab members ko pata hota hai unka hissa kab aayega.',
  },
  {
    icon: '🔒',
    title: 'Full Transparency',
    desc: 'Sab members apne phone par apna record dekh sakte hain — koi confusion nahi, koi jhagra nahi.',
  },
];

const PAYMENT_PREVIEW = [
  { initials: 'AK', name: 'Ahmed Khan',    date: '1 May 2025',  status: 'paid',     colorClass: 'av-green' },
  { initials: 'SF', name: 'Sara Fatima',   date: '2 May 2025',  status: 'paid',     colorClass: 'av-blue' },
  { initials: 'MR', name: 'Muhammad Raza', date: 'Due: 8 May',  status: 'due',      colorClass: 'av-purple' },
  { initials: 'ZB', name: 'Zainab Butt',   date: 'Due: 10 May', status: 'upcoming', colorClass: 'av-orange' },
  { initials: 'HN', name: 'Hassan Naveed', date: '1 May 2025',  status: 'paid',     colorClass: 'av-pink' },
];

const STEPS = [
  { num: '1', icon: '📱', title: 'Account Banao',       desc: 'Sirf naam, number aur email se 2 minute mein free account ready ho jata hai. Koi hidden charges nahi.' },
  { num: '2', icon: '🏦', title: 'Committee Create Karo', desc: 'Amount, duration, aur turn order set karo. KametiPro automatically sab calculations kar lega.' },
  { num: '3', icon: '🤝', title: 'Members Invite Karo',  desc: 'WhatsApp link se members ko invite karo — woh join karein aur real-time updates milti rahein sabko.' },
];

const LIVE_COMMITTEES = [
  {
    icon: '👨‍👩‍👧‍👦', name: 'Family Savings Group',  meta: '₨5,000/month • 12 members • Karachi',
    status: 'active',  statusClass: 'tag-green',
    progress: 75, progressLabel: 'Month 9/12',
    avatars: [{ i: 'AK', c: 'av-green' }, { i: 'SF', c: 'av-blue' }, { i: 'MR', c: 'av-purple' }],
    extra: '+9', turn: 'Ayesha K.',
  },
  {
    icon: '🏢', name: 'Office Kameti 2025', meta: '₨10,000/month • 8 members • Lahore',
    status: '2 Pending', statusClass: 'tag-yellow',
    progress: 37, progressLabel: 'Month 3/8',
    avatars: [{ i: 'ZA', c: 'av-green' }, { i: 'HQ', c: 'av-blue' }, { i: 'NM', c: 'av-purple' }],
    extra: '+5', turn: 'Zahid A.',
  },
  {
    icon: '🏘️', name: 'Mohalla Bachat Group', meta: '₨3,000/month • 20 members • Islamabad',
    status: 'active', statusClass: 'tag-green',
    progress: 25, progressLabel: 'Month 5/20',
    avatars: [{ i: 'RJ', c: 'av-teal' }, { i: 'AM', c: 'av-green' }, { i: 'BK', c: 'av-blue' }],
    extra: '+17', turn: 'Rabia J.',
  },
];

const REVIEWS = [
  { stars: '⭐⭐⭐⭐⭐', text: '"Pehle hum sab WhatsApp mein yaad dilate rehte the. Ab KametiPro sab khud kar leta hai. Zindagi asaan ho gayi!"', initials: 'AK', name: 'Ayesha Khan',    loc: 'Karachi, Sindh',    colorClass: 'av-green' },
  { stars: '⭐⭐⭐⭐⭐', text: '"Hamare office ki 8 log ki kameti thi, sab confuse rehte the. KametiPro ne sab clear kar dia. Highly recommended!"', initials: 'MQ', name: 'Muhammad Qasim', loc: 'Lahore, Punjab',    colorClass: 'av-blue' },
  { stars: '⭐⭐⭐⭐⭐', text: '"Turn ka jhagra khatam. Sab ko pata hai unka number kab aayega. Best app for kameti management in Pakistan!"', initials: 'FB', name: 'Fatima Bibi',     loc: 'Islamabad, Capital', colorClass: 'av-purple' },
];

const PLANS = [
  {
    name: 'Free', price: '₨0', period: '/month', popular: false,
    desc: 'Personal use ke liye perfect — free mein shuru karo.',
    features: [
      { text: '1 Committee', ok: true },
      { text: 'Up to 10 members', ok: true },
      { text: 'Basic reminders', ok: true },
      { text: 'WhatsApp reminders', ok: false },
      { text: 'Reports & exports', ok: false },
    ],
    cta: 'Free Shuru Karo',
  },
  {
    name: 'Pro', price: '₨499', period: '/month', popular: true,
    desc: 'Active committee organizers ke liye best choice.',
    features: [
      { text: '10 Committees', ok: true },
      { text: 'Unlimited members', ok: true },
      { text: 'WhatsApp + SMS reminders', ok: true },
      { text: 'PDF reports & exports', ok: true },
      { text: 'Priority support', ok: true },
    ],
    cta: 'Pro Lein →',
  },
  {
    name: 'Business', price: '₨1,499', period: '/month', popular: false,
    desc: 'Professional committee managers aur organizations ke liye.',
    features: [
      { text: 'Unlimited committees', ok: true },
      { text: 'Unlimited members', ok: true },
      { text: 'Custom branding', ok: true },
      { text: 'Advanced analytics', ok: true },
      { text: 'Dedicated support', ok: true },
    ],
    cta: 'Business Lein',
  },
];

const FAQS = [
  { q: 'KametiPro bilkul free hai?',                    a: 'Haan! Basic plan bilkul free hai — 1 committee aur 10 members ke saath. Zyada features ke liye Pro plan available hai sirf ₨499/month mein.' },
  { q: 'Kya WhatsApp reminders sach mein kaam karte hain?', a: 'Bilkul! Pro plan mein automated WhatsApp messages directly members ke number par jayenge — aapko kuch nahi karna. Reminder 2 din pehle aur due date par jata hai.' },
  { q: 'Kya mera paisa safe hai KametiPro ke saath?',   a: 'KametiPro sirf ek management tool hai — hum koi paisa hold nahi karte. Payments aap log apas mein karte hain (Easypaisa, JazzCash, bank transfer), hum sirf record rakhte hain.' },
  { q: 'Kitne members ek committee mein ho sakte hain?', a: 'Free plan mein 10 members, Pro mein unlimited members ho sakte hain. Zyada tar groups 5-30 members ke hote hain jo Pro plan ke liye perfect hai.' },
  { q: 'Kya mobile app bhi hai?',                       a: 'Haan! Android aur iOS dono ke liye apps available hain. Website bhi fully mobile-friendly hai toh app ke baghair bhi kaam kar sakta hai.' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  if (status === 'paid')     return <span className="tag tag-green">✓ Paid</span>;
  if (status === 'due')      return <span className="tag tag-yellow">⏰ Due</span>;
  if (status === 'upcoming') return <span className="tag" style={{ background: '#eff6ff', color: '#1d4ed8' }}>📅 Upcoming</span>;
  return null;
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="faq-item">
      <button
        className="faq-item__question"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        {q}
        <span className={`faq-item__icon${open ? ' open' : ''}`}>+</span>
      </button>
      <div className={`faq-item__answer${open ? ' open' : ''}`} aria-hidden={!open}>
        {a}
      </div>
    </div>
  );
}

// ─── Contact Form ─────────────────────────────────────────────────────────────

function ContactForm() {
  const [form, setForm]       = useState({ name: '', email: '', phone: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors]   = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim())    e.name    = 'Naam zaroor likhein';
    if (!form.email.trim())   e.email   = 'Email zaroor likhein';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email likhein';
    if (!form.phone.trim())   e.phone   = 'Phone number zaroor likhein';
    if (!form.message.trim()) e.message = 'Apna masla ya sawal zaroor likhein';
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    // Build mailto link with form data
    const subject = encodeURIComponent(`KametiPro Contact: ${form.name}`);
    const body    = encodeURIComponent(
      `Naam: ${form.name}\nEmail: ${form.email}\nPhone: ${form.phone}\n\nMasla / Sawal:\n${form.message}`
    );
    window.open(`mailto:haiderwahla199@gmail.com?subject=${subject}&body=${body}`, '_blank');
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="contact__form-card contact__success">
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
        <h3>Shukriya!</h3>
        <p>Aapka message email client mein khul gaya hai. Bhej dein — hum 24 ghante mein jawab denge.</p>
        <button
          onClick={() => { setSubmitted(false); setForm({ name: '', email: '', phone: '', message: '' }); }}
          className="btn btn-primary"
          style={{ marginTop: '1rem' }}
        >
          Dobara Message Karein
        </button>
      </div>
    );
  }

  return (
    <form className="contact__form-card" onSubmit={handleSubmit} noValidate aria-label="Contact form">
      <h3 className="contact__form-title">📩 Message Bhejein</h3>

      <div className="contact__form-row">
        <div className="contact__field">
          <label htmlFor="cf-name">Aapka Naam *</label>
          <input
            id="cf-name" name="name" type="text"
            value={form.name} onChange={handleChange}
            placeholder="Muhammad Ahmed"
            className={errors.name ? 'error' : ''}
          />
          {errors.name && <span className="contact__field-error">{errors.name}</span>}
        </div>
        <div className="contact__field">
          <label htmlFor="cf-phone">Phone Number *</label>
          <input
            id="cf-phone" name="phone" type="tel"
            value={form.phone} onChange={handleChange}
            placeholder="03001234567"
            className={errors.phone ? 'error' : ''}
          />
          {errors.phone && <span className="contact__field-error">{errors.phone}</span>}
        </div>
      </div>

      <div className="contact__field">
        <label htmlFor="cf-email">Email Address *</label>
        <input
          id="cf-email" name="email" type="email"
          value={form.email} onChange={handleChange}
          placeholder="ahmed@example.com"
          className={errors.email ? 'error' : ''}
        />
        {errors.email && <span className="contact__field-error">{errors.email}</span>}
      </div>

      <div className="contact__field">
        <label htmlFor="cf-message">Masla ya Sawal *</label>
        <textarea
          id="cf-message" name="message" rows={5}
          value={form.message} onChange={handleChange}
          placeholder="Apna masla, sawal, ya feedback yahan likhein..."
          className={errors.message ? 'error' : ''}
        />
        {errors.message && <span className="contact__field-error">{errors.message}</span>}
      </div>

      <div className="contact__form-actions">
        <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.9rem' }}>
          📧 Email Karein
        </button>
        <a
          href={`https://www.facebook.com/profile.php?id=100077446284306`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn contact__fb-btn"
          style={{ width: '100%', justifyContent: 'center', padding: '0.9rem' }}
        >
          <span style={{ fontWeight: 800 }}>f</span>&nbsp; Facebook par Message Karein
        </a>
      </div>
    </form>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function Home() {
  const navigate  = useNavigate();
  const loggedIn  = isLoggedIn();

  const goToSignup    = () => navigate('/signup');
  const goToDashboard = () => navigate(loggedIn ? '/dashboard' : '/login');

  return (
    <>
      {/* ── Hero ── */}
      <section className="hero" aria-label="Hero">
        <div className="container">
          <div className="hero__inner">
            <div>
              <div className="badge">🇵🇰 Pakistan's Smartest Kameti App</div>
              <h1 className="hero__title">
                Apni Kameti ab<br />
                <span>asan aur digital</span> karo
              </h1>
              <p className="hero__desc">
                Payments track karo, auto reminders bhejo, aur apne committee group ko ek jagah
                manage karo — bilkul asaan aur transparent tarike se.
              </p>
              <div className="hero__cta">
                <button onClick={goToSignup} className="btn btn-primary">🚀 Free Shuru Karo</button>
                <button onClick={goToDashboard} className="btn btn-outline">📊 Dashboard Dekho</button>
              </div>
              <div className="hero__social-proof">
                <div className="hero__avatars" aria-hidden="true">
                  {[['AK','av-green'],['SF','av-blue'],['MR','av-purple'],['ZB','av-orange'],['HN','av-pink']].map(([i,c]) => (
                    <div key={i} className={`avatar avatar-sm ${c}`}>{i}</div>
                  ))}
                </div>
                <p>50,000+ log already use kar rahe hain</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="stats" aria-label="Statistics">
        <div className="container">
          <div className="stats__grid">
            {[
              { icon: '👥', value: '50,000+', label: 'Active Users' },
              { icon: '💰', value: '₨2.4 Cr+', label: 'Managed Monthly' },
              { icon: '✅', value: '99.9%', label: 'Payment Accuracy' },
              { icon: '🏙️', value: '100+', label: 'Cities in Pakistan' },
            ].map((s) => (
              <div key={s.label} className="stats__item">
                <div className="stats__item-icon">{s.icon}</div>
                <div className="stats__item-value">{s.value}</div>
                <div className="stats__item-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="section" aria-labelledby="features-heading">
        <div className="container">
          <div className="section-heading">
            <div className="badge">✨ Features</div>
            <h2 id="features-heading">Sab kuch ek jagah manage karo</h2>
            <p>KametiPro ke saath apni committee chalana itna asaan ho jata hai jitna pehle kabhi nahi tha.</p>
          </div>
          <div className="features__grid">
            <div className="features__list">
              {FEATURES.map((f) => (
                <div key={f.title} className="feature-card">
                  <div className="feature-card__icon">{f.icon}</div>
                  <div>
                    <div className="feature-card__title">{f.title}</div>
                    <div className="feature-card__desc">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="payment-panel" aria-label="Payment status preview">
              <div className="payment-panel__header">Payment Status — Family Group</div>
              <div className="payment-panel__list">
                {PAYMENT_PREVIEW.map((m) => (
                  <div key={m.initials} className="payment-panel__row">
                    <div className="payment-panel__member">
                      <div className={`avatar ${m.colorClass}`}>{m.initials}</div>
                      <div>
                        <div className="payment-panel__member-name">{m.name}</div>
                        <div className="payment-panel__member-date">{m.date}</div>
                      </div>
                    </div>
                    <StatusBadge status={m.status} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it Works ── */}
      <section id="how-it-works" className="section section-alt" aria-labelledby="how-heading">
        <div className="container">
          <div className="section-heading">
            <div className="badge">🗺️ Process</div>
            <h2 id="how-heading">3 asaan steps mein shuru karo</h2>
            <p>Account banana, committee create karna, aur members add karna — bas itna kaafi hai.</p>
          </div>
          <div className="steps__grid">
            {STEPS.map((s) => (
              <div key={s.num} className="step-card">
                <div className="step-card__number">{s.num}</div>
                <div className="step-card__icon">{s.icon}</div>
                <div className="step-card__title">{s.title}</div>
                <p className="step-card__desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Live Committees ── */}
      <section className="section" aria-labelledby="committees-heading">
        <div className="container">
          <div className="section-heading">
            <div className="badge">📋 Live Committees</div>
            <h2 id="committees-heading">Apni committees ka haal dekhein</h2>
          </div>
          <div className="committees__grid">
            {LIVE_COMMITTEES.map((c) => (
              <div key={c.name} className="committee-card">
                <div className="committee-card__header">
                  <span className="committee-card__icon">{c.icon}</span>
                  <span className={`tag ${c.statusClass}`}>{c.status}</span>
                </div>
                <div className="committee-card__body">
                  <div className="committee-card__name">{c.name}</div>
                  <div className="committee-card__meta">{c.meta}</div>
                  <div className="committee-card__progress-label">
                    <span>Progress ({c.progressLabel})</span>
                    <span>{c.progress}%</span>
                  </div>
                  <div className="progress-wrap">
                    <div className="progress-bar" style={{ width: `${c.progress}%` }} />
                  </div>
                </div>
                <div className="committee-card__footer">
                  <div className="committee-card__avatars" aria-hidden="true">
                    {c.avatars.map((a) => (
                      <div key={a.i} className={`avatar avatar-sm ${a.c}`}>{a.i}</div>
                    ))}
                    <div className="avatar avatar-sm" style={{ background: 'var(--gray-400)' }}>{c.extra}</div>
                  </div>
                  <div className="committee-card__turn">
                    Turn: <strong>{c.turn}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <button onClick={goToDashboard} className="btn btn-primary">
              📊 Full Dashboard Dekho →
            </button>
          </div>
        </div>
      </section>

      {/* ── Reviews ── */}
      <section className="section section-alt" aria-labelledby="reviews-heading">
        <div className="container">
          <div className="section-heading">
            <div className="badge">❤️ Reviews</div>
            <h2 id="reviews-heading">Log kya kehte hain</h2>
            <p>Hazaron khush users Pakistan ke har sheher se.</p>
          </div>
          <div className="reviews__grid">
            {REVIEWS.map((r) => (
              <div key={r.name} className="review-card">
                <div className="review-card__stars">{r.stars}</div>
                <p className="review-card__text">{r.text}</p>
                <div className="review-card__author">
                  <div className={`avatar ${r.colorClass}`}>{r.initials}</div>
                  <div>
                    <div className="review-card__author-name">{r.name}</div>
                    <div className="review-card__author-loc">{r.loc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="section" aria-labelledby="pricing-heading">
        <div className="container">
          <div className="section-heading">
            <div className="badge">💳 Pricing</div>
            <h2 id="pricing-heading">Sab ke liye plan hai</h2>
            <p>Personal use se le kar bade groups tak — sab ke liye sahi plan maujood hai.</p>
          </div>
          <div className="pricing__grid">
            {PLANS.map((p) => (
              <div key={p.name} className={`pricing-card${p.popular ? ' pricing-card--popular' : ''}`}>
                {p.popular && <div className="pricing-card__popular-badge">⭐ Sabse Popular</div>}
                <div className="pricing-card__plan">{p.name}</div>
                <div className="pricing-card__price">
                  {p.price}<span>{p.period}</span>
                </div>
                <p className="pricing-card__desc">{p.desc}</p>
                <ul className="pricing-card__features">
                  {p.features.map((f) => (
                    <li key={f.text} className={f.ok ? '' : 'no'}>
                      {f.ok ? '✓' : '✗'} {f.text}
                    </li>
                  ))}
                </ul>
                <a
                  href={`/subscription?plan=${p.name.toLowerCase()}`}
                  className={`btn ${p.popular ? 'btn-primary' : 'btn-outline'}`}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {p.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="section section-alt" aria-labelledby="faq-heading">
        <div className="container">
          <div className="section-heading">
            <div className="badge">❓ FAQ</div>
            <h2 id="faq-heading">Aksar pooche gaye sawalaat</h2>
          </div>
          <div className="faq__list">
            {FAQS.map((f) => (
              <FaqItem key={f.q} q={f.q} a={f.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact ── */}
      <section id="contact" className="section section-alt contact-section" aria-labelledby="contact-heading">
        <div className="container">
          <div className="section-heading">
            <div className="badge">📬 Contact</div>
            <h2 id="contact-heading">Humse Rabta Karein</h2>
            <p>Koi sawal, masla, ya feedback? Hum yahan hain — seedha message karein.</p>
          </div>

          <div className="contact__grid">
            {/* ── Left: info cards ── */}
            <div className="contact__info">
              <div className="contact-info-card">
                <div className="contact-info-card__icon">📧</div>
                <div>
                  <div className="contact-info-card__label">Email</div>
                  <a href="mailto:haiderwahla199@gmail.com" className="contact-info-card__value">
                    haiderwahla199@gmail.com
                  </a>
                </div>
              </div>

              <div className="contact-info-card">
                <div className="contact-info-card__icon" style={{ background: '#e7f3ff', color: '#1877f2' }}>f</div>
                <div>
                  <div className="contact-info-card__label">Facebook</div>
                  <a
                    href="https://www.facebook.com/profile.php?id=100077446284306"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contact-info-card__value"
                  >
                    KametiPro Facebook Page
                  </a>
                </div>
              </div>

              <div className="contact-info-card">
                <div className="contact-info-card__icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>⏱</div>
                <div>
                  <div className="contact-info-card__label">Response Time</div>
                  <div className="contact-info-card__value" style={{ color: 'var(--gray-700)' }}>
                    24 ghante ke andar jawab milega
                  </div>
                </div>
              </div>

              <div className="contact__reach-out">
                <p>Ya seedha in platforms par message karein:</p>
                <div className="contact__social-btns">
                  <a
                    href="mailto:haiderwahla199@gmail.com"
                    className="contact__social-btn contact__social-btn--email"
                  >
                    📧 Email Karein
                  </a>
                  <a
                    href="https://www.facebook.com/profile.php?id=100077446284306"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contact__social-btn contact__social-btn--fb"
                  >
                    <span style={{ fontWeight: 800, fontSize: '1rem' }}>f</span> Facebook Message
                  </a>
                </div>
              </div>
            </div>

            {/* ── Right: form ── */}
            <ContactForm />
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="cta-banner" aria-labelledby="cta-heading">
        <div className="container">
          <h2 id="cta-heading">Abhi Free Shuru Karo</h2>
          <p>Android aur iOS par available — apni committee aaj se digital banao.</p>
          <button onClick={goToSignup} className="btn btn-white">🚀 Free Account Banao</button>
        </div>
      </section>    </>
  );
}
