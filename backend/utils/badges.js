/**
 * Badge System
 * Computes earned badges for a user based on their stats.
 * Badges are computed on-the-fly — no persistence needed.
 *
 * Badge definitions:
 *  ⭐ Verified Seller   — 3+ sold books
 *  🥇 Top Contributor  — 50+ reputation points
 *  💎 Pro Tutor        — 10+ upvoted notes (notes with voteScore >= 1)
 *  👑 Admin            — role === 'admin'
 *  🛡️  Moderator        — role === 'moderator'
 */

const BADGE_DEFS = [
    {
        id: 'verified_seller',
        emoji: '⭐',
        label: 'Verified Seller',
        description: 'Successfully sold 3+ books',
        color: 'amber',
        check: (stats) => stats.soldBooks >= 3
    },
    {
        id: 'top_contributor',
        emoji: '🥇',
        label: 'Top Contributor',
        description: '50+ reputation points',
        color: 'yellow',
        check: (stats) => stats.reputationScore >= 50
    },
    {
        id: 'pro_tutor',
        emoji: '💎',
        label: 'Pro Tutor',
        description: 'Uploaded 10+ upvoted notes',
        color: 'violet',
        check: (stats) => stats.upvotedNotes >= 10
    },
    {
        id: 'admin',
        emoji: '👑',
        label: 'Admin',
        description: 'Platform administrator',
        color: 'red',
        check: (stats) => stats.role === 'admin'
    },
    {
        id: 'moderator',
        emoji: '🛡️',
        label: 'Moderator',
        description: 'Community moderator',
        color: 'blue',
        check: (stats) => stats.role === 'moderator'
    }
];

/**
 * Compute badges for a user given their stats object.
 * @param {{ soldBooks, reputationScore, upvotedNotes, role }} stats
 * @returns {Array} array of earned badge objects
 */
const computeBadges = (stats) =>
    BADGE_DEFS.filter(b => b.check(stats)).map(({ id, emoji, label, description, color }) =>
        ({ id, emoji, label, description, color })
    );

module.exports = { computeBadges, BADGE_DEFS };
