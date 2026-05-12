import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  fetchCommittees,
  fetchPublicCommittees,
  sendJoinRequest,
  fetchIncomingRequests,
  respondToJoinRequest,
  toggleCommitteePublic,
} from '../api/committeeApi';
import { getUser, logout } from '../utils/authUtils';
import axiosInstance from '../api/axiosInstance';
import CreateCommitteeModal from '../components/CreateCommitteeModal';
import './Dashboard.css';

const FILTERS = ['All', 'Active', 'Pending'];

const AVATAR_COLORS = ['av-green', 'av-blue', 'av-purple', 'av-orange', 'av-pink', 'av-teal'];

function getAvatarColor(index) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

function CommitteeCard({ committee, onDelete, isOwner, onTogglePublic, togglePublicLoading }) {
  const { id, icon, name, amount, totalMembers, city, status, currentMonth, totalMonths, currentTurn, members, isPublic } = committee;
  const progress = Math.round((currentMonth / totalMonths) * 100);
  const paidCount = members?.filter((m) => m.paymentStatus === 'paid').length ?? 0;
  const pendingCount = members?.filter((m) => m.paymentStatus === 'due').length ?? 0;
  const displayAvatars = members?.slice(0, 3) ?? [];
  const extraCount = totalMembers - displayAvatars.length;

  const statusClass = status === 'active' ? 'tag-green' : 'tag-yellow';
  const statusLabel = status === 'active' ? 'Active' : `${pendingCount} Pending`;

  return (
    <article className="dash-committee-card" aria-label={`Committee: ${name}`}>
      <div className="dash-committee-card__top">
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div className="dash-committee-card__icon-wrap">{icon}</div>
          <div>
            <div className="dash-committee-card__name">{name}</div>
            <div className="dash-committee-card__meta">
              ₨{amount.toLocaleString()}/month • {totalMembers} members • {city}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className={`tag ${statusClass}`}>{statusLabel}</span>
          {isOwner && (
            <button
              onClick={() => onDelete(id, name)}
              title="Delete committee"
              style={{
                background: 'none',
                border: '1.5px solid var(--red)',
                color: 'var(--red)',
                borderRadius: '6px',
                padding: '3px 8px',
                fontSize: '0.75rem',
                fontWeight: '700',
                cursor: 'pointer',
                lineHeight: 1.4,
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--red)'; e.currentTarget.style.color = 'white'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--red)'; }}
              aria-label={`Delete ${name}`}
            >
              🗑 Delete
            </button>
          )}
        </div>
      </div>

      <div className="dash-committee-card__body">
        <div className="dash-committee-card__progress-row">
          <span>Progress (Month {currentMonth}/{totalMonths})</span>
          <span>{progress}%</span>
        </div>
        <div className="progress-wrap">
          <div className="progress-bar" style={{ width: `${progress}%` }} role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} />
        </div>

        <div className="dash-committee-card__stats">
          <div className="dash-stat">
            <div className="dash-stat__value">₨{(amount * currentMonth).toLocaleString()}</div>
            <div className="dash-stat__label">Collected</div>
          </div>
          <div className="dash-stat">
            <div className="dash-stat__value">{paidCount}/{totalMembers}</div>
            <div className="dash-stat__label">Paid this month</div>
          </div>
        </div>
      </div>

      <div className="dash-committee-card__footer">
        <div className="dash-committee-card__avatars" aria-hidden="true">
          {displayAvatars.map((m, i) => (
            <div key={m.id} className={`avatar avatar-sm ${m.colorClass || getAvatarColor(i)}`}>
              {m.initials}
            </div>
          ))}
          {extraCount > 0 && (
            <div className="avatar avatar-sm" style={{ background: 'var(--gray-400)' }}>
              +{extraCount}
            </div>
          )}
        </div>
        <div className="dash-committee-card__turn">
          Turn: <strong>{currentTurn}</strong>
        </div>
      </div>

      <div style={{ padding: '0 20px 16px' }}>
        {isOwner && (
          <button
            onClick={() => onTogglePublic(id, isPublic)}
            disabled={togglePublicLoading}
            style={{
              width: '100%', padding: '6px', marginBottom: '8px',
              background: isPublic ? '#fef9c3' : 'var(--gray-100)',
              color: isPublic ? '#92400e' : 'var(--gray-600)',
              border: isPublic ? '1.5px solid #fbbf24' : '1.5px solid var(--gray-300)',
              borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600',
              cursor: togglePublicLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {togglePublicLoading ? '...' : isPublic ? '🌐 Public (Private Karein)' : '🔒 Private (Public Karein)'}
          </button>
        )}
        <Link
          to={`/committee/${id}`}
          className="btn btn-outline btn-sm"
          style={{ width: '100%', justifyContent: 'center' }}
        >
          View Details →
        </Link>
      </div>
    </article>
  );
}

