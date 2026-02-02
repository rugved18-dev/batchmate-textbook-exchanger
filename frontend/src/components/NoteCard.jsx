import { Link } from 'react-router-dom'
import { FileText, Download, ThumbsUp, ThumbsDown, User, Calendar } from 'lucide-react'
import { formatDate } from '../utils/helpers'

const NoteCard = ({ note }) => {
    const voteScore = (note.upvotes || 0) - (note.downvotes || 0)
    const isPositive = voteScore > 0
    const isNegative = voteScore < 0

    return (
        <Link
            to={`/notes/${note._id}`}
            className="card group hover:scale-[1.02] transition-all duration-300"
        >
            {/* Thumbnail */}
            <div className="relative h-48 bg-dark-200 rounded-lg overflow-hidden mb-4">
                {note.thumbnailUrl ? (
                    <img
                        src={note.thumbnailUrl}
                        alt={note.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <FileText className="w-16 h-16 text-gray-600" />
                    </div>
                )}

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-dark-300/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <span className="text-white font-medium">View Details →</span>
                </div>
            </div>

            {/* Content */}
            <div className="space-y-3">
                {/* Title */}
                <h3 className="text-lg font-semibold text-white line-clamp-2 group-hover:text-primary-400 transition-colors">
                    {note.title}
                </h3>

                {/* Meta Info */}
                <div className="flex flex-wrap gap-2">
                    <span className="badge badge-primary">
                        {note.subject}
                    </span>
                    <span className="badge badge-secondary">
                        {note.semester}
                    </span>
                    {note.branch && (
                        <span className="badge badge-accent">
                            {note.branch}
                        </span>
                    )}
                </div>

                {/* Description */}
                {note.description && (
                    <p className="text-sm text-gray-400 line-clamp-2">
                        {note.description}
                    </p>
                )}

                {/* Stats */}
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <div className="flex items-center gap-4 text-sm">
                        {/* Vote Score */}
                        <div className={`flex items-center gap-1 ${isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-gray-400'
                            }`}>
                            {isPositive ? (
                                <ThumbsUp className="w-4 h-4" />
                            ) : (
                                <ThumbsDown className="w-4 h-4" />
                            )}
                            <span className="font-medium">{Math.abs(voteScore)}</span>
                        </div>

                        {/* Downloads */}
                        <div className="flex items-center gap-1 text-gray-400">
                            <Download className="w-4 h-4" />
                            <span>{note.downloads || 0}</span>
                        </div>
                    </div>

                    {/* Uploader */}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <User className="w-3 h-3" />
                        <span>{note.uploadedBy?.name || 'Anonymous'}</span>
                    </div>
                </div>

                {/* Date */}
                <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(note.createdAt)}</span>
                </div>
            </div>
        </Link>
    )
}

export default NoteCard
