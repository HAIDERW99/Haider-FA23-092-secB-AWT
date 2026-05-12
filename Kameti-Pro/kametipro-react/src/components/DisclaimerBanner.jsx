import { useState, useEffect } from 'react';

const STORAGE_KEY = 'kp_disclaimer_dismissed';

/**
 * DisclaimerBanner — sticky bottom bar shown once per login session.
 * Uses sessionStorage so it resets automatically when the browser tab/session
 * ends, and is also cleared explicitly on logout via authUtils.logout().
 */
export default function DisclaimerBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem(STORAGE_KEY);
    if (!dismissed) setVisible(true);
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        position:        'fixed',
        bottom:          0,
        left:            0,
        right:           0,
        zIndex:          9999,
        background:      'var(--green)',
        color:           'white',
        padding:         '14px 24px',
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'space-between',
        gap:             '16px',
        boxShadow:       '0 -4px 16px rgba(0,0,0,0.15)',
        flexWrap:        'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>⚠️</span>
        <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.5 }}>
          <strong>Disclaimer:</strong> KametiPro ek management tool hai.
          KametiPro kisi bhi financial nuqsan, jhagray, ya committee ke paisay se
          related maslay ka zimmedar nahi hai. Tamam financial transactions sirf
          committee members aur owners ke darmiyan hain.
        </p>
      </div>
      <button
        onClick={dismiss}
        aria-label="Disclaimer band karo"
        style={{
          background:    'rgba(255,255,255,0.25)',
          border:        '1.5px solid rgba(255,255,255,0.6)',
          color:         'white',
          borderRadius:  '8px',
          padding:       '6px 16px',
          fontSize:      '0.82rem',
          fontWeight:    '700',
          cursor:        'pointer',
          whiteSpace:    'nowrap',
          flexShrink:    0,
          transition:    'background 0.2s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.4)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; }}
      >
        Samajh Gaya ✓
      </button>
    </div>
  );
}
