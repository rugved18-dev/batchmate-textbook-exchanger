import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import {
    User,
    Mail,
    Award,
    BookOpen,
    FileText,
    Upload,
    Download,
    Edit2,
    Save,
    X,
    Star
} from 'lucide-react'
import api from '../utils/api'
import LoadingSpinner from '../components/LoadingSpinner'
import NoteCard from '../components/NoteCard'
import BookCard from '../components/BookCard'
import { BadgeRow, ReviewList } from '../components/BadgeReview'
import toast from 'react-hot-toast'

const Profile = () => {
    const { user, updateUser } = useAuth()
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [myNotes, setMyNotes] = useState([])
    const [myBooks, setMyBooks] = useState([])
    const [activeTab, setActiveTab] = useState('notes')
    const [formData, setFormData] = useState({
        name: '',
        bio: '',
        phone: ''
    })

    useEffect(() => {
        fetchProfileData()
    }, [])

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                bio: user.bio || '',
                phone: user.phone || ''
            })
        }
    }, [user])

    const fetchProfileData = async () => {
        try {
            setLoading(true)

            // Fetch user's notes
            const notesRes = await api.get('/notes?uploadedBy=me')
            setMyNotes(notesRes.data.data || [])

            // Fetch user's books
            const booksRes = await api.get('/books?listedBy=me')
            setMyBooks(booksRes.data.data || [])
        } catch (error) {
            console.error('Failed to fetch profile data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleSave = async () => {
        try {
            setSaving(true)
            const response = await api.put('/users/profile', formData)
            updateUser(response.data.data)
            toast.success('Profile updated successfully')
            setEditing(false)
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update profile')
        } finally {
            setSaving(false)
        }
    }

    const handleCancel = () => {
        setFormData({
            name: user.name || '',
            bio: user.bio || '',
            phone: user.phone || ''
        })
        setEditing(false)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <LoadingSpinner size="large" text="Loading profile..." />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
                <p className="text-gray-400">Manage your account and view your activity</p>
            </div>

            {/* Profile Card */}
            <div className="card">
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                        <div className="w-32 h-32 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center">
                            {user?.profilePicture ? (
                                <img
                                    src={user.profilePicture}
                                    alt={user.name}
                                    className="w-full h-full rounded-2xl object-cover"
                                />
                            ) : (
                                <User className="w-16 h-16 text-white" />
                            )}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 space-y-4">
                        {editing ? (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Name
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="input w-full"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Bio
                                    </label>
                                    <textarea
                                        name="bio"
                                        value={formData.bio}
                                        onChange={handleChange}
                                        className="input w-full min-h-[80px]"
                                        placeholder="Tell us about yourself..."
                                        rows={3}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Phone
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="input w-full"
                                        placeholder="+91 XXXXXXXXXX"
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="btn-primary flex items-center gap-2"
                                    >
                                        {saving ? (
                                            <>
                                                <LoadingSpinner size="small" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-5 h-5" />
                                                Save Changes
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={handleCancel}
                                        className="btn-secondary flex items-center gap-2"
                                    >
                                        <X className="w-5 h-5" />
                                        Cancel
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div>
                                    <h2 className="text-2xl font-bold text-white mb-1">{user?.name}</h2>
                                    <div className="flex items-center gap-2 text-gray-400 mb-3">
                                        <Mail className="w-4 h-4" />
                                        <span>{user?.email}</span>
                                    </div>
                                    {/* ⭐ Badges */}
                                    <BadgeRow userId={user?._id} />
                                    {user?.bio && (
                                        <p className="text-gray-300 mt-3 mb-2">{user.bio}</p>
                                    )}
                                    {user?.phone && (
                                        <p className="text-gray-400">📱 {user.phone}</p>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <span className="badge badge-primary">{user?.college || 'College'}</span>
                                    <span className="badge badge-secondary">{user?.branch || 'Branch'}</span>
                                    <span className="badge badge-accent">{user?.semester || 'Semester'}</span>
                                </div>

                                <button
                                    onClick={() => setEditing(true)}
                                    className="btn-secondary flex items-center gap-2 w-fit"
                                >
                                    <Edit2 className="w-5 h-5" />
                                    Edit Profile
                                </button>
                            </>
                        )}
                    </div>

                    {/* Stats */}
                    <div className="flex md:flex-col gap-4">
                        <div className="card bg-primary-500/10 border-primary-500/30 text-center min-w-[120px]">
                            <Award className="w-8 h-8 text-primary-400 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-white">{user?.reputationPoints || 0}</div>
                            <div className="text-xs text-gray-400">Reputation</div>
                        </div>

                        <div className="card bg-accent-500/10 border-accent-500/30 text-center min-w-[120px]">
                            <Upload className="w-8 h-8 text-accent-400 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-white">{myNotes.length}</div>
                            <div className="text-xs text-gray-400">Notes Uploaded</div>
                        </div>

                        <div className="card bg-green-500/10 border-green-500/30 text-center min-w-[120px]">
                            <BookOpen className="w-8 h-8 text-green-400 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-white">{myBooks.length}</div>
                            <div className="text-xs text-gray-400">Books Listed</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-white/10">
                <button
                    onClick={() => setActiveTab('notes')}
                    className={`pb-3 px-4 font-medium transition-colors relative ${activeTab === 'notes'
                        ? 'text-primary-400'
                        : 'text-gray-400 hover:text-white'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        My Notes ({myNotes.length})
                    </div>
                    {activeTab === 'notes' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-400" />
                    )}
                </button>

                <button
                    onClick={() => setActiveTab('books')}
                    className={`pb-3 px-4 font-medium transition-colors relative ${activeTab === 'books'
                        ? 'text-primary-400'
                        : 'text-gray-400 hover:text-white'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5" />
                        My Books ({myBooks.length})
                    </div>
                    {activeTab === 'books' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-400" />
                    )}
                </button>

                <button
                    onClick={() => setActiveTab('reviews')}
                    className={`pb-3 px-4 font-medium transition-colors relative ${activeTab === 'reviews'
                        ? 'text-primary-400'
                        : 'text-gray-400 hover:text-white'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Star className="w-5 h-5" />
                        Reviews
                    </div>
                    {activeTab === 'reviews' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-400" />
                    )}
                </button>
            </div>

            {/* Content */}
            <div>
                {activeTab === 'notes' && (
                    myNotes.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {myNotes.map(note => (
                                <NoteCard key={note._id} note={note} />
                            ))}
                        </div>
                    ) : (
                        <div className="card text-center py-12">
                            <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-white mb-2">No notes uploaded yet</h3>
                            <p className="text-gray-400 mb-4">Share your handwritten notes with your batchmates</p>
                            <a href="/upload-note" className="btn-primary inline-flex items-center gap-2">
                                <Upload className="w-5 h-5" />
                                Upload First Note
                            </a>
                        </div>
                    )
                )}

                {activeTab === 'books' && (
                    myBooks.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {myBooks.map(book => (
                                <BookCard key={book._id} book={book} />
                            ))}
                        </div>
                    ) : (
                        <div className="card text-center py-12">
                            <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-white mb-2">No books listed yet</h3>
                            <p className="text-gray-400 mb-4">Start selling your textbooks to your batchmates</p>
                            <a href="/list-book" className="btn-primary inline-flex items-center gap-2">
                                <Upload className="w-5 h-5" />
                                List First Book
                            </a>
                        </div>
                    )
                )}

                {activeTab === 'reviews' && (
                    <div className="max-w-2xl">
                        <ReviewList sellerId={user?._id} />
                    </div>
                )}
            </div>
        </div>
    )
}

export default Profile
