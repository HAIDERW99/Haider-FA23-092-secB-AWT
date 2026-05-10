import axiosInstance from './axiosInstance';

// ─── Mock data (fallback when backend is unreachable) ────────────────────────
const MOCK_COMMITTEES = [
  {
    id: 'c1', icon: '👨‍👩‍👧‍👦', name: 'Family Savings Group',
    amount: 5000, totalMembers: 12, city: 'Karachi',
    status: 'active', currentMonth: 9, totalMonths: 12, currentTurn: 'Ayesha K.',
    members: [
      { id: 'm1', initials: 'AK', name: 'Ahmed Khan',    colorClass: 'av-green',  paymentDate: '1 May 2025',  status: 'paid' },
      { id: 'm2', initials: 'SF', name: 'Sara Fatima',   colorClass: 'av-blue',   paymentDate: '2 May 2025',  status: 'paid' },
      { id: 'm3', initials: 'MR', name: 'Muhammad Raza', colorClass: 'av-purple', paymentDate: 'Due: 8 May',  status: 'due' },
      { id: 'm4', initials: 'ZB', name: 'Zainab Butt',   colorClass: 'av-orange', paymentDate: 'Due: 10 May', status: 'upcoming' },
      { id: 'm5', initials: 'HN', name: 'Hassan Naveed', colorClass: 'av-pink',   paymentDate: '1 May 2025',  status: 'paid' },
      { id: 'm6', initials: 'AY', name: 'Ayesha Khan',   colorClass: 'av-teal',   paymentDate: '3 May 2025',  status: 'paid' },
      { id: 'm7', initials: 'RK', name: 'Raza Khan',     colorClass: 'av-green',  paymentDate: 'Due: 12 May', status: 'upcoming' },
      { id: 'm8', initials: 'NB', name: 'Nadia Baig',    colorClass: 'av-blue',   paymentDate: '4 May 2025',  status: 'paid' },
    ],
  },
  {
    id: 'c2', icon: '🏢', name: 'Office Kameti 2025',
    amount: 10000, totalMembers: 8, city: 'Lahore',
    status: 'pending', currentMonth: 3, totalMonths: 8, currentTurn: 'Zahid A.',
    members: [
      { id: 'm1', initials: 'ZA', name: 'Zahid Ahmed',  colorClass: 'av-green',  paymentDate: '1 May 2025',  status: 'paid' },
      { id: 'm2', initials: 'HQ', name: 'Hina Qureshi', colorClass: 'av-blue',   paymentDate: 'Due: 7 May',  status: 'due' },
      { id: 'm3', initials: 'NM', name: 'Naveed Malik', colorClass: 'av-purple', paymentDate: 'Due: 9 May',  status: 'due' },
      { id: 'm4', initials: 'SM', name: 'Sana Mirza',   colorClass: 'av-orange', paymentDate: '2 May 2025',  status: 'paid' },
      { id: 'm5', initials: 'AJ', name: 'Ali Javed',    colorClass: 'av-pink',   paymentDate: 'Due: 11 May', status: 'upcoming' },
    ],
  },
  {
    id: 'c3', icon: '🏘️', name: 'Mohalla Bachat Group',
    amount: 3000, totalMembers: 20, city: 'Islamabad',
    status: 'active', currentMonth: 5, totalMonths: 20, currentTurn: 'Rabia J.',
    members: [
      { id: 'm1', initials: 'RJ', name: 'Rabia Javed',   colorClass: 'av-teal',   paymentDate: '1 May 2025',  status: 'paid' },
      { id: 'm2', initials: 'AM', name: 'Asif Mehmood',  colorClass: 'av-green',  paymentDate: '2 May 2025',  status: 'paid' },
      { id: 'm3', initials: 'BK', name: 'Bilal Khan',    colorClass: 'av-blue',   paymentDate: 'Due: 8 May',  status: 'due' },
      { id: 'm4', initials: 'FN', name: 'Farida Naz',    colorClass: 'av-purple', paymentDate: 'Due: 10 May', status: 'upcoming' },
      { id: 'm5', initials: 'SK', name: 'Shahid Karim',  colorClass: 'av-orange', paymentDate: '3 May 2025',  status: 'paid' },
    ],
  },
];

const AVATAR_COLORS = ['av-green', 'av-blue', 'av-purple', 'av-orange', 'av-pink', 'av-teal'];

/**
 * Normalise a backend committee document to the shape Dashboard/CommitteeDetail expect.
 * Backend uses: _id, monthlyContribution, durationMonths, members[].user
 * Frontend uses: id, amount, totalMonths, members[].initials / colorClass
 */
const normalise = (c, index = 0) => {
  // Resolve admin name — admin is populated as { _id, name, email, phone }
  const adminId   = c.admin?._id || (typeof c.admin === 'string' ? c.admin : null);
  const adminName = c.admin?.name || '';

  return {
    id:           c._id || c.id,
    icon:         c.icon || '🏦',
    name:         c.name,
    amount:       c.monthlyContribution ?? c.amount ?? 0,
    totalMembers: c.totalMembers ?? c.members?.length ?? 0,
    city:         c.city || '',
    status:       c.status || 'active',
    currentMonth: c.currentMonth ?? 1,
    totalMonths:  c.durationMonths ?? c.totalMonths ?? 1,
    currentTurn:  c.currentTurn || (c.turnOrder?.[c.currentMonth - 1]?.member?.name) || '—',
    admin:        adminId,
    adminName,
    members: (c.members || []).map((m, i) => {
      // For admin-created members: name is stored directly on the embedded doc.
      // If name is missing (old data), fall back to adminName for the isAdmin member.
      const rawName   = (m.name || '').trim() || (m.isAdmin ? adminName : '');
      const nameParts = rawName.split(/\s+/).filter(Boolean);
      const initials  = nameParts.map((p) => p[0]).join('').toUpperCase().slice(0, 2) || '??';
      return {
        id:            m._id || m.id,
        initials,
        name:          rawName,
        phone:         m.phone || '',
        email:         m.email || '',
        colorClass:    AVATAR_COLORS[i % AVATAR_COLORS.length],
        paymentDate:   m.paymentDate || null,
        paymentStatus: (m.paymentStatus || 'upcoming').toLowerCase(),
        memberStatus:  m.status || 'active',
        isAdmin:       m.isAdmin || false,
      };
    }),
  };
};

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// ─── API functions ────────────────────────────────────────────────────────────

/**
 * Fetch all committees for the logged-in user.
 * Backend returns: { success, count, committees: [...] }
 * Falls back to mock data if API is unreachable.
 */
export async function fetchCommittees() {
  try {
    const { data } = await axiosInstance.get('/committees');
    // data = { success: true, count: N, committees: [...] }
    const raw = Array.isArray(data) ? data : (data.committees ?? []);
    return raw.map((c, i) => normalise(c, i));
  } catch {
    await delay(600);
    return MOCK_COMMITTEES;
  }
}

/**
 * Fetch a single committee by ID.
 * Backend returns: { success, committee: {...} }
 */
export async function fetchCommitteeById(id) {
  try {
    const { data } = await axiosInstance.get(`/committees/${id}`);
    const raw = data.committee ?? data;
    return normalise(raw);
  } catch {
    await delay(400);
    const found = MOCK_COMMITTEES.find((c) => c.id === id);
    if (!found) throw new Error('Committee not found');
    return found;
  }
}
