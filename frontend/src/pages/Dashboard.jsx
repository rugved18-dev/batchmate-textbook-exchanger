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
    Download,
    Users,
    ShoppingBag,
    Star,
    BarChart2,
    Activity
} from 'lucide-react'
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart,
    Legend
} from 'recharts'
import LoadingSpinner from '../components/LoadingSpinner'
import NoteCard from '../components/NoteCard'
import BookCard from '../components/BookCard'

// ── Custom Recharts Tooltip ───────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label, unit = '' }) => {
    if (!active || !payload?.length) return null
    return (
        <div className="glass border border-white/10 rounded-xl px-4 py-3 shadow-xl">
            <p className="text-gray-400 text-xs mb-1">{label}</p>
            {payload.map((p, i) => (
                <p key={i} className="text-white text-sm font-semibold" style={{ color: p.color }}>
                    {p.name}: <span className="text-white">{p.value}{unit}</span>
                </p>
            ))}
        </div>
    )
}

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color, sub }) => (
    <div className="card flex items-center gap-4">
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
            <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="min-w-0">
            <div className="text-2xl font-bold text-white">{value ?? '—'}</div>
            <div className="text-sm text-gray-400 truncate">{label}</div>
            {sub && <div className="text-xs text-gray-600 truncate">{sub}</div>}
        </div>
    </div>
)

// ── Chart section wrapper ─────────────────────────────────────────────────────
const ChartCard = ({ title, subtitle, icon: Icon, children }) => (
    <div className="card">
        <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 bg-primary-500/20 rounded-lg flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary-400" />
            </div>
            <div>
                <h3 className="text-white font-semibold">{title}</h3>
                {subtitle && <p className="text-gray-500 text-xs">{subtitle}</p>}
            </div>
        </div>
        {children}
    </div>
)

// ── Shared axis/grid styles ───────────────────────────────────────────────────
const axisStyle = { fill: '#6b7280', fontSize: 11 }
const gridStyle = { stroke: 'rgba(255,255,255,0.05)' }
const COLORS = { primary: '#6366f1', accent: '#06b6d4', green: '#22c55e', amber: '#f59e0b' }

// ─────────────────────────────────────────────────────────────────────────────

