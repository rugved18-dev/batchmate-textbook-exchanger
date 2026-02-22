import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
    BookOpen,
    MapPin,
    Tag,
    User,
    Calendar,
    MessageCircle,
    Trash2,
    CheckCircle,
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    Star
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import { formatDate, formatPrice } from '../utils/helpers'
import LoadingSpinner from '../components/LoadingSpinner'
import { BadgeRow, ReviewForm, ReviewList } from '../components/BadgeReview'
import toast from 'react-hot-toast'

const BookDetail = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const [book, setBook] = useState(null)
    const [loading, setLoading] = useState(true)
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [reviewable, setReviewable] = useState(false)
    const [reviewDone, setReviewDone] = useState(false)

    useEffect(() => {
        fetchBookDetails()
    }, [id])

    // Check if the logged-in user can leave a review
    useEffect(() => {
        if (!user || !id) return
        api.get(`/reviews/can-review/${id}`)
            .then(r => { if (r.data.canReview) setReviewable(true) })
            .catch(() => { })
    }, [id, user])

    const fetchBookDetails = async () => {
        try {
            setLoading(true)
            const response = await api.get(`/books/${id}`)
            setBook(response.data.data)
        } catch (error) {
            console.error('Failed to fetch book:', error)
            toast.error('Failed to load book details')
            navigate('/books')
        } finally {
            setLoading(false)
        }
    }

    const handleContactSeller = async () => {
        try {
            // Create or get existing chat
            const response = await api.post('/chat', {
                bookId: book._id,
                sellerId: book.listedBy._id
            })
            navigate(`/chat?chatId=${response.data.data._id}`)
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to start chat')
        }
    }

    const handleMarkAsSold = async () => {
        if (!window.confirm('Are you sure you want to mark this book as sold?')) return

        try {
            await api.post(`/books/${id}/sold`)
            toast.success('Book marked as sold')
            fetchBookDetails()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to mark as sold')
        }
    }

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this listing?')) return

        try {
            await api.delete(`/books/${id}`)
            toast.success('Book listing deleted successfully')
            navigate('/books')
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete book')
        }
    }

    const nextImage = () => {
        if (book.images && book.images.length > 0) {
            setCurrentImageIndex((prev) => (prev + 1) % book.images.length)
        }
    }

    const prevImage = () => {
        if (book.images && book.images.length > 0) {
            setCurrentImageIndex((prev) => (prev - 1 + book.images.length) % book.images.length)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <LoadingSpinner size="large" text="Loading book..." />
            </div>
        )
    }

    if (!book) {
        return (
            <div className="text-center py-20">
                <BookOpen className="w-20 h-20 text-gray-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Book not found</h2>
                <Link to="/books" className="text-primary-400 hover:text-primary-300">
                    ← Back to Books
                </Link>
            </div>
        )
    }

    const isOwner = user?._id === book.listedBy?._id
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
        <div className="space-y-6">
            {/* Back Button */}
            <Link to="/books" className="inline-flex items-center gap-2 text-gray-400 hover:text-white">
                <ArrowLeft className="w-5 h-5" />
                Back to Books
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Image Gallery */}
                    <div className="card">
                        <div className="relative h-96 bg-dark-200 rounded-lg overflow-hidden mb-4">
                            {book.images && book.images.length > 0 ? (
                                <>
                                    <img
                                        src={book.images[currentImageIndex]}
                                        alt={book.title}
                                        className="w-full h-full object-contain"
                                    />

                                    {book.images.length > 1 && (
                                        <>
                                            <button
                                                onClick={prevImage}
                                                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-dark-300/80 hover:bg-dark-300 rounded-full transition-colors"
                                            >
                                                <ChevronLeft className="w-6 h-6 text-white" />
                                            </button>
                                            <button
                                                onClick={nextImage}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-dark-300/80 hover:bg-dark-300 rounded-full transition-colors"
                                            >
                                                <ChevronRight className="w-6 h-6 text-white" />
                                            </button>

                                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                                {book.images.map((_, index) => (
                                                    <button
                                                        key={index}
                                                        onClick={() => setCurrentImageIndex(index)}
                                                        className={`w-2 h-2 rounded-full transition-all ${index === currentImageIndex
                                                            ? 'bg-white w-6'
                                                            : 'bg-white/50'
                                                            }`}
                                                    />
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <BookOpen className="w-24 h-24 text-gray-600" />
                                </div>
                            )}

                            {/* Status Badge */}
                            {book.status === 'sold' && (
                                <div className="absolute top-4 right-4 px-4 py-2 bg-red-500 text-white font-semibold rounded-full">
                                    SOLD
                                </div>
                            )}
                        </div>

                        {/* Thumbnail Strip */}
                        {book.images && book.images.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {book.images.map((image, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentImageIndex(index)}
                                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${index === currentImageIndex
                                            ? 'border-primary-500'
                                            : 'border-transparent opacity-60 hover:opacity-100'
                                            }`}
                                    >
                                        <img
                                            src={image}
                                            alt={`${book.title} ${index + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Book Info */}
                    <div className="card">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <h1 className="text-3xl font-bold text-white mb-2">{book.title}</h1>
                                {book.author && (
                                    <p className="text-lg text-gray-400 mb-4">by {book.author}</p>
                                )}
                            </div>
                            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getConditionColor(book.condition)}`}>
                                {book.condition}
                            </span>
                        </div>

                        {/* Price */}
                        <div className="mb-6">
                            <div className="flex items-baseline gap-3">
                                <span className="text-4xl font-bold gradient-text">
                                    {formatPrice(book.price)}
                                </span>
                                {book.mrp && book.mrp > book.price && (
                                    <>
                                        <span className="text-xl text-gray-500 line-through">
                                            {formatPrice(book.mrp)}
                                        </span>
                                        <span className="text-sm text-green-400 font-medium">
                                            {Math.round(((book.mrp - book.price) / book.mrp) * 100)}% OFF
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Meta Tags */}
                        <div className="flex flex-wrap gap-2 mb-6">
                            {book.subject && <span className="badge badge-primary">{book.subject}</span>}
                            {book.semester && <span className="badge badge-secondary">{book.semester}</span>}
                            {book.branch && <span className="badge badge-accent">{book.branch}</span>}
                        </div>

                        {/* Description */}
                        {book.description && (
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-gray-400 mb-2">Description</h3>
                                <p className="text-gray-300 whitespace-pre-wrap">{book.description}</p>
                            </div>
                        )}

                        {/* Meetup Location */}
                        {book.preferredMeetupLocation && (
                            <div className="flex items-start gap-3 p-4 bg-dark-200 rounded-lg">
                                <MapPin className="w-5 h-5 text-primary-400 mt-0.5" />
                                <div>
                                    <div className="text-sm font-semibold text-gray-400 mb-1">Preferred Meetup Location</div>
                                    <div className="text-white">{book.preferredMeetupLocation}</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Seller Info */}
                    <div className="card">
                        <h3 className="text-lg font-semibold text-white mb-4">Seller Information</h3>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
                                {book.listedBy?.profilePicture ? (
                                    <img
                                        src={book.listedBy.profilePicture}
                                        alt={book.listedBy.name}
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                ) : (
                                    <User className="w-8 h-8 text-white" />
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="text-white font-semibold text-lg">{book.listedBy?.name || 'Anonymous'}</div>
                                <div className="text-sm text-gray-400">{book.listedBy?.campus || 'Campus'}</div>
                                <div className="text-sm text-gray-400">
                                    {book.listedBy?.reputationScore || 0} reputation points
                                </div>
                            </div>
                        </div>
                        {/* Seller badges + star rating */}
                        {book.listedBy?._id && (
                            <BadgeRow userId={book.listedBy._id} size="sm" />
                        )}
                    </div>

                    {/* Reviews for this seller */}
                    {book.listedBy?._id && (
                        <div className="card">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Star className="w-5 h-5 text-amber-400" />
                                Seller Reviews
                            </h3>
                            <ReviewList sellerId={book.listedBy._id} />
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    {/* Actions Card */}
                    <div className="card space-y-3 sticky top-20">
                        <h3 className="text-lg font-semibold text-white mb-4">Actions</h3>

                        {!isOwner && book.status === 'available' && (
                            <button
                                onClick={handleContactSeller}
                                className="btn-primary w-full flex items-center justify-center gap-2"
                            >
                                <MessageCircle className="w-5 h-5" />
                                Contact Seller
                            </button>
                        )}

                        {isOwner && book.status === 'available' && (
                            <>
                                <button
                                    onClick={handleMarkAsSold}
                                    className="btn-primary w-full flex items-center justify-center gap-2"
                                >
                                    <CheckCircle className="w-5 h-5" />
                                    Mark as Sold
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="btn-secondary w-full flex items-center justify-center gap-2 text-red-400 hover:bg-red-500/20"
                                >
                                    <Trash2 className="w-5 h-5" />
                                    Delete Listing
                                </button>
                            </>
                        )}

                        {book.status === 'sold' && (
                            <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-center">
                                <CheckCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                                <div className="text-white font-semibold">This book has been sold</div>
                            </div>
                        )}

                        {/* Review form — shown to buyer after book is sold */}
                        {book.status === 'sold' && !isOwner && reviewable && !reviewDone && (
                            <ReviewForm
                                bookId={book._id}
                                sellerId={book.listedBy?._id}
                                onSubmitted={() => { setReviewDone(true); setReviewable(false) }}
                            />
                        )}
                        {reviewDone && (
                            <div className="p-4 rounded-xl border border-green-500/30 bg-green-500/10 text-green-400 text-sm text-center">
                                ✅ Thank you for your review!
                            </div>
                        )}
                    </div>

                    {/* Info Card */}
                    <div className="card space-y-3">
                        <h3 className="text-lg font-semibold text-white mb-4">Information</h3>

                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Calendar className="w-4 h-4" />
                            <span>Listed {formatDate(book.createdAt)}</span>
                        </div>

                        {book.isbn && (
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                <Tag className="w-4 h-4" />
                                <span>ISBN: {book.isbn}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default BookDetail
