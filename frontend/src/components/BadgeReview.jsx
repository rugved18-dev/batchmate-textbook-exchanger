/**
 * Shared Badge & Review components for Profile and BookDetail pages.
 * Import from this file to keep UI consistent everywhere.
 */
import { useState, useEffect } from 'react'
import { Star, MessageSquare, Loader2, Send, User } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

// ── Color maps ────────────────────────────────────────────────────────────────
const BADGE_COLORS = {
    amber: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
    yellow: 'bg-yellow-500/15 border-yellow-500/40 text-yellow-300',
    violet: 'bg-violet-500/15 border-violet-500/40 text-violet-300',
    red: 'bg-red-500/15 border-red-500/40 text-red-300',
    blue: 'bg-blue-500/15 border-blue-500/40 text-blue-300',
    gray: 'bg-gray-500/15 border-gray-500/40 text-gray-300',
}

// ── Single Badge Chip ─────────────────────────────────────────────────────────
export const BadgeChip = ({ badge, size = 'md' }) => {
    const cls = BADGE_COLORS[badge.color] || BADGE_COLORS.gray
    const pad = size === 'sm' ? 'px-2 py-0.5 text-xs gap-1' : 'px-3 py-1 text-sm gap-1.5'
    return (
        <span
            title={badge.description}
            className={`inline-flex items-center border rounded-full font-medium cursor-default select-none transition-all hover:scale-105 ${cls} ${pad}`}
        >
            <span>{badge.emoji}</span>
            <span>{badge.label}</span>
        </span>
    )
}

// ── Badge Row — fetches and displays all badges for a userId ──────────────────
export const BadgeRow = ({ userId, size = 'md' }) => {
    const [badges, setBadges] = useState([])
    const [avgRating, setAvgRating] = useState(null)
    const [reviewCount, setReviewCount] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!userId) { setLoading(false); return }
        api.get(`/reviews/badges/${userId}`)
            .then(r => {
                setBadges(r.data.badges || [])
                setAvgRating(r.data.avgRating)
                setReviewCount(r.data.reviewCount || 0)
            })
            .catch(() => { })
            .finally(() => setLoading(false))
    }, [userId])

    if (loading) return <div className="h-6 w-32 bg-white/5 animate-pulse rounded-full" />

    return (
        <div className="flex flex-wrap items-center gap-2">
            {badges.map(b => <BadgeChip key={b.id} badge={b} size={size} />)}
            {avgRating && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 text-sm font-medium">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {avgRating} <span className="text-amber-400/60 text-xs">({reviewCount})</span>
                </span>
            )}
            {badges.length === 0 && !avgRating && (
                <span className="text-xs text-gray-600">No badges yet</span>
            )}
        </div>
    )
}

// ── Star Rating Input ─────────────────────────────────────────────────────────
const StarInput = ({ value, onChange }) => (
    <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(n => (
            <button
                key={n}
                type="button"
                onClick={() => onChange(n)}
                className="transition-transform hover:scale-110"
            >
                <Star
                    className={`w-7 h-7 transition-colors ${n <= value ? 'fill-amber-400 text-amber-400' : 'text-gray-600 hover:text-amber-400/50'}`}
                />
            </button>
        ))}
    </div>
)

// ── Review Form — shown on BookDetail after sold ──────────────────────────────
export const ReviewForm = ({ bookId, sellerId, onSubmitted }) => {
    const [rating, setRating] = useState(0)
    const [comment, setComment] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const submit = async (e) => {
        e.preventDefault()
        if (!rating) { toast.error('Please select a rating'); return }
        setSubmitting(true)
        try {
            await api.post('/reviews', { bookId, rating, comment })
            toast.success('Review submitted! Thank you.')
            onSubmitted?.()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit review')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <form onSubmit={submit} className="space-y-4 p-5 rounded-2xl border border-violet-500/20 bg-violet-500/5">
            <h4 className="font-semibold text-white flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400" />
                Rate this seller
            </h4>
            <StarInput value={rating} onChange={setRating} />
            <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Share your experience (optional)…"
                className="input w-full min-h-[72px] text-sm"
                maxLength={500}
                rows={3}
            />
            <button
                type="submit"
                disabled={submitting || !rating}
                className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50"
            >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {submitting ? 'Submitting…' : 'Submit Review'}
            </button>
        </form>
    )
}

// ── Review List — used on Profile page ───────────────────────────────────────
export const ReviewList = ({ sellerId }) => {
    const [reviews, setReviews] = useState([])
    const [avgRating, setAvgRating] = useState(null)
    const [loading, setLoading] = useState(true)

    const load = () => {
        api.get(`/reviews/seller/${sellerId}`)
            .then(r => { setReviews(r.data.reviews || []); setAvgRating(r.data.avgRating) })
            .catch(() => { })
            .finally(() => setLoading(false))
    }
    useEffect(() => { if (sellerId) load() }, [sellerId])

    if (loading) return <div className="text-gray-600 text-sm py-4 animate-pulse">Loading reviews…</div>
    if (!reviews.length) return <p className="text-gray-600 text-sm py-4">No reviews yet</p>

    const renderStars = (n) => (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} className={`w-4 h-4 ${i <= n ? 'fill-amber-400 text-amber-400' : 'text-gray-700'}`} />
            ))}
        </div>
    )

    return (
        <div className="space-y-4">
            {/* Ave rating header */}
            {avgRating && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <span className="text-4xl font-bold text-white">{avgRating}</span>
                    <div>
                        <div className="flex gap-1 mb-1">
                            {[1, 2, 3, 4, 5].map(i => (
                                <Star key={i} className={`w-5 h-5 ${i <= Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'text-gray-600'}`} />
                            ))}
                        </div>
                        <div className="text-sm text-gray-400">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</div>
                    </div>
                </div>
            )}

            {/* Individual reviews */}
            {reviews.map(r => (
                <div key={r._id} className="p-4 rounded-xl border border-white/5 bg-white/2">
                    <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {r.reviewer?.profilePicture
                                ? <img src={r.reviewer.profilePicture} alt="" className="w-full h-full object-cover rounded-full" />
                                : <User className="w-4 h-4 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="text-sm font-medium text-white">{r.reviewer?.name || 'Anonymous'}</span>
                                {renderStars(r.rating)}
                            </div>
                            {r.book?.title && (
                                <div className="text-xs text-gray-500 mb-1">Re: {r.book.title}</div>
                            )}
                            {r.comment && <p className="text-sm text-gray-400 mt-1">{r.comment}</p>}
                            <div className="text-xs text-gray-600 mt-2">
                                {new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