const Dashboard = () => {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [analytics, setAnalytics] = useState(null)
    const [popularNotes, setPopularNotes] = useState([])
    const [recentBooks, setRecentBooks] = useState([])

    useEffect(() => {
        fetchAll()
    }, [])

    const fetchAll = async () => {
        try {
            setLoading(true)
            const [analyticsRes, notesRes, booksRes] = await Promise.all([
                api.get('/users/analytics'),
                api.get('/notes/popular?limit=3'),
                api.get('/books?limit=3&sortBy=recent')
            ])
            setAnalytics(analyticsRes.data.data)
            setPopularNotes(notesRes.data.notes || notesRes.data.data || [])
            setRecentBooks(booksRes.data.books || booksRes.data.data || [])
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

    const { myStats = {}, campusStats = {}, charts = {} } = analytics || {}

    return (
        <div className="space-y-8">

            {/* ── Welcome Banner ───────────────────────────────────────────── */}
            <div className="card bg-gradient-to-br from-primary-500/20 via-accent-500/10 to-transparent border-primary-500/30 relative overflow-hidden">
                {/* decorative glow */}
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-1">
                            Welcome back, {user?.name?.split(' ')[0]}! 👋
                        </h1>
                        <p className="text-gray-400">
                            {user?.college || 'Your Campus'}&nbsp;·&nbsp;{user?.branch || user?.department || 'Student'}
                        </p>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-center">
                            <div className="text-xs text-gray-500 mb-1">Reputation</div>
                            <div className="text-2xl font-bold gradient-text flex items-center gap-1.5">
                                <Award className="w-5 h-5" />
                                {user?.reputationPoints || user?.reputationScore || 0}
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-xs text-gray-500 mb-1">Campus peers</div>
                            <div className="text-2xl font-bold text-white flex items-center gap-1.5">
                                <Users className="w-5 h-5 text-accent-400" />
                                {campusStats.campusUsers ?? '—'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Quick Actions ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            {/* ── My Stats + Campus Stats ───────────────────────────────────── */}
            <div>
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary-400" /> Your Stats
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard
                        icon={FileText}
                        label="Notes Uploaded"
                        value={myStats.notesUploaded}
                        color="bg-primary-500"
                    />
                    <StatCard
                        icon={Star}
                        label="Total Upvotes"
                        value={myStats.totalUpvotes}
                        color="bg-yellow-500"
                    />
                    <StatCard
                        icon={Download}
                        label="Total Downloads"
                        value={myStats.totalDownloads}
                        color="bg-green-500"
                    />
                    <StatCard
                        icon={ShoppingBag}
                        label="Books Listed"
                        value={myStats.booksListed}
                        color="bg-accent-500"
                    />
                </div>
            </div>

            <div>
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-accent-400" /> Campus Activity
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard
                        icon={FileText}
                        label="Campus Notes"
                        value={campusStats.totalNotes}
                        color="bg-indigo-500"
                        sub="available on platform"
                    />
                    <StatCard
                        icon={BookOpen}
                        label="Books Available"
                        value={campusStats.totalBooks}
                        color="bg-purple-500"
                        sub="for sale right now"
                    />
                    <StatCard
                        icon={TrendingUp}
                        label="Book Requests"
                        value={campusStats.totalBookRequests}
                        color="bg-orange-500"
                        sub="active requests"
                    />
                    <StatCard
                        icon={Users}
                        label="Peers"
                        value={campusStats.campusUsers}
                        color="bg-teal-500"
                        sub="on your campus"
                    />
                </div>
            </div>

            {/* ── Charts ───────────────────────────────────────────────────── */}
            <div>
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-primary-400" /> Analytics — Last 8 Weeks
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* 1. Upvotes on my notes — Area Line chart */}
                    <ChartCard
                        title="Notes Upvotes"
                        subtitle="Weekly upvotes received on your notes"
                        icon={Star}
                    >
                        <ResponsiveContainer width="100%" height={220}>
                            <AreaChart data={charts.upvotes || []} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="upvoteGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" {...gridStyle} />
                                <XAxis dataKey="week" tick={axisStyle} axisLine={false} tickLine={false} />
                                <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    name="Upvotes"
                                    stroke={COLORS.primary}
                                    strokeWidth={2.5}
                                    fill="url(#upvoteGrad)"
                                    dot={{ r: 4, fill: COLORS.primary, strokeWidth: 0 }}
                                    activeDot={{ r: 6 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    {/* 2. Campus Book Requests — Bar chart */}
                    <ChartCard
                        title="Campus Book Requests"
                        subtitle="Weekly book requests from all campus students"
                        icon={BookOpen}
                    >
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={charts.bookRequests || []} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={COLORS.accent} stopOpacity={0.9} />
                                        <stop offset="100%" stopColor={COLORS.accent} stopOpacity={0.4} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" {...gridStyle} />
                                <XAxis dataKey="week" tick={axisStyle} axisLine={false} tickLine={false} />
                                <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar
                                    dataKey="value"
                                    name="Requests"
                                    fill="url(#barGrad)"
                                    radius={[6, 6, 0, 0]}
                                    maxBarSize={40}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    {/* 3. My note uploads + campus upvotes combined — Line chart */}
                    <ChartCard
                        title="My Upload Activity"
                        subtitle="Notes you uploaded each week"
                        icon={Upload}
                    >
                        <ResponsiveContainer width="100%" height={220}>
                            <AreaChart data={charts.myUploads || []} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="uploadGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={COLORS.green} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={COLORS.green} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" {...gridStyle} />
                                <XAxis dataKey="week" tick={axisStyle} axisLine={false} tickLine={false} />
                                <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    name="Uploads"
                                    stroke={COLORS.green}
                                    strokeWidth={2.5}
                                    fill="url(#uploadGrad)"
                                    dot={{ r: 4, fill: COLORS.green, strokeWidth: 0 }}
                                    activeDot={{ r: 6 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    {/* 4. Leaderboard mini-panel */}
                    <ChartCard
                        title="Platform Overview"
                        subtitle="Snapshot of your contribution vs campus"
                        icon={TrendingUp}
                    >
                        <div className="space-y-4">
                            {[
                                {
                                    label: 'Your notes',
                                    mine: myStats.notesUploaded || 0,
                                    total: campusStats.totalNotes || 1,
                                    color: COLORS.primary
                                },
                                {
                                    label: 'Your books listed',
                                    mine: myStats.booksListed || 0,
                                    total: campusStats.totalBooks || 1,
                                    color: COLORS.accent
                                },
                                {
                                    label: 'Your upvotes',
                                    mine: myStats.totalUpvotes || 0,
                                    total: Math.max(myStats.totalUpvotes || 0, campusStats.totalNotes * 5 || 5),
                                    color: COLORS.amber
                                },
                                {
                                    label: 'Downloads earned',
                                    mine: myStats.totalDownloads || 0,
                                    total: Math.max(myStats.totalDownloads || 0, campusStats.totalNotes * 10 || 10),
                                    color: COLORS.green
                                }
                            ].map(({ label, mine, total, color }) => {
                                const pct = total > 0 ? Math.min(100, Math.round((mine / total) * 100)) : 0
                                return (
                                    <div key={label}>
                                        <div className="flex justify-between text-xs mb-1.5">
                                            <span className="text-gray-400">{label}</span>
                                            <span className="text-white font-semibold">{mine} <span className="text-gray-600">/ {total}</span></span>
                                        </div>
                                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-700"
                                                style={{ width: `${pct}%`, background: color }}
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </ChartCard>

                </div>
            </div>

            {/* ── Popular Notes ─────────────────────────────────────────────── */}
            <div>
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary-400" />
                        <h2 className="text-xl font-bold text-white">Popular Notes</h2>
                    </div>
                    <Link to="/notes" className="text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors">
                        View All →
                    </Link>
                </div>
                {popularNotes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {popularNotes.map(note => <NoteCard key={note._id} note={note} />)}
                    </div>
                ) : (
                    <div className="card text-center py-12">
                        <FileText className="w-14 h-14 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400">No notes available yet</p>
                    </div>
                )}
            </div>

            {/* ── Recent Books ──────────────────────────────────────────────── */}
            <div>
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-accent-400" />
                        <h2 className="text-xl font-bold text-white">Recent Books</h2>
                    </div>
                    <Link to="/books" className="text-accent-400 hover:text-accent-300 text-sm font-medium transition-colors">
                        View All →
                    </Link>
                </div>
                {recentBooks.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {recentBooks.map(book => <BookCard key={book._id} book={book} />)}
                    </div>
                ) : (
                    <div className="card text-center py-12">
                        <BookOpen className="w-14 h-14 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400">No books available yet</p>
                    </div>
                )}
            </div>

        </div>
    )
}

export default Dashboard
