import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import {
    TrendingUp,
    FileText,
    BookOpen,
    Upload,
    Plus,
    Award,
    Users,
    Download
} from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import NoteCard from '../components/NoteCard'
import BookCard from '../components/BookCard'

const Dashboard = () => {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalNotes: 0,
        totalBooks: 0,
        myNotes: 0,
        myBooks: 0
    })
    const [popularNotes, setPopularNotes] = useState([])
    const [recentBooks, setRecentBooks] = useState([])

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        try {
            setLoading(true)

            // Fetch popular notes
            const notesRes = await api.get('/notes/popular?limit=3')
            setPopularNotes(notesRes.data.data || [])

            // Fetch recent books
            const booksRes = await api.get('/books?limit=3&sortBy=recent')
            setRecentBooks(booksRes.data.data || [])

            // You can add more API calls for stats if backend provides them
            setStats({
                totalNotes: notesRes.data.total || 0,
                totalBooks: booksRes.data.total || 0,
                myNotes: 0, // Can be fetched from user profile
                myBooks: 0
            })
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <LoadingSpinner size="large" text="Loading dashboard..." />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div className="card bg-gradient-to-br from-primary-500/20 to-accent-500/20 border-primary-500/30">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">
                            Welcome back, {user?.name?.split(' ')[0]}! 👋
                        </h1>
                        <p className="text-gray-300">
                            {user?.college || 'Your Campus'} • {user?.branch || 'Student'}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <div className="text-sm text-gray-400">Reputation</div>
                            <div className="text-2xl font-bold gradient-text flex items-center gap-2">
                                <Award className="w-6 h-6" />
                                {user?.reputationPoints || 0}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                    to="/upload-note"
                    className="card hover:scale-[1.02] transition-all bg-gradient-to-br from-primary-500/10 to-primary-500/5 border-primary-500/20 group"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-primary-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Upload className="w-7 h-7 text-primary-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-1">Upload Notes</h3>
                            <p className="text-sm text-gray-400">Share your handwritten notes</p>
                        </div>
                    </div>
                </Link>

                <Link
                    to="/list-book"
                    className="card hover:scale-[1.02] transition-all bg-gradient-to-br from-accent-500/10 to-accent-500/5 border-accent-500/20 group"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-accent-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Plus className="w-7 h-7 text-accent-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-1">List a Book</h3>
                            <p className="text-sm text-gray-400">Sell your textbooks</p>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="card text-center">
                    <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <FileText className="w-6 h-6 text-primary-400" />
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">{stats.totalNotes}</div>
                    <div className="text-sm text-gray-400">Total Notes</div>
                </div>

                <div className="card text-center">
                    <div className="w-12 h-12 bg-accent-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <BookOpen className="w-6 h-6 text-accent-400" />
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">{stats.totalBooks}</div>
                    <div className="text-sm text-gray-400">Available Books</div>
                </div>

                <div className="card text-center">
                    <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <Upload className="w-6 h-6 text-green-400" />
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">{user?.notesUploaded || 0}</div>
                    <div className="text-sm text-gray-400">My Uploads</div>
                </div>

                <div className="card text-center">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <Download className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">{user?.notesDownloaded || 0}</div>
                    <div className="text-sm text-gray-400">Downloads</div>
                </div>
            </div>

            {/* Popular Notes */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-6 h-6 text-primary-400" />
                        <h2 className="text-2xl font-bold text-white">Popular Notes</h2>
                    </div>
                    <Link to="/notes" className="text-primary-400 hover:text-primary-300 font-medium">
                        View All →
                    </Link>
                </div>

                {popularNotes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {popularNotes.map(note => (
                            <NoteCard key={note._id} note={note} />
                        ))}
                    </div>
                ) : (
                    <div className="card text-center py-12">
                        <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400">No notes available yet</p>
                    </div>
                )}
            </div>

            {/* Recent Books */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <BookOpen className="w-6 h-6 text-accent-400" />
                        <h2 className="text-2xl font-bold text-white">Recent Books</h2>
                    </div>
                    <Link to="/books" className="text-accent-400 hover:text-accent-300 font-medium">
                        View All →
                    </Link>
                </div>

                {recentBooks.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {recentBooks.map(book => (
                            <BookCard key={book._id} book={book} />
                        ))}
                    </div>
                ) : (
                    <div className="card text-center py-12">
                        <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400">No books available yet</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Dashboard
