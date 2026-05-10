import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { isLoggedIn } from '../utils/authUtils';
import './Subscription.css';

// ─── Plan data ────────────────────────────────────────────────────────────────
const PLANS = {
  free: {
    id: 'free', name: 'Free', price: 0, period: 'month',
    badge: null,
    desc: 'Personal use ke liye perfect — bilkul free.',
    color: 'var(--gray-700)',
    features: ['1 Committee', 'Up to 10 members', 'Basic reminders'],
  },
  pro: {
    id: 'pro', name: 'Pro', price: 499, period: 'month',
    badge: '⭐ Sabse Popular',
    desc: 'Active committee organizers ke liye best choice.',
    color: 'var(--green)',
    features: ['10 Committees', 'Unlimited members', 'WhatsApp + SMS reminders', 'PDF reports & exports', 'Priority support'],
  },
  business: {
    id: 'business', name: 'Business', price: 1499, period: 'month',
    badge: '🏢 Enterprise',
    desc: 'Professional managers aur organizations ke liye.',
    color: '#7c3aed',
    features: ['Unlimited committees', 'Unlimited members', 'Custom branding', 'Advanced analytics', 'Dedicated support'],
  },
};

const PAYMENT_METHODS = [
  {
    id: 'jazzcash',
    label: 'JazzCash',
    icon: '📱',
    color: '#e8001c',
    bg: '#fff0f0',
    desc: 'JazzCash mobile account se pay karein',
    fields: [{ name: 'mobileNumber', label: 'JazzCash Mobile Number', placeholder: '03001234567', type: 'tel' }],
  },
  {
    id: 'easypaisa',
    label: 'Easypaisa',
    icon: '💚',
    color: '#00a651',
    bg: '#f0fff4',
    desc: 'Easypaisa account se pay karein',
    fields: [{ name: 'mobileNumber', label: 'Easypaisa Mobile Number', placeholder: '03001234567', type: 'tel' }],
  },
  {
    id: 'card',
    label: 'Debit / Credit Card',
    icon: '💳',
    color: '#1d4ed8',
    bg: '#eff6ff',
    desc: 'Visa, Mastercard ya koi bhi bank card',
    fields: [
      { name: 'cardNumber',  label: 'Card Number',       placeholder: '1234 5678 9012 3456', type: 'text', maxLen: 19 },
      { name: 'cardName',    label: 'Card Holder Name',  placeholder: 'Muhammad Ahmed',       type: 'text' },
      { name: 'expiry',      label: 'Expiry (MM/YY)',    placeholder: 'MM/YY',                type: 'text', maxLen: 5 },
      { name: 'cvv',         label: 'CVV',               placeholder: '123',                  type: 'password', maxLen: 4 },
    ],
  },
  {
    id: 'bank',
    label: 'Bank Transfer',
    icon: '🏦',
    color: '#92400e',
    bg: '#fffbeb',
    desc: 'Direct bank transfer (IBFT)',
    fields: [{ name: 'bankName', label: 'Bank Name', placeholder: 'HBL / MCB / UBL...', type: 'text' }],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatCard(val) {
  return val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}
function formatExpiry(val) {
  const digits = val.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
  return digits;
}

// ─── Step indicator ───────────────────────────────────────────────────────────
function Steps({ current }) {
  const steps = ['Plan Chunein', 'Payment Method', 'Details Bharein', 'Confirm'];
  return (
    <div className="sub-steps">
      {steps.map((s, i) => (
        <div key={s} className={`sub-step ${i < current ? 'done' : i === current ? 'active' : ''}`}>
          <div className="sub-step__circle">{i < current ? '✓' : i + 1}</div>
          <span className="sub-step__label">{s}</span>
          {i < steps.length - 1 && <div className="sub-step__line" />}
        </div>
      ))}
    </div>
  );
}

// ─── Plan selector ────────────────────────────────────────────────────────────
function PlanStep({ selected, onSelect, onNext }) {
  return (
    <div className="sub-card">
      <h2 className="sub-card__title">Apna Plan Chunein</h2>
      <p className="sub-card__sub">Kabhi bhi upgrade ya downgrade kar sakte hain.</p>
      <div className="plan-grid">
        {Object.values(PLANS).map((p) => (
          <button
            key={p.id}
            className={`plan-option ${selected === p.id ? 'selected' : ''}`}
            onClick={() => onSelect(p.id)}
            style={{ '--plan-color': p.color }}
          >
            {p.badge && <span className="plan-option__badge">{p.badge}</span>}
            <div className="plan-option__name">{p.name}</div>
            <div className="plan-option__price">
              {p.price === 0 ? 'Free' : `₨${p.price.toLocaleString()}`}
              {p.price > 0 && <span>/{p.period}</span>}
            </div>
            <p className="plan-option__desc">{p.desc}</p>
            <ul className="plan-option__features">
              {p.features.map((f) => <li key={f}>✓ {f}</li>)}
            </ul>
          </button>
        ))}
      </div>
      <button
        className="btn btn-primary sub-next-btn"
        onClick={onNext}
        disabled={!selected}
      >
        Aage Barho →
      </button>
    </div>
  );
}

// ─── Payment method selector ──────────────────────────────────────────────────
function MethodStep({ plan, selected, onSelect, onNext, onBack }) {
  const p = PLANS[plan];
  if (p.price === 0) {
    // Free plan — skip payment
    return (
      <div className="sub-card">
        <h2 className="sub-card__title">Free Plan — Koi Payment Nahi</h2>
        <p className="sub-card__sub">Free plan ke liye koi payment ki zaroorat nahi. Seedha activate ho jata hai.</p>
        <div className="free-confirm-box">
          <div style={{ fontSize: '3rem' }}>🎉</div>
          <div>
            <strong>Free Plan</strong> — ₨0/month
            <p>1 Committee • 10 Members • Basic Reminders</p>
          </div>
        </div>
        <div className="sub-btn-row">
          <button className="btn btn-outline" onClick={onBack}>← Wapas</button>
          <button className="btn btn-primary sub-next-btn" onClick={onNext}>Activate Karein ✓</button>
        </div>
      </div>
    );
  }
  return (
    <div className="sub-card">
      <h2 className="sub-card__title">Payment Method Chunein</h2>
      <p className="sub-card__sub">
        <strong style={{ color: p.color }}>{p.name} Plan</strong> — ₨{p.price.toLocaleString()}/month
      </p>
      <div className="method-grid">
        {PAYMENT_METHODS.map((m) => (
          <button
            key={m.id}
            className={`method-option ${selected === m.id ? 'selected' : ''}`}
            onClick={() => onSelect(m.id)}
            style={{ '--method-color': m.color, '--method-bg': m.bg }}
          >
            <span className="method-option__icon">{m.icon}</span>
            <span className="method-option__label">{m.label}</span>
            <span className="method-option__desc">{m.desc}</span>
          </button>
        ))}
      </div>
      <div className="sub-btn-row">
        <button className="btn btn-outline" onClick={onBack}>← Wapas</button>
        <button className="btn btn-primary sub-next-btn" onClick={onNext} disabled={!selected}>
          Aage Barho →
        </button>
      </div>
    </div>
  );
}

// ─── Payment details form ─────────────────────────────────────────────────────
function DetailsStep({ plan, method, onNext, onBack }) {
  const p = PLANS[plan];
  const m = PAYMENT_METHODS.find((x) => x.id === method);
  const [fields, setFields] = useState({});
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    let { name, value } = e.target;
    if (name === 'cardNumber') value = formatCard(value);
    if (name === 'expiry')     value = formatExpiry(value);
    if (name === 'cvv')        value = value.replace(/\D/g, '').slice(0, 4);
    setFields((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const e = {};
    m.fields.forEach((f) => {
      if (!fields[f.name]?.trim()) e[f.name] = `${f.label} zaroor bharein`;
    });
    if (fields.mobileNumber && !/^(03\d{9}|\+923\d{9})$/.test(fields.mobileNumber.replace(/\s/g, ''))) {
      e.mobileNumber = 'Valid Pakistani number likhein (e.g. 03001234567)';
    }
    if (fields.cardNumber && fields.cardNumber.replace(/\s/g, '').length < 16) {
      e.cardNumber = '16 digit card number likhein';
    }
    if (fields.expiry && !/^\d{2}\/\d{2}$/.test(fields.expiry)) {
      e.expiry = 'MM/YY format mein likhein';
    }
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onNext(fields);
  };

  return (
    <div className="sub-card">
      <h2 className="sub-card__title">{m.icon} {m.label} Details</h2>
      <div className="payment-summary-bar">
        <span style={{ color: p.color, fontWeight: 700 }}>{p.name} Plan</span>
        <span>₨{p.price.toLocaleString()}/month</span>
      </div>

      {method === 'bank' && (
        <div className="bank-info-box">
          <h4>Bank Transfer Details</h4>
          <div className="bank-info-row"><span>Bank:</span><strong>HBL</strong></div>
          <div className="bank-info-row"><span>Account Title:</span><strong>KametiPro Pvt Ltd</strong></div>
          <div className="bank-info-row"><span>Account No:</span><strong>1234-5678-9012</strong></div>
          <div className="bank-info-row"><span>IBAN:</span><strong>PK36HABB0000001234567890</strong></div>
          <p className="bank-info-note">
            Transfer ke baad neeche apna bank naam likhein aur "Confirm" karein.
            Hum 1-2 business days mein verify karenge.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {m.fields.map((f) => (
          <div className="sub-field" key={f.name}>
            <label htmlFor={`sf-${f.name}`}>{f.label}</label>
            <input
              id={`sf-${f.name}`}
              name={f.name}
              type={f.type}
              value={fields[f.name] || ''}
              onChange={handleChange}
              placeholder={f.placeholder}
              maxLength={f.maxLen}
              className={errors[f.name] ? 'error' : ''}
              autoComplete="off"
            />
            {errors[f.name] && <span className="sub-field__error">{errors[f.name]}</span>}
          </div>
        ))}

        <div className="sub-secure-note">
          🔒 Aapki payment information 256-bit SSL encryption se secure hai.
        </div>

        <div className="sub-btn-row">
          <button type="button" className="btn btn-outline" onClick={onBack}>← Wapas</button>
          <button type="submit" className="btn btn-primary sub-next-btn">
            ₨{p.price.toLocaleString()} Pay Karein →
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Confirmation ─────────────────────────────────────────────────────────────
function ConfirmStep({ plan, method, paymentFields, onConfirm, loading, onBack }) {
  const p = PLANS[plan];
  const m = PAYMENT_METHODS.find((x) => x.id === method) || { label: 'N/A', icon: '' };
  const today = new Date();
  const nextBilling = new Date(today.setMonth(today.getMonth() + 1)).toLocaleDateString('en-PK', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="sub-card">
      <h2 className="sub-card__title">Order Confirm Karein</h2>
      <div className="confirm-box">
        <div className="confirm-row">
          <span>Plan</span>
          <strong style={{ color: p.color }}>{p.name}</strong>
        </div>
        <div className="confirm-row">
          <span>Amount</span>
          <strong>{p.price === 0 ? 'Free' : `₨${p.price.toLocaleString()}/month`}</strong>
        </div>
        {p.price > 0 && (
          <>
            <div className="confirm-row">
              <span>Payment Method</span>
              <strong>{m.icon} {m.label}</strong>
            </div>
            {paymentFields?.mobileNumber && (
              <div className="confirm-row">
                <span>Mobile Number</span>
                <strong>{paymentFields.mobileNumber}</strong>
              </div>
            )}
            {paymentFields?.cardNumber && (
              <div className="confirm-row">
                <span>Card</span>
                <strong>**** **** **** {paymentFields.cardNumber.replace(/\s/g, '').slice(-4)}</strong>
              </div>
            )}
            <div className="confirm-row">
              <span>Next Billing</span>
              <strong>{nextBilling}</strong>
            </div>
          </>
        )}
      </div>

      <p className="confirm-terms">
        "Confirm" karne se aap hamare{' '}
        <a href="#" style={{ color: 'var(--green)' }}>Terms of Service</a> aur{' '}
        <a href="#" style={{ color: 'var(--green)' }}>Privacy Policy</a> se agree karte hain.
        Subscription kabhi bhi cancel ki ja sakti hai.
      </p>

      <div className="sub-btn-row">
        <button className="btn btn-outline" onClick={onBack} disabled={loading}>← Wapas</button>
        <button className="btn btn-primary sub-next-btn" onClick={onConfirm} disabled={loading}>
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="sub-spinner" /> Processing...
            </span>
          ) : (
            p.price === 0 ? 'Activate Karein ✓' : `₨${p.price.toLocaleString()} Confirm & Pay`
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Success ──────────────────────────────────────────────────────────────────
function SuccessStep({ plan }) {
  const navigate = useNavigate();
  const p = PLANS[plan];
  return (
    <div className="sub-card sub-success">
      <div className="sub-success__icon">🎉</div>
      <h2>Mubarak Ho!</h2>
      <p>
        <strong style={{ color: p.color }}>{p.name} Plan</strong> successfully activate ho gaya.
        {p.price > 0 && ' Aapke account se ₨' + p.price.toLocaleString() + ' deduct ho jayenge.'}
      </p>
      <div className="sub-success__features">
        {p.features.map((f) => (
          <div key={f} className="sub-success__feature">✓ {f}</div>
        ))}
      </div>
      <button className="btn btn-primary" style={{ marginTop: 24 }} onClick={() => navigate('/dashboard')}>
        Dashboard par Jao →
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Subscription() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialPlan = searchParams.get('plan') || null;

  const [step, setStep]           = useState(initialPlan ? 1 : 0);
  const [plan, setPlan]           = useState(initialPlan || null);
  const [method, setMethod]       = useState(null);
  const [paymentFields, setPaymentFields] = useState(null);
  const [loading, setLoading]     = useState(false);
  const [done, setDone]           = useState(false);

  const loggedIn = isLoggedIn();

  // Step navigation
  const goNext = () => setStep((s) => s + 1);
  const goBack = () => setStep((s) => s - 1);

  // Step 0 → 1: plan selected
  const handlePlanNext = () => {
    if (!plan) return;
    if (PLANS[plan].price === 0) { setStep(2); } // skip method for free
    else setStep(1);
  };

  // Step 1 → 2: method selected
  const handleMethodNext = () => {
    if (!method) return;
    setStep(2);
  };

  // Step 2 → 3: details filled
  const handleDetailsNext = (fields) => {
    setPaymentFields(fields);
    setStep(3);
  };

  // Step 3: confirm & pay
  const handleConfirm = async () => {
    if (!loggedIn) { navigate('/login'); return; }
    setLoading(true);
    // Simulate payment processing (replace with real gateway SDK call)
    await new Promise((r) => setTimeout(r, 2200));
    setLoading(false);
    setDone(true);
  };

  // Free plan direct activate (from method step)
  const handleFreeActivate = async () => {
    if (!loggedIn) { navigate('/login'); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    setDone(true);
  };

  const currentStep = PLANS[plan]?.price === 0
    ? [0, 1, 2, 3].indexOf(step) === -1 ? 0 : (step === 0 ? 0 : step === 1 ? 1 : step === 2 ? 2 : 3)
    : step;

  return (
    <main className="sub-page">
      <div className="container">
        <div className="sub-header">
          <button className="sub-back-link" onClick={() => navigate('/#pricing')}>
            ← Pricing par wapas jao
          </button>
          <h1>Subscription</h1>
          <p>Apna plan chunein aur KametiPro ka poora faida uthayein.</p>
        </div>

        {!done && <Steps current={step} />}

        <div className="sub-content">
          {done ? (
            <SuccessStep plan={plan} />
          ) : step === 0 ? (
            <PlanStep
              selected={plan}
              onSelect={setPlan}
              onNext={handlePlanNext}
            />
          ) : step === 1 ? (
            <MethodStep
              plan={plan}
              selected={method}
              onSelect={setMethod}
              onNext={handleMethodNext}
              onBack={() => setStep(0)}
            />
          ) : step === 2 ? (
            PLANS[plan]?.price === 0 ? (
              <MethodStep
                plan={plan}
                selected={method}
                onSelect={setMethod}
                onNext={handleFreeActivate}
                onBack={() => setStep(0)}
              />
            ) : (
              <DetailsStep
                plan={plan}
                method={method}
                onNext={handleDetailsNext}
                onBack={() => setStep(1)}
              />
            )
          ) : (
            <ConfirmStep
              plan={plan}
              method={method}
              paymentFields={paymentFields}
              onConfirm={handleConfirm}
              loading={loading}
              onBack={() => setStep(2)}
            />
          )}
        </div>
      </div>
    </main>
  );
}
