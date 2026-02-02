import { Link } from 'react-router-dom'
import { BookOpen, MapPin, Tag, User, Calendar } from 'lucide-react'
import { formatDate, formatPrice } from '../utils/helpers'

const BookCard = ({ book }) => {
    const getConditionColor = (condition) => {
        const colors = {
            'Like New': 'text-green-400 bg-green-500/20',
            'Good': 'text-blue-400 bg-blue-500/20',
            'Fair': 'text-yellow-400 bg-yellow-500/20',
            'Acceptable': 'text-orange-400 bg-orange-500/20'
        }
        return colors[condition] || 'text-gray-400 bg-gray-500/20'
    }

    return (
        <Link
            to={`/books/${book._id}`}
            className="card group hover:scale-[1.02] transition-all duration-300"
        >
            {/* Image */}
            <div className="relative h-56 bg-dark-200 rounded-lg overflow-hidden mb-4">
                {book.images && book.images.length > 0 ? (
                    <img
                        src={book.images[0]}
                        alt={book.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-16 h-16 text-gray-600" />
                    </div>
                )}

                {/* Status Badge */}
                {book.status === 'sold' && (
                    <div className="absolute top-3 right-3 px-3 py-1 bg-red-500 text-white text-xs font-semibold rounded-full">
                        SOLD
                    </div>
                )}

                {/* Condition Badge */}
                <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold ${getConditionColor(book.condition)}`}>
                    {book.condition}
                </div>

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-dark-300/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <span className="text-white font-medium">View Details →</span>
                </div>
            </div>

            {/* Content */}
            <div className="space-y-3">
                {/* Title */}
                <h3 className="text-lg font-semibold text-white line-clamp-2 group-hover:text-primary-400 transition-colors">
                    {book.title}
                </h3>

                {/* Author */}
                {book.author && (
                    <p className="text-sm text-gray-400">
                        by {book.author}
                    </p>
                )}

                {/* Price */}
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold gradient-text">
                        {formatPrice(book.price)}
                    </span>
                    {book.mrp && book.mrp > book.price && (
                        <span className="text-sm text-gray-500 line-through">
                            {formatPrice(book.mrp)}
                        </span>
                    )}
                </div>

                {/* Meta Info */}
                <div className="flex flex-wrap gap-2">
                    {book.subject && (
                        <span className="badge badge-primary">
                            {book.subject}
                        </span>
                    )}
                    {book.semester && (
                        <span className="badge badge-secondary">
                            {book.semester}
                        </span>
                    )}
                </div>

                {/* Location */}
                {book.preferredMeetupLocation && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <MapPin className="w-4 h-4" />
                        <span className="line-clamp-1">{book.preferredMeetupLocation}</span>
                    </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    {/* Seller */}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <User className="w-3 h-3" />
                        <span>{book.listedBy?.name || 'Anonymous'}</span>
                    </div>

                    {/* Date */}
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(book.createdAt)}</span>
                    </div>
                </div>
            </div>
        </Link>
    )
}

export default BookCard
