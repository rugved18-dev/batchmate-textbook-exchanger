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
    ArrowLeft
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import { formatDate } from '../utils/helpers'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

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
            setNote(response.data.data)
            // Check if user has voted (you might need to add this to the API response)
            // setUserVote(response.data.userVote)
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
            fetchNoteDetails() // Refresh to get updated vote counts
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to vote')
        } finally {
            setVoting(false)
        }
    }

    const handleDownload = async () => {
        try {
            const response = await api.get(`/notes/${id}/download`, {
                responseType: 'blob'
            })

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `${note.title}.pdf`)
            document.body.appendChild(link)
            link.click()
            link.remove()

            toast.success('Download started!')
            fetchNoteDetails() // Refresh to update download count
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

    const voteScore = (note.upvotes || 0) - (note.downvotes || 0)
    const isOwner = user?._id === note.uploadedBy?._id

    return (
        <div className="space-y-6">
            {/* Back Button */}
            <Link to="/notes" className="inline-flex items-center gap-2 text-gray-400 hover:text-white">
                <ArrowLeft className="w-5 h-5" />
                Back to Notes
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Note Info Card */}
                    <div className="card">
                        <h1 className="text-3xl font-bold text-white mb-4">{note.title}</h1>

                        {/* Meta Tags */}
                        <div className="flex flex-wrap gap-2 mb-6">
                            <span className="badge badge-primary">{note.subject}</span>
                            <span className="badge badge-secondary">{note.semester}</span>
                            {note.branch && (
                                <span className="badge badge-accent">{note.branch}</span>
                            )}
                        </div>

                        {/* Description */}
                        {note.description && (
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-gray-400 mb-2">Description</h3>
                                <p className="text-gray-300">{note.description}</p>
                            </div>
                        )}

                        {/* Uploader Info */}
                        <div className="flex items-center gap-3 p-4 bg-dark-200 rounded-lg mb-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
                                {note.uploadedBy?.profilePicture ? (
                                    <img
                                        src={note.uploadedBy.profilePicture}
                                        alt={note.uploadedBy.name}
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                ) : (
                                    <User className="w-6 h-6 text-white" />
                                )}
                            </div>
                            <div>
                                <div className="text-white font-medium">{note.uploadedBy?.name || 'Anonymous'}</div>
                                <div className="text-sm text-gray-400">
                                    {note.uploadedBy?.reputationPoints || 0} reputation points
                                </div>
                            </div>
                        </div>

                        {/* Thumbnail Preview */}
                        {note.thumbnailUrl && (
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-gray-400 mb-2">Preview</h3>
                                <img
                                    src={note.thumbnailUrl}
                                    alt={note.title}
                                    className="w-full rounded-lg border border-white/10"
                                />
                            </div>
                        )}

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-4 p-4 bg-dark-200 rounded-lg">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-white">{note.downloads || 0}</div>
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
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    {/* Actions Card */}
                    <div className="card space-y-3">
                        <h3 className="text-lg font-semibold text-white mb-4">Actions</h3>

                        {/* Download Button */}
                        <button
                            onClick={handleDownload}
                            className="btn-primary w-full flex items-center justify-center gap-2"
                        >
                            <Download className="w-5 h-5" />
                            Download PDF
                        </button>

                        {/* Voting Buttons */}
                        {!isOwner && (
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => handleVote('upvote')}
                                    disabled={voting || userVote === 'upvote'}
                                    className={`btn-secondary flex items-center justify-center gap-2 ${userVote === 'upvote' ? 'bg-green-500/20 text-green-400' : ''
                                        }`}
                                >
                                    <ThumbsUp className="w-5 h-5" />
                                    Upvote
                                </button>
                                <button
                                    onClick={() => handleVote('downvote')}
                                    disabled={voting || userVote === 'downvote'}
                                    className={`btn-secondary flex items-center justify-center gap-2 ${userVote === 'downvote' ? 'bg-red-500/20 text-red-400' : ''
                                        }`}
                                >
                                    <ThumbsDown className="w-5 h-5" />
                                    Downvote
                                </button>
                            </div>
                        )}

                        {/* Owner Actions */}
                        {isOwner && (
                            <button
                                onClick={handleDelete}
                                className="btn-secondary w-full flex items-center justify-center gap-2 text-red-400 hover:bg-red-500/20"
                            >
                                <Trash2 className="w-5 h-5" />
                                Delete Note
                            </button>
                        )}

                        {/* Report Button */}
                        {!isOwner && (
                            <button className="btn-secondary w-full flex items-center justify-center gap-2 text-yellow-400 hover:bg-yellow-500/20">
                                <Flag className="w-5 h-5" />
                                Report
                            </button>
                        )}
                    </div>

                    {/* Info Card */}
                    <div className="card space-y-3">
                        <h3 className="text-lg font-semibold text-white mb-4">Information</h3>

                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Calendar className="w-4 h-4" />
                            <span>Uploaded {formatDate(note.createdAt)}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <FileText className="w-4 h-4" />
                            <span>PDF Document</span>
                        </div>

                        {note.tags && note.tags.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                                    <Tag className="w-4 h-4" />
                                    <span>Tags</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {note.tags.map((tag, index) => (
                                        <span key={index} className="badge badge-secondary text-xs">
                                            {tag}
                                        </span>
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
