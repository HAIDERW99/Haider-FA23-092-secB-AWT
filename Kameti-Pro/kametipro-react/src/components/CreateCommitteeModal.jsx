import { useState } from 'react';
import axiosInstance from '../api/axiosInstance';

export default function CreateCommitteeModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    monthlyAmount: '',
    totalMembers: '',
    startDate: '',
    description: ''
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
      // Map frontend fields to backend expected fields
      const payload = {
        name: formData.name,
        monthlyContribution: parseFloat(formData.monthlyAmount),
        durationMonths: parseInt(formData.totalMembers), // Backend uses durationMonths for total members
        startDate: formData.startDate,
        description: formData.description,
        city: 'Unknown', // Default value since it's required by backend
        strategy: 'sequential' // Default strategy
      };

      const token = localStorage.getItem('token');
      const { data } = await axiosInstance.post('/committees', payload, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (data.success) {
        onSuccess('Committee ban gayi!');
        onClose();
        setFormData({
          name: '',
          monthlyAmount: '',
          totalMembers: '',
          startDate: '',
          description: ''
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Committee create karte waqt koi masla hua.');
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
        maxWidth: '520px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>🏦 New Committee</h2>
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
              Committee Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
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
              placeholder="Mera Family Group"
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Monthly Amount in Rs *
            </label>
            <input
              type="number"
              name="monthlyAmount"
              value={formData.monthlyAmount}
              onChange={handleChange}
              required
              min="1"
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

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Total Members *
            </label>
            <input
              type="number"
              name="totalMembers"
              value={formData.totalMembers}
              onChange={handleChange}
              required
              min="2"
              max="60"
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
              placeholder="12"
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Start Date *
            </label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              required
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
              Description (Optional)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              style={{
                width: '100%',
                padding: '1rem',
                border: '2px solid var(--gray-200)',
                borderRadius: '8px',
                fontSize: '1rem',
                resize: 'vertical',
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
              placeholder="Hamari family ki monthly savings committee..."
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
                minWidth: '160px'
              }}
            >
              {loading ? 'Creating...' : 'Committee Banao'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
