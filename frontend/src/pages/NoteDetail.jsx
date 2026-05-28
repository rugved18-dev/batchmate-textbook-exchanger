import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
    Download,
    ThumbsUp,
    ThumbsDown,
    FileText,
    User,
    Calendar,
    Tag,
    Flag,
    Trash2,
    ArrowLeft,
    Sparkles,
    Loader2,
    CheckCircle2,
    Clock
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import { formatDate } from '../utils/helpers'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

// ── AI Summary Panel ──────────────────────────────────────────────────────────
const AISummaryPanel = ({ noteId, existingSummary, existingSummaryDate }) => {
    const [summary, setSummary] = useState(existingSummary || null)
    const [summaryDate, setSummaryDate] = useState(existingSummaryDate || null)
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(!!existingSummary)

    const isCachedRecently = summaryDate &&
        (Date.now() - new Date(summaryDate).getTime()) < 24 * 60 * 60 * 1000

    const handleGenerate = async () => {
        try {
            setLoading(true)
            setOpen(true)
            const res = await api.post(`/notes/${noteId}/summarize`)
            setSummary(res.data.summary)
            setSummaryDate(new Date().toISOString())
            if (res.data.cached) {
                toast.success('Loaded cached summary')
            } else {
                toast.success('AI summary generated! ✨')
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to generate summary'
            toast.error(msg)
            if (msg.includes('GEMINI_API_KEY')) {
                toast.error('Admin needs to configure the Gemini API key', { duration: 5000 })
            }
        } finally {
            setLoading(false)
        }
    }

    const bullets = summary
        ? summary.split('\n').filter(l => l.trim())
        : []

    return (
        <div className="card border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-transparent">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-violet-500/20 rounded-lg flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-violet-400" />
                    </div>
                    <div>
                        <h3 className="text-white font-semibold text-sm">AI Summary</h3>
                        {isCachedRecently && (
                            <p className="text-[10px] text-gray-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Generated {formatDate(summaryDate)}
                            </p>
                        )}
                    </div>
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                               bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 border border-violet-500/30
                               disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    {loading ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating…</>
                    ) : summary ? (
                        <><Sparkles className="w-3.5 h-3.5" /> Regenerate</>
                    ) : (
                        <><Sparkles className="w-3.5 h-3.5" /> ✨ Generate Summary</>
                    )}
                </button>
            </div>

            {/* Body */}
            {loading && (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                    <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                    <p className="text-gray-400 text-sm">Reading your PDF with Gemini AI…</p>
                    <p className="text-gray-600 text-xs">This may take 10–20 seconds</p>
                </div>
            )}

            {!loading && open && bullets.length > 0 && (
                <ul className="space-y-2.5">
                    {bullets.map((line, i) => (
                        <li
                            key={i}
                            className="flex gap-2.5 text-sm text-gray-300 leading-relaxed"
                            style={{ animationDelay: `${i * 80}ms` }}
                        >
                            <CheckCircle2 className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                            <span>{line.replace(/^[•\-\*\d\.]+\s*/, '')}</span>
                        </li>
                    ))}
                </ul>
            )}

            {!loading && !summary && (
                <p className="text-gray-500 text-xs text-center py-4">
                    Click "✨ Generate Summary" to get a 5-point AI overview of this note.
                </p>
            )}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────

const NoteDetail = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const [note, setNote] = useState(null)
    const [loading, setLoading] = useState(true)
    const [voting, setVoting] = useState(false)
    const [userVote, setUserVote] = useState(null)

    useEffect(() => {
        fetchNoteDetails()
    }, [id])

    const fetchNoteDetails = async () => {
        try {
            setLoading(true)
            const response = await api.get(`/notes/${id}`)
            setNote(response.data.note)
            setUserVote(response.data.userVote || null)
        } catch (error) {
            console.error('Failed to fetch note:', error)
            toast.error('Failed to load note details')
            navigate('/notes')
        } finally {
            setLoading(false)
        }
    }

    const handleVote = async (voteType) => {
        if (voting) return
        try {
            setVoting(true)
            await api.post(`/notes/${id}/vote`, { voteType })
            toast.success(`${voteType === 'upvote' ? 'Upvoted' : 'Downvoted'} successfully`)
            setUserVote(voteType)
            fetchNoteDetails()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to vote')
        } finally {
            setVoting(false)
        }
    }

    const handleDownload = async () => {
        try {
            const response = await api.get(`/notes/${id}/download`, { responseType: 'blob' })
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `${note.title}.pdf`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            toast.success('Download started!')
            fetchNoteDetails()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to download')
        }
    }

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this note?')) return
        try {
            await api.delete(`/notes/${id}`)
            toast.success('Note deleted successfully')
            navigate('/notes')
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete note')
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <LoadingSpinner size="large" text="Loading note..." />
            </div>
        )
    }

    if (!note) {
        return (
            <div className="text-center py-20">
                <FileText className="w-20 h-20 text-gray-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Note not found</h2>
                <Link to="/notes" className="text-primary-400 hover:text-primary-300">
                    ← Back to Notes
                </Link>
            </div>
        )
    }

    const isOwner = user?._id === note.uploadedBy?._id

    return (
        <div className="space-y-6">
            {/* Back */}
            <Link to="/notes" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
                Back to Notes
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ── Main Column ───────────────────────────────────────────── */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Note Info Card */}
                    <div className="card">
                        <h1 className="text-3xl font-bold text-white mb-4">{note.title}</h1>

                        {/* Meta Tags */}
                        <div className="flex flex-wrap gap-2 mb-6">
                            <span className="badge badge-primary">{note.subject}</span>
                            <span className="badge badge-secondary">Sem {note.semester}</span>
                            {note.department && (
                                <span className="badge badge-accent">{note.department}</span>
                            )}
                        </div>

                        {/* Description */}
                        {note.description && (
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-gray-400 mb-2">Description</h3>
                                <p className="text-gray-300">{note.description}</p>
                            </div>
                        )}

                        {/* Uploader */}
                        <div className="flex items-center gap-3 p-4 bg-dark-200 rounded-xl mb-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center flex-shrink-0">
                                {note.uploadedBy?.profilePicture ? (
                                    <img src={note.uploadedBy.profilePicture} alt={note.uploadedBy.name} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <User className="w-6 h-6 text-white" />
                                )}
                            </div>
                            <div>
                                <div className="text-white font-medium">{note.uploadedBy?.name || 'Anonymous'}</div>
                                <div className="text-sm text-gray-400">
                                    {note.uploadedBy?.reputationPoints || note.uploadedBy?.reputationScore || 0} reputation
                                </div>
                            </div>
                        </div>

                        {/* Thumbnail */}
                        {note.thumbnailUrl && (
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-gray-400 mb-2">Preview</h3>
                                <img src={note.thumbnailUrl} alt={note.title} className="w-full rounded-xl border border-white/10" />
                            </div>
                        )}

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-4 p-4 bg-dark-200 rounded-xl">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-white">{note.downloadCount || note.downloads || 0}</div>
                                <div className="text-sm text-gray-400">Downloads</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-400">{note.upvotes || 0}</div>
                                <div className="text-sm text-gray-400">Upvotes</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-red-400">{note.downvotes || 0}</div>
                                <div className="text-sm text-gray-400">Downvotes</div>
                            </div>
                        </div>
                    </div>

                    {/* ── AI Summary Panel ──────────────────────────────────── */}
                    <AISummaryPanel
                        noteId={id}
                        existingSummary={note.aiSummary}
                        existingSummaryDate={note.aiSummaryGeneratedAt}
                    />
                </div>

                {/* ── Sidebar ───────────────────────────────────────────────── */}
                <div className="space-y-4">
                    {/* Actions */}
                    <div className="card space-y-3">
                        <h3 className="text-lg font-semibold text-white mb-4">Actions</h3>

                        <button onClick={handleDownload} className="btn-primary w-full flex items-center justify-center gap-2">
                            <Download className="w-5 h-5" />
                            Download PDF
                        </button>

                        {!isOwner && (
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => handleVote('upvote')}
                                    disabled={voting || userVote === 'upvote'}
                                    className={`btn-secondary flex items-center justify-center gap-2 ${userVote === 'upvote' ? 'bg-green-500/20 border-green-500/30 text-green-400' : ''}`}
                                >
                                    <ThumbsUp className="w-5 h-5" />
                                    Upvote
                                </button>
                                <button
                                    onClick={() => handleVote('downvote')}
                                    disabled={voting || userVote === 'downvote'}
                                    className={`btn-secondary flex items-center justify-center gap-2 ${userVote === 'downvote' ? 'bg-red-500/20 border-red-500/30 text-red-400' : ''}`}
                                >
                                    <ThumbsDown className="w-5 h-5" />
                                    Downvote
                                </button>
                            </div>
                        )}

                        {isOwner && (
                            <button onClick={handleDelete} className="btn-secondary w-full flex items-center justify-center gap-2 text-red-400 hover:bg-red-500/20">
                                <Trash2 className="w-5 h-5" />
                                Delete Note
                            </button>
                        )}

                        {!isOwner && (
                            <button className="btn-secondary w-full flex items-center justify-center gap-2 text-yellow-400 hover:bg-yellow-500/20">
                                <Flag className="w-5 h-5" />
                                Report
                            </button>
                        )}
                    </div>

                    {/* Info */}
                    <div className="card space-y-3">
                        <h3 className="text-lg font-semibold text-white mb-4">Information</h3>

                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Calendar className="w-4 h-4" />
                            <span>Uploaded {formatDate(note.uploadedAt || note.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <FileText className="w-4 h-4" />
                            <span>PDF · {note.pageCount} pages</span>
                        </div>

                        {note.tags && note.tags.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                                    <Tag className="w-4 h-4" />
                                    <span>Tags</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {note.tags.map((tag, i) => (
                                        <span key={i} className="badge badge-secondary text-xs">{tag}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default NoteDetail
