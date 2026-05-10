import { useState } from 'react';
import axiosInstance from '../api/axiosInstance';

export default function UpdatePaymentModal({ isOpen, onClose, onSuccess, committeeId, memberId, currentStatus, currentAmount }) {
  const [formData, setFormData] = useState({
    status: currentStatus ? currentStatus.toLowerCase() : 'due',
    paymentDate: '',
    amount: currentAmount || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data } = await axiosInstance.patch(`/committees/${committeeId}/payments/${memberId}`, formData);

      if (data.success) {
        onSuccess(data.message);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Payment update karte waqt koi masla hua.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="modal-content" style={{
        backgroundColor: 'white',
        padding: '2.5rem',
        borderRadius: '16px',
        width: '90%',
        maxWidth: '450px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>💳 Update Payment</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: 'var(--gray-500)'
            }}
          >
            ×
          </button>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'var(--red-light)',
            color: 'var(--red)',
            padding: '0.75rem',
            borderRadius: '6px',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Payment Status *
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '1rem',
                border: '2px solid var(--gray-200)',
                borderRadius: '8px',
                fontSize: '1rem',
                backgroundColor: 'white',
                cursor: 'pointer'
              }}
            >
              <option value="paid">✓ Paid</option>
              <option value="due">⏰ Due</option>
              <option value="upcoming">📅 Upcoming</option>
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Payment Date
            </label>
            <input
              type="date"
              name="paymentDate"
              value={formData.paymentDate}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '1rem',
                border: '2px solid var(--gray-200)',
                borderRadius: '8px',
                fontSize: '1rem',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--green)';
                e.target.style.boxShadow = '0 0 0 3px rgba(34, 197, 94, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--gray-200)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Amount (Rs)
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              min="0"
              step="0.01"
              style={{
                width: '100%',
                padding: '1rem',
                border: '2px solid var(--gray-200)',
                borderRadius: '8px',
                fontSize: '1rem',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--green)';
                e.target.style.boxShadow = '0 0 0 3px rgba(34, 197, 94, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--gray-200)';
                e.target.style.boxShadow = 'none';
              }}
              placeholder="5000"
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.875rem 2rem',
                border: '2px solid var(--red)',
                backgroundColor: 'white',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                color: 'var(--red)',
                transition: 'all 0.2s ease'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.875rem 2rem',
                backgroundColor: loading ? 'var(--gray-400)' : 'var(--green)',
                color: 'white',
                border: '2px solid var(--green)',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                transition: 'all 0.2s ease',
                minWidth: '120px'
              }}
            >
              {loading ? 'Updating...' : 'Update Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
