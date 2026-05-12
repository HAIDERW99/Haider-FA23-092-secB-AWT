import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchCommitteeById, fetchMyRatingForCommittee, updateMeritScore } from '../api/committeeApi';
import { getUser } from '../utils/authUtils';
import axiosInstance from '../api/axiosInstance';
import AddMemberModal from '../components/AddMemberModal';
import UpdatePaymentModal from '../components/UpdatePaymentModal';
import RateOwnerModal from '../components/RateOwnerModal';
import './CommitteeDetail.css';

// ─── Status badge ─────────────────────────────────────────────────────────────

function PaymentStatusBadge({ status }) {
  const key = (status || '').toLowerCase();
  const map = {
    paid:     { label: '✓ Paid',     className: 'tag tag-green' },
    due:      { label: '⏰ Due',      className: 'tag tag-yellow' },
    upcoming: { label: '📅 Upcoming', className: 'tag', style: { background: '#eff6ff', color: '#1d4ed8' } },
  };
  const cfg = map[key] ?? { label: status, className: 'tag' };
  return <span className={cfg.className} style={cfg.style}>{cfg.label}</span>;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CommitteeDetail() {
  const { id } = useParams();
  const [committee, setCommittee] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showUpdatePaymentModal, setShowUpdatePaymentModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // ── Rating state ────────────────────────────────────────────────────────────
  const [showRateModal,  setShowRateModal]  = useState(false);
  const [ownerAvgRating, setOwnerAvgRating] = useState(null);
  const [ratingCount,    setRatingCount]    = useState(0);
  const [myRating,       setMyRating]       = useState(null);
  const [isBeginner,     setIsBeginner]     = useState(true);

  // ── Merit score edit state ──────────────────────────────────────────────────
  const [editingMeritId,    setEditingMeritId]    = useState(null); // memberId being edited
  const [meritInputValue,   setMeritInputValue]   = useState('');
  const [meritSaving,       setMeritSaving]       = useState(false);

  const currentUser = getUser();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchCommitteeById(id)
      .then((data) => { 
        if (!cancelled) {
          console.log('Committee data received:', data);
          setCommittee(data); 
        }
      })
      .catch((err) => { 
        if (!cancelled) {
          console.error('Committee fetch error:', err);
          setError(err.message); 
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    // Fetch rating info for this committee
    fetchMyRatingForCommittee(id)
      .then((res) => {
        if (!cancelled) {
          setMyRating(res.myRating);
          setOwnerAvgRating(res.avgRating);
          setRatingCount(res.ratingCount);
          setIsBeginner(res.isBeginner ?? true);
        }
      })
      .catch(() => {}); // non-critical

    return () => { cancelled = true; };
  }, [id]);

  const handleAddMemberSuccess = (message) => {
    setSuccessMessage(message);
    setShowAddMemberModal(false);
    // Refresh committee data
    fetchCommitteeById(id)
      .then((data) => setCommittee(data))
      .catch((err) => setError(err.message));
    
    // Clear success message after 3 seconds
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleUpdatePaymentSuccess = (message) => {
    setSuccessMessage(message);
    setShowUpdatePaymentModal(false);
    setSelectedMember(null);
    // Refresh committee data
    fetchCommitteeById(id)
      .then((data) => setCommittee(data))
      .catch((err) => setError(err.message));
    
    // Clear success message after 3 seconds
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleRemoveMember = async (memberId) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    
    try {
      const token = localStorage.getItem('kp_token');
      const { data } = await axiosInstance.delete(`/committees/${id}/members/${memberId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (data.success) {
        setSuccessMessage(data.message);
        // Refresh committee data
        fetchCommitteeById(id)
          .then((data) => setCommittee(data))
          .catch((err) => setError(err.message));
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Member remove karte waqt koi masla hua.');
    }
  };

  // ── Merit score save ────────────────────────────────────────────────────────
  const handleMeritSave = async (memberId) => {
    const score = parseInt(meritInputValue, 10);
    if (isNaN(score) || score < 0 || score > 100) {
      alert('Score 0 se 100 ke darmiyan hona chahiye.');
      return;
    }
    setMeritSaving(true);
    try {
      await updateMeritScore(id, memberId, score);
      // Update local state immediately
      setCommittee((prev) => ({
        ...prev,
        members: prev.members.map((m) =>
          m.id === memberId ? { ...m, meritScore: score } : m
        ),
      }));
      setEditingMeritId(null);
      setSuccessMessage('Merit score update ho gaya.');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Merit score save karte waqt koi masla hua.');
    } finally {
      setMeritSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="detail" aria-label="Loading committee details">
        <div className="container">
          <div className="spinner-wrap"><div className="spinner" /></div>
        </div>
      </main>
    );
  }

  if (!committee) {
    return (
      <main className="detail">
        <div className="container">
          <div className="error-box" role="alert">
            <span>⚠️</span>
            <span>Committee data not available</span>
          </div>
          <Link to="/dashboard" className="btn btn-outline" style={{ marginTop: 16 }}>
            ← Dashboard par wapas jao
          </Link>
        </div>
      </main>
    );
  }

  const {
    icon, name, amount, totalMembers, city, status,
    currentMonth, totalMonths, currentTurn, members = [],
    admin, adminName
  } = committee || {};

  const isAdmin = currentUser && admin && (admin === currentUser._id || admin === currentUser.id);
  const progress = Math.round((currentMonth / totalMonths) * 100);
  const paidCount     = members.filter((m) => m.paymentStatus === 'paid').length;
  const dueCount      = members.filter((m) => m.paymentStatus === 'due').length;
  const upcomingCount = members.filter((m) => m.paymentStatus === 'upcoming').length;
  const collected = amount * currentMonth;
  const remaining = amount * (totalMonths - currentMonth);

  const filteredMembers = members.filter((m) =>
    statusFilter === 'all' ? true : m.paymentStatus === statusFilter
  );

  return (
    <main className="detail" aria-label={`Committee detail: ${name}`}>
      <div className="container">

        {/* Breadcrumb */}
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span className="breadcrumb__sep">›</span>
          <Link to="/dashboard">Dashboard</Link>
          <span className="breadcrumb__sep">›</span>
          <span aria-current="page">{name}</span>
        </nav>

        {/* Hero card */}
        <div className="detail__hero">
          <div className="detail__hero-left">
            <div className="detail__hero-icon">{icon}</div>
            <div>
              <div className="detail__hero-name">
                {name}
                {isAdmin && (
                  <span style={{
                    background: 'rgba(255,255,255,0.3)',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    marginLeft: '8px'
                  }}>
                    ADMIN
                  </span>
                )}
              </div>
              <div className="detail__hero-meta">
                ₨{amount.toLocaleString()}/month &nbsp;•&nbsp; {totalMembers} members &nbsp;•&nbsp; {city}
              </div>
            </div>
          </div>
          <span className="detail__hero-status">{status}</span>
        </div>

        {/* ── Owner Rating bar ─────────────────────────────────────────────── */}
        <div style={{
          background: 'white', border: '1px solid var(--gray-200)',
          borderRadius: 'var(--radius)', padding: '14px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '12px', marginBottom: '8px',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--gray-600)' }}>
              Owner: <strong style={{ color: 'var(--gray-900)' }}>{adminName || '—'}</strong>
            </span>
            {/* Always show a rating — default 4.0 for new owners */}
            <span style={{
              background: 'var(--green-light)', color: 'var(--green-dark)',
              padding: '3px 10px', borderRadius: '999px',
              fontSize: '0.82rem', fontWeight: '700',
            }}>
              ⭐ {ownerAvgRating ?? 4.0}
              {ratingCount > 0 && ` (${ratingCount} rating${ratingCount !== 1 ? 's' : ''})`}
            </span>
            {/* Beginner badge — shown until 5 real ratings */}
            {isBeginner && (
              <span style={{
                background: '#fef9c3', color: '#92400e',
                border: '1px solid #fbbf24',
                padding: '2px 8px', borderRadius: '999px',
                fontSize: '0.75rem', fontWeight: '700',
              }}>
                🌱 Beginner
              </span>
            )}
          </div>
          {!isAdmin && (
            <button
              onClick={() => setShowRateModal(true)}
              style={{
                padding: '6px 16px', borderRadius: '8px',
                background: myRating ? 'var(--green-light)' : 'var(--green)',
                color: myRating ? 'var(--green-dark)' : 'white',
                border: myRating ? '1.5px solid var(--green)' : 'none',
                fontWeight: '600', fontSize: '0.82rem', cursor: 'pointer',
              }}
            >
              {myRating ? `⭐ Aapki Rating: ${myRating}/5 (Update)` : '⭐ Owner Ko Rate Karein'}
            </button>
          )}
        </div>

        {/* Stats row */}
        <div className="detail__stats">
          <div className="detail-stat">
            <div className="detail-stat__label">Total Collected</div>
            <div className="detail-stat__value">₨{collected.toLocaleString()}</div>
            <div className="detail-stat__sub">Month {currentMonth} of {totalMonths}</div>
          </div>
          <div className="detail-stat">
            <div className="detail-stat__label">Remaining</div>
            <div className="detail-stat__value">₨{remaining.toLocaleString()}</div>
            <div className="detail-stat__sub">{totalMonths - currentMonth} months left</div>
          </div>
          <div className="detail-stat">
            <div className="detail-stat__label">Paid This Month</div>
            <div className="detail-stat__value">{paidCount}/{totalMembers}</div>
            <div className="detail-stat__sub">{dueCount} pending</div>
          </div>
          <div className="detail-stat">
            <div className="detail-stat__label">Current Turn</div>
            <div className="detail-stat__value" style={{ fontSize: '1rem' }}>{currentTurn}</div>
            <div className="detail-stat__sub">Hissa holder</div>
          </div>
        </div>

        {/* Progress */}
        <div className="detail__progress-card">
          <div className="detail__progress-header">
            <h3>Committee Progress</h3>
            <span className="detail__progress-pct">{progress}%</span>
          </div>
          <div className="progress-wrap detail__progress-wrap">
            <div
              className="progress-bar"
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${progress}% complete`}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '.78rem', color: 'var(--gray-500)' }}>
            <span>Month 1</span>
            <span>Month {currentMonth} (current)</span>
            <span>Month {totalMonths}</span>
          </div>
        </div>

        {/* Payment status table */}
        <div className="detail__table-card">
          <div className="detail__table-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <h2>💳 Payment Status</h2>
              {isAdmin && (
                <button
                  onClick={() => setShowAddMemberModal(true)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: 'var(--green)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  + Add Member
                </button>
              )}
            </div>
            {/* Filter tabs */}
            <div className="filter-bar" role="group" aria-label="Filter by payment status" style={{ margin: 0 }}>
              {[
                { key: 'all',      label: `All (${members.length})` },
                { key: 'paid',     label: `✓ Paid (${paidCount})` },
                { key: 'due',      label: `⏰ Due (${dueCount})` },
                { key: 'upcoming', label: `📅 Upcoming (${upcomingCount})` },
              ].map((f) => (
                <button
                  key={f.key}
                  className={`filter-btn${statusFilter === f.key ? ' active' : ''}`}
                  onClick={() => setStatusFilter(f.key)}
                  aria-pressed={statusFilter === f.key}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="payment-table" aria-label="Member payment status">
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Member</th>
                  <th scope="col">Merit Score</th>
                  <th scope="col">Payment Date</th>
                  <th scope="col">Amount</th>
                  <th scope="col">Status</th>
                  {isAdmin && <th scope="col">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredMembers.length > 0 ? (
                  filteredMembers.map((member, index) => (
                    <tr key={member.id}>
                      <td style={{ color: 'var(--gray-400)', fontWeight: 600 }}>{index + 1}</td>
                      <td>
                        <div className="member-cell">
                          <div className={`avatar avatar-sm ${member.colorClass}`}>
                            {member.initials}
                          </div>
                          <div>
                            <div className="member-cell__name">
                              {member.name || (member.isAdmin ? adminName : 'Unknown')}
                              {member.isAdmin && (
                                <span style={{
                                  background: 'var(--green)',
                                  color: 'white',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  fontSize: '0.6rem',
                                  fontWeight: '600',
                                  marginLeft: '6px'
                                }}>
                                  ADMIN
                                </span>
                              )}
                            </div>
                            <div className="member-cell__id">ID: {member.id}</div>
                          </div>
                        </div>
                      </td>
                      {/* ── Merit Score cell ── */}
                      <td>
                        {editingMeritId === member.id ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={meritInputValue}
                              onChange={(e) => setMeritInputValue(e.target.value)}
                              style={{
                                width: '60px', padding: '4px 6px',
                                border: '2px solid var(--green)', borderRadius: '6px',
                                fontSize: '0.82rem', outline: 'none',
                              }}
                              autoFocus
                            />
                            <button
                              onClick={() => handleMeritSave(member.id)}
                              disabled={meritSaving}
                              style={{
                                padding: '3px 8px', background: 'var(--green)',
                                color: 'white', border: 'none', borderRadius: '4px',
                                fontSize: '0.72rem', cursor: 'pointer', fontWeight: '700',
                              }}
                            >
                              {meritSaving ? '...' : '✓'}
                            </button>
                            <button
                              onClick={() => setEditingMeritId(null)}
                              style={{
                                padding: '3px 6px', background: 'none',
                                color: 'var(--gray-500)', border: '1px solid var(--gray-300)',
                                borderRadius: '4px', fontSize: '0.72rem', cursor: 'pointer',
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{
                              background: member.meritScore !== null && member.meritScore !== undefined
                                ? (member.meritScore >= 75 ? 'var(--green-light)' : member.meritScore >= 50 ? '#fef9c3' : '#fee2e2')
                                : 'var(--gray-100)',
                              color: member.meritScore !== null && member.meritScore !== undefined
                                ? (member.meritScore >= 75 ? 'var(--green-dark)' : member.meritScore >= 50 ? '#92400e' : '#991b1b')
                                : 'var(--gray-400)',
                              padding: '2px 8px', borderRadius: '999px',
                              fontSize: '0.75rem', fontWeight: '700',
                            }}>
                              {member.meritScore !== null && member.meritScore !== undefined
                                ? `Merit: ${member.meritScore}/100`
                                : '—'}
                            </span>
                            {isAdmin && (
                              <button
                                onClick={() => {
                                  setEditingMeritId(member.id);
                                  setMeritInputValue(member.meritScore ?? '');
                                }}
                                title="Merit score edit karein"
                                style={{
                                  background: 'none', border: 'none',
                                  cursor: 'pointer', fontSize: '0.8rem',
                                  color: 'var(--gray-400)', padding: '2px',
                                }}
                              >
                                ✏️
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      <td>{member.paymentDate ? new Date(member.paymentDate).toLocaleDateString('en-PK') : '—'}</td>
                      <td style={{ fontWeight: 600 }}>₨{amount.toLocaleString()}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <PaymentStatusBadge status={member.paymentStatus} />
                          {isAdmin && (
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                              <button
                                onClick={() => {
                                  setSelectedMember(member);
                                  setShowUpdatePaymentModal(true);
                                }}
                                style={{
                                  padding: '0.25rem 0.5rem',
                                  backgroundColor: 'var(--blue)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  fontSize: '0.7rem',
                                  cursor: 'pointer'
                                }}
                                title="Update Payment"
                              >
                                Update
                              </button>
                              {!member.isAdmin && (
                                <button
                                  onClick={() => handleRemoveMember(member.id)}
                                  style={{
                                    padding: '0.25rem 0.5rem',
                                    backgroundColor: 'var(--red)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontSize: '0.7rem',
                                    cursor: 'pointer'
                                  }}
                                  title="Remove Member"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 6} style={{ textAlign: 'center', padding: '40px', color: 'var(--gray-500)' }}>
                      Is filter ke liye koi record nahi mila.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

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

        {/* Back link */}
        <div style={{ marginTop: 28 }}>
          <Link to="/dashboard" className="btn btn-outline">
            ← Dashboard par wapas jao
          </Link>
        </div>

        {/* Add Member Modal */}
        <AddMemberModal
          isOpen={showAddMemberModal}
          onClose={() => setShowAddMemberModal(false)}
          onSuccess={handleAddMemberSuccess}
          committeeId={id}
        />

        {/* Update Payment Modal */}
        {selectedMember && (
          <UpdatePaymentModal
            isOpen={showUpdatePaymentModal}
            onClose={() => setShowUpdatePaymentModal(false)}
            onSuccess={handleUpdatePaymentSuccess}
            committeeId={id}
            memberId={selectedMember.id}
            currentStatus={selectedMember.paymentStatus}
            currentAmount={amount}
          />
        )}

        {/* Rate Owner Modal */}
        <RateOwnerModal
          isOpen={showRateModal}
          onClose={() => setShowRateModal(false)}
          onSuccess={(avg, count, beginner) => {
            setOwnerAvgRating(avg);
            setRatingCount(count);
            setIsBeginner(beginner ?? false);
            setMyRating(avg); // approximate — will refresh on next load
            setSuccessMessage('Rating de di gayi. Shukriya!');
            setTimeout(() => setSuccessMessage(''), 3000);
          }}
          committeeId={id}
          ownerName={adminName || '—'}
          currentRating={myRating}
        />

      </div>
    </main>
  );
}