export default function Dashboard() {
  const [committees, setCommittees] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [showModal, setShowModal]   = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteConfirm, setDeleteConfirm]   = useState(null); // { id, name }
  const [deleteLoading, setDeleteLoading]   = useState(false);

  // ── Available Committees state ──────────────────────────────────────────────
  const [publicCommittees,    setPublicCommittees]    = useState([]);
  const [publicLoading,       setPublicLoading]       = useState(true);
  const [joinLoadingId,       setJoinLoadingId]       = useState(null); // committeeId being requested

  // ── Incoming Requests state (for committee owners) ──────────────────────────
  const [incomingRequests,    setIncomingRequests]    = useState([]);
  const [respondLoadingId,    setRespondLoadingId]    = useState(null);

  // ── Toggle public loading ───────────────────────────────────────────────────
  const [togglePublicLoadingId, setTogglePublicLoadingId] = useState(null);

  const user = getUser(); // { _id, name, email, ... }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchCommittees()
      .then((data) => { if (!cancelled) setCommittees(data); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    // Fetch public committees for "Available Committees" section
    fetchPublicCommittees()
      .then((data) => { if (!cancelled) setPublicCommittees(data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setPublicLoading(false); });

    // Fetch incoming join requests for committees I own
    fetchIncomingRequests()
      .then((data) => { if (!cancelled) setIncomingRequests(data); })
      .catch(() => { if (!cancelled) setIncomingRequests([]); });

    return () => { cancelled = true; };
  }, []);

  const handleCreateCommittee = () => {
    setShowModal(true);
  };

  const handleCommitteeSuccess = (message) => {
    setSuccessMessage(message);
    // Refresh committees data
    fetchCommittees()
      .then((data) => setCommittees(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    
    // Clear success message after 3 seconds
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleDeleteClick = (id, name) => {
    setDeleteConfirm({ id, name });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    setDeleteLoading(true);
    try {
      await axiosInstance.delete(`/committees/${deleteConfirm.id}`);
      setCommittees((prev) => prev.filter((c) => c.id !== deleteConfirm.id));
      setSuccessMessage(`"${deleteConfirm.name}" successfully delete ho gayi.`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Committee delete karte waqt koi masla hua.');
      setTimeout(() => setError(null), 4000);
    } finally {
      setDeleteLoading(false);
      setDeleteConfirm(null);
    }
  };

  const handleJoinRequest = async (committeeId) => {
    setJoinLoadingId(committeeId);
    try {
      await sendJoinRequest(committeeId);
      // Keep the card visible — only update the button state to "pending"
      // The card must NOT be removed from the list; user should see "Request Pending" status
      setPublicCommittees((prev) =>
        prev.map((c) => c._id === committeeId ? { ...c, myRequestStatus: 'pending' } : c)
      );
      setSuccessMessage('Request bhej di gayi! Owner ke jawab ka intezaar karein.');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      // On error, do NOT mutate publicCommittees — card stays as-is with the button
      setError(err.response?.data?.message || 'Request bhejte waqt koi masla hua.');
      setTimeout(() => setError(null), 4000);
    } finally {
      setJoinLoadingId(null);
    }
  };

  const handleRespondToRequest = async (requestId, action) => {
    setRespondLoadingId(requestId);
    try {
      await respondToJoinRequest(requestId, action);
      setIncomingRequests((prev) => prev.filter((r) => r._id !== requestId));
      setSuccessMessage(action === 'accept' ? 'Member add ho gaya.' : 'Request reject kar di gayi.');
      setTimeout(() => setSuccessMessage(''), 3000);
      // Refresh committees to show new member
      if (action === 'accept') {
        fetchCommittees().then((data) => setCommittees(data)).catch(() => {});
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Response dete waqt koi masla hua.');
      setTimeout(() => setError(null), 4000);
    } finally {
      setRespondLoadingId(null);
    }
  };

  const handleTogglePublic = async (committeeId, currentIsPublic) => {
    setTogglePublicLoadingId(committeeId);
    try {
      const res = await toggleCommitteePublic(committeeId);
      setCommittees((prev) =>
        prev.map((c) => c.id === committeeId ? { ...c, isPublic: res.isPublic } : c)
      );
      setSuccessMessage(res.message);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Toggle karte waqt koi masla hua.');
      setTimeout(() => setError(null), 4000);
    } finally {
      setTogglePublicLoadingId(null);
    }
  };

  const filtered = committees.filter((c) => {
    if (activeFilter === 'All')     return true;
    if (activeFilter === 'Active')  return c.status === 'active';
    if (activeFilter === 'Pending') return c.status === 'pending';
    return true;
  });

  // Summary stats derived from fetched data
  const totalCollected = committees.reduce((sum, c) => sum + c.amount * c.currentMonth, 0);
  const totalMembers   = committees.reduce((sum, c) => sum + (c.members?.length ?? 0), 0);
  const pendingCount   = committees.reduce((sum, c) => {
    return sum + (c.members?.filter((m) => m.paymentStatus === 'due').length ?? 0);
  }, 0);

  return (
    <main className="dashboard" aria-label="Dashboard">
      <div className="container">
        {/* Header */}
        <div className="dashboard__header">
          <div>
            <h1 className="dashboard__title">
              � Assalam o Alaikum, {user?.name?.split(' ')[0] || 'User'}!
            </h1>
            <p className="dashboard__subtitle">Apni saari committees ek jagah manage karo</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleCreateCommittee} className="btn btn-primary btn-sm">➕ New Committee</button>
            <button
              onClick={logout}
              className="btn btn-sm"
              style={{ background: 'transparent', border: '1.5px solid var(--red)', color: 'var(--red)' }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Summary cards */}
        {!loading && !error && (
          <div className="dashboard__summary">
            <div className="summary-card">
              <div className="summary-card__icon summary-card__icon--green">🏦</div>
              <div>
                <div className="summary-card__value">{committees.length}</div>
                <div className="summary-card__label">Total Committees</div>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-card__icon summary-card__icon--blue">👥</div>
              <div>
                <div className="summary-card__value">{totalMembers}</div>
                <div className="summary-card__label">Total Members</div>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-card__icon summary-card__icon--yellow">💰</div>
              <div>
                <div className="summary-card__value">₨{totalCollected.toLocaleString()}</div>
                <div className="summary-card__label">Total Collected</div>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-card__icon summary-card__icon--purple">⏰</div>
              <div>
                <div className="summary-card__value">{pendingCount}</div>
                <div className="summary-card__label">Pending Payments</div>
              </div>
            </div>
          </div>
        )}

        {/* Filter + grid */}
        <div className="section-header">
          <h2>Active Committees</h2>
          <span style={{ fontSize: '.85rem', color: 'var(--gray-500)' }}>
            {filtered.length} committee{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="filter-bar" role="group" aria-label="Filter committees">
          {FILTERS.map((f) => (
            <button
              key={f}
              className={`filter-btn${activeFilter === f ? ' active' : ''}`}
              onClick={() => setActiveFilter(f)}
              aria-pressed={activeFilter === f}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="spinner-wrap" aria-live="polite" aria-label="Loading committees">
            <div className="spinner" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="error-box" role="alert">
            <span>⚠️</span>
            <span>Committees load nahi ho sakein: {error}</span>
          </div>
        )}

        {/* Grid */}
        {!loading && !error && (
          <div className="dashboard__grid">
            {filtered.length > 0 ? (
              filtered.map((c) => (
                <CommitteeCard
                  key={c.id}
                  committee={c}
                  onDelete={handleDeleteClick}
                  isOwner={user && (c.admin === user._id || c.admin === user.id)}
                  onTogglePublic={handleTogglePublic}
                  togglePublicLoading={togglePublicLoadingId === c.id}
                />
              ))
            ) : (
              <div className="empty-state">
                <div className="empty-state__icon">📭</div>
                <h3>Koi committee nahi mili</h3>
                <p>Is filter ke liye koi committee available nahi hai.</p>
              </div>
            )}
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: 'var(--green)',
            color: 'white',
            padding: '1rem 1.5rem',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1001,
            animation: 'slideIn 0.3s ease-out'
          }}>
            ✅ {successMessage}
          </div>
        )}

        {/* ── Incoming Join Requests (visible to committee owners) ─────────── */}
        {committees.some((c) => user && (c.admin === user._id || c.admin === user.id)) && (
          <div style={{ marginTop: '48px' }}>
            <div className="section-header" style={{ marginBottom: '16px' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                📬 Incoming Join Requests
                {incomingRequests.length > 0 && (
                  <span style={{
                    background: 'var(--red)', color: 'white',
                    borderRadius: '999px', padding: '1px 8px',
                    fontSize: '0.75rem', fontWeight: '700',
                  }}>
                    {incomingRequests.length}
                  </span>
                )}
              </h2>
            </div>
            {incomingRequests.length === 0 ? (
              <div style={{
                background: 'white', border: '1px solid var(--gray-200)',
                borderRadius: 'var(--radius)', padding: '24px 20px',
                textAlign: 'center', color: 'var(--gray-400)',
                fontSize: '0.9rem', boxShadow: 'var(--shadow-sm)',
              }}>
                📭 Abhi koi join request nahi hai.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {incomingRequests.map((req) => (
                  <div
                    key={req._id}
                    style={{
                      background: 'white', border: '1px solid var(--gray-200)',
                      borderRadius: 'var(--radius)', padding: '16px 20px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      flexWrap: 'wrap', gap: '12px', boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '700', color: 'var(--gray-900)', marginBottom: '2px' }}>
                        {req.requester?.name || '—'}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--gray-500)' }}>
                        {req.requester?.phone} &nbsp;•&nbsp;
                        Committee: <strong>{req.committee?.name}</strong> &nbsp;•&nbsp;
                        ₨{req.committee?.monthlyContribution?.toLocaleString()}/month
                      </div>
                      {req.message && (
                        <div style={{ fontSize: '0.82rem', color: 'var(--gray-600)', marginTop: '4px', fontStyle: 'italic' }}>
                          "{req.message}"
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleRespondToRequest(req._id, 'accept')}
                        disabled={respondLoadingId === req._id}
                        style={{
                          padding: '7px 16px', borderRadius: '8px',
                          background: 'var(--green)', color: 'white',
                          border: 'none', fontWeight: '700', fontSize: '0.85rem',
                          cursor: respondLoadingId === req._id ? 'not-allowed' : 'pointer',
                          opacity: respondLoadingId === req._id ? 0.7 : 1,
                        }}
                      >
                        {respondLoadingId === req._id ? '...' : '✓ Accept'}
                      </button>
                      <button
                        onClick={() => handleRespondToRequest(req._id, 'reject')}
                        disabled={respondLoadingId === req._id}
                        style={{
                          padding: '7px 16px', borderRadius: '8px',
                          background: 'white', color: 'var(--red)',
                          border: '1.5px solid var(--red)', fontWeight: '700', fontSize: '0.85rem',
                          cursor: respondLoadingId === req._id ? 'not-allowed' : 'pointer',
                          opacity: respondLoadingId === req._id ? 0.7 : 1,
                        }}
                      >
                        ✕ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Available Committees (Browse & Join) ──────────────────────────── */}
        <div style={{
          marginTop: '56px',
          paddingTop: '40px',
          borderTop: '2px solid var(--gray-200)',
        }}>
          <div className="section-header" style={{ marginBottom: '8px' }}>
            <div>
              <h2>🌐 Dusron Ki Committees</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginTop: '4px' }}>
                Public committees jisme aap join request bhej sakte hain
              </p>
            </div>
          </div>

          {publicLoading ? (
            <div className="spinner-wrap"><div className="spinner" /></div>
          ) : publicCommittees.length === 0 ? (
            <div className="empty-state" style={{ gridColumn: 'unset', padding: '40px 24px' }}>
              <div className="empty-state__icon">🔍</div>
              <h3>Koi public committee nahi mili</h3>
              <p>Abhi koi committee publicly listed nahi hai.</p>
            </div>
          ) : (
            <div className="dashboard__grid">
              {publicCommittees.map((c) => {
                return (
                  <article
                    key={c._id}
                    className="dash-committee-card"
                    aria-label={`Available committee: ${c.name}`}
                  >
                    <div className="dash-committee-card__top">
                      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <div className="dash-committee-card__icon-wrap">🏦</div>
                        <div>
                          <div className="dash-committee-card__name">{c.name}</div>
                          <div className="dash-committee-card__meta">
                            ₨{c.monthlyContribution?.toLocaleString()}/month &nbsp;•&nbsp;
                            {c.totalMembers} members &nbsp;•&nbsp; {c.city || '—'}
                          </div>
                        </div>
                      </div>
                      <span className="tag tag-green">
                        {c.openSlots} slot{c.openSlots !== 1 ? 's' : ''} open
                      </span>
                    </div>

                    <div className="dash-committee-card__body">
                      {/* Owner info + rating */}
                      <div style={{
                        background: 'var(--gray-50)', borderRadius: '8px',
                        padding: '10px 12px', marginBottom: '12px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        flexWrap: 'wrap', gap: '6px',
                      }}>
                        <div style={{ fontSize: '0.82rem', color: 'var(--gray-700)' }}>
                          👤 <strong>{c.admin?.name || '—'}</strong>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{
                            background: 'var(--green-light)', color: 'var(--green-dark)',
                            padding: '2px 8px', borderRadius: '999px',
                            fontSize: '0.75rem', fontWeight: '700',
                          }}>
                            ⭐ {c.admin?.avgRating ?? 4.0}
                            {c.admin?.ratingCount > 0 && ` (${c.admin.ratingCount})`}
                          </span>
                          {c.admin?.isBeginner && (
                            <span style={{
                              background: '#fef9c3', color: '#92400e',
                              border: '1px solid #fbbf24',
                              padding: '2px 6px', borderRadius: '999px',
                              fontSize: '0.7rem', fontWeight: '700',
                            }}>
                              🌱 Beginner
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="dash-committee-card__stats">
                        <div className="dash-stat">
                          <div className="dash-stat__value">₨{c.monthlyContribution?.toLocaleString()}</div>
                          <div className="dash-stat__label">Per Month</div>
                        </div>
                        <div className="dash-stat">
                          <div className="dash-stat__value">{c.durationMonths} months</div>
                          <div className="dash-stat__label">Duration</div>
                        </div>
                      </div>
                    </div>

                    <div style={{ padding: '12px 20px 16px' }}>
                      {c.myRequestStatus === 'pending' ? (
                        <div style={{
                          width: '100%', padding: '8px',
                          background: '#fef9c3', color: '#92400e',
                          border: '1.5px solid #fbbf24',
                          borderRadius: '8px', textAlign: 'center',
                          fontSize: '0.85rem', fontWeight: '700',
                        }}>
                          ⏳ Request Pending
                        </div>
                      ) : c.myRequestStatus === 'accepted' ? (
                        <div style={{
                          width: '100%', padding: '8px',
                          background: 'var(--green-light)', color: 'var(--green-dark)',
                          border: '1.5px solid var(--green)',
                          borderRadius: '8px', textAlign: 'center',
                          fontSize: '0.85rem', fontWeight: '700',
                        }}>
                          ✓ Joined
                        </div>
                      ) : c.myRequestStatus === 'rejected' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{
                            textAlign: 'center', fontSize: '0.78rem',
                            fontWeight: '600', color: '#991b1b',
                          }}>
                            ✕ Request Reject Ho Gayi
                          </div>
                          <button
                            onClick={() => handleJoinRequest(c._id)}
                            disabled={joinLoadingId === c._id}
                            style={{
                              width: '100%', padding: '8px',
                              background: 'white', color: 'var(--green)',
                              border: '2px solid var(--green)',
                              borderRadius: '8px', fontSize: '0.85rem', fontWeight: '700',
                              cursor: joinLoadingId === c._id ? 'not-allowed' : 'pointer',
                              opacity: joinLoadingId === c._id ? 0.7 : 1,
                              transition: 'background 0.2s, color 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              if (joinLoadingId !== c._id) {
                                e.currentTarget.style.background = 'var(--green)';
                                e.currentTarget.style.color = 'white';
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'white';
                              e.currentTarget.style.color = 'var(--green)';
                            }}
                          >
                            {joinLoadingId === c._id ? 'Bhej raha hai...' : '🔄 Dobara Request Bhejo'}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleJoinRequest(c._id)}
                          disabled={joinLoadingId === c._id || c.openSlots === 0}
                          style={{
                            width: '100%', padding: '9px',
                            background: c.openSlots === 0 ? 'var(--gray-300)' : 'var(--green)',
                            color: 'white', border: 'none', borderRadius: '8px',
                            fontSize: '0.9rem', fontWeight: '700',
                            cursor: joinLoadingId === c._id || c.openSlots === 0 ? 'not-allowed' : 'pointer',
                            opacity: joinLoadingId === c._id ? 0.7 : 1,
                            transition: 'background 0.2s',
                          }}
                        >
                          {joinLoadingId === c._id
                            ? 'Bhej raha hai...'
                            : c.openSlots === 0
                            ? 'Committee Full'
                            : '📩 Request Bhejo'}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* Create Committee Modal */}
        <CreateCommitteeModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSuccess={handleCommitteeSuccess}
        />

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div style={{
            position: 'fixed', inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000,
          }}>
            <div style={{
              background: 'white', borderRadius: '16px',
              padding: '2rem', width: '90%', maxWidth: '420px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🗑️</div>
              <h2 style={{ margin: '0 0 0.5rem', color: 'var(--gray-900)', fontSize: '1.2rem' }}>
                Committee Delete Karen?
              </h2>
              <p style={{ color: 'var(--gray-500)', margin: '0 0 1.5rem', fontSize: '0.9rem' }}>
                <strong style={{ color: 'var(--gray-800)' }}>"{deleteConfirm.name}"</strong> aur uske
                saare payment records permanently delete ho jayenge. Yeh action wapas nahi ho sakta.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  disabled={deleteLoading}
                  style={{
                    padding: '0.75rem 1.5rem', borderRadius: '8px',
                    border: '2px solid var(--gray-300)', background: 'white',
                    color: 'var(--gray-700)', fontWeight: '600', cursor: 'pointer',
                    fontSize: '0.9rem',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleteLoading}
                  style={{
                    padding: '0.75rem 1.5rem', borderRadius: '8px',
                    border: 'none', background: 'var(--red)',
                    color: 'white', fontWeight: '700', cursor: deleteLoading ? 'not-allowed' : 'pointer',
                    fontSize: '0.9rem', opacity: deleteLoading ? 0.7 : 1,
                    minWidth: '120px',
                  }}
                >
                  {deleteLoading ? 'Deleting...' : '🗑 Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
