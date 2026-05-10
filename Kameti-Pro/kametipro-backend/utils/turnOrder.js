/**
 * Turn Order Utilities
 * --------------------
 * A "kameti" (rotating savings group) assigns each member exactly one month
 * in which they receive the pooled contribution.  The order can be:
 *   - sequential  : members receive in the order they joined
 *   - random      : members receive in a randomly shuffled order
 *
 * Both strategies guarantee every member gets exactly one turn over the
 * full duration of the committee.
 */

/**
 * Fisher-Yates in-place shuffle.
 * @param {Array} arr
 * @returns {Array} the same array, shuffled
 */
const shuffleArray = (arr) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

/**
 * Generate a turn order for a committee.
 *
 * @param {string[]} memberIds   - Array of User ObjectId strings (or ObjectIds)
 * @param {'sequential'|'random'} strategy - How to assign turns
 * @returns {{ month: number, member: string }[]}
 *   Array of { month, member } objects, one per member.
 *
 * @example
 * generateTurnOrder(['u1','u2','u3'], 'random')
 * // => [{ month: 1, member: 'u2' }, { month: 2, member: 'u1' }, { month: 3, member: 'u3' }]
 */
const generateTurnOrder = (memberIds, strategy = 'sequential') => {
  if (!memberIds || memberIds.length === 0) {
    throw new Error('At least one member is required to generate a turn order.');
  }

  // Work with string copies so we don't mutate the original array
  const ids = memberIds.map((id) => id.toString());

  const ordered = strategy === 'random' ? shuffleArray([...ids]) : [...ids];

  return ordered.map((memberId, index) => ({
    month:  index + 1,   // months are 1-based
    member: memberId,
  }));
};

/**
 * Get the member whose turn it is for a given month.
 *
 * @param {{ month: number, member: string }[]} turnOrder
 * @param {number} month
 * @returns {string|null} member ID or null if not found
 */
const getTurnForMonth = (turnOrder, month) => {
  const entry = turnOrder.find((t) => t.month === month);
  return entry ? entry.member.toString() : null;
};

/**
 * Rebuild the turn order when a new member joins mid-committee.
 * New member is appended at the end (first available month without a turn).
 *
 * @param {{ month: number, member: string }[]} existingOrder
 * @param {string} newMemberId
 * @param {number} durationMonths
 * @returns {{ month: number, member: string }[]}
 */
const appendMemberToTurnOrder = (existingOrder, newMemberId, durationMonths) => {
  const usedMonths = new Set(existingOrder.map((t) => t.month));
  // Find the first month not yet assigned
  for (let m = 1; m <= durationMonths; m++) {
    if (!usedMonths.has(m)) {
      return [...existingOrder, { month: m, member: newMemberId.toString() }];
    }
  }
  throw new Error('No available month slot for the new member. Committee is full.');
};

module.exports = { generateTurnOrder, getTurnForMonth, appendMemberToTurnOrder };
