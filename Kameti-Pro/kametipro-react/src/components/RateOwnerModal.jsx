import { useState } from 'react';
import { rateCommitteeOwner } from '../api/committeeApi';

/**
 * RateOwnerModal — lets a committee member rate the owner (1–5 stars).
 * Props:
 *   isOpen        {boolean}
 *   onClose       {() => void}
 *   onSuccess     {(avgRating, count) => void}
 *   committeeId   {string}
 *   ownerName     {string}
 *   currentRating {number|null}  — user's existing rating if any
 */
export default function RateOwnerModal({
  isOpen, onClose, onSuccess, committeeId, ownerName, currentRating,
}) {
  const [selected, setSelected] = useState(currentRating || 0);
  const [hovered,  setHovered]  = useState(0);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selected) {
      setError('Koi star select karein.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await rateCommitteeOwner(committeeId, selected);
      onSuccess(res.ownerAvgRating, res.ratingCount, res.isBeginner);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Rating dete waqt koi masla hua.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const display = hovered || selected;

  const labels = ['', 'Bohot Bura', 'Bura', 'Theek Hai', 'Acha', 'Bohot Acha'];

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: 'white', borderRadius: '16px',
          padding: '2.5rem', width: '90%', maxWidth: '420px',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
          textAlign: 'center',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, color: 'var(--gray-900)', fontSize: '1.15rem' }}>
            ⭐ Owner Ko Rate Karein
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--gray-500)' }}
          >
            ×
          </button>
        </div>

        <p style={{ color: 'var(--gray-500)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          <strong style={{ color: 'var(--gray-800)' }}>{ownerName}</strong> ko rate karein
        </p>

        {/* Stars */}
        <div
          style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}
          role="group"
          aria-label="Star rating"
        >
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setSelected(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              aria-label={`${star} star`}
              aria-pressed={selected === star}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '2.2rem', padding: '2px',
                color: star <= display ? 'var(--yellow)' : 'var(--gray-200)',
                transition: 'color 0.15s, transform 0.1s',
                transform: star <= display ? 'scale(1.15)' : 'scale(1)',
              }}
            >
              ★
            </button>
          ))}
        </div>

        <p style={{ color: 'var(--gray-500)', fontSize: '0.85rem', marginBottom: '1.5rem', minHeight: '1.2em' }}>
          {display ? labels[display] : 'Star select karein'}
        </p>

        {error && (
          <div style={{
            background: '#fee2e2', color: '#991b1b',
            padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem',
            fontSize: '0.85rem',
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.75rem 1.5rem', borderRadius: '8px',
              border: '2px solid var(--gray-300)', background: 'white',
              color: 'var(--gray-700)', fontWeight: '600', cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !selected}
            style={{
              padding: '0.75rem 1.5rem', borderRadius: '8px',
              border: 'none',
              background: loading || !selected ? 'var(--gray-400)' : 'var(--green)',
              color: 'white', fontWeight: '700',
              cursor: loading || !selected ? 'not-allowed' : 'pointer',
              minWidth: '120px',
            }}
          >
            {loading ? 'Saving...' : currentRating ? 'Update Karein' : 'Rate Karein'}
          </button>
        </div>
      </div>
    </div>
  );
}
