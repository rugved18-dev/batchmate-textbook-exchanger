import { useState, useEffect, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import {
    LayoutDashboard, Users, FileText, BookOpen,
    Flag, TrendingUp, ShieldAlert, ShieldCheck,
    Ban, UserCheck, Eye, EyeOff, Trash2, CheckCircle,
    XCircle, ChevronLeft, ChevronRight, Search,
    RefreshCw, Crown, Loader2, AlertTriangle, BarChart3
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import toast from 'react-hot-toast'

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) => (n ?? 0).toLocaleString()
const fmtDt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'

// ── Small reusable components ─────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, color = 'primary' }) => {
    const colors = {
        primary: 'from-primary-500/20 to-primary-500/5 border-primary-500/30 text-primary-400',
        green: 'from-green-500/20 to-green-500/5 border-green-500/30 text-green-400',
        amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/30 text-amber-400',
        red: 'from-red-500/20 to-red-500/5 border-red-500/30 text-red-400',
        violet: 'from-violet-500/20 to-violet-500/5 border-violet-500/30 text-violet-400',
        blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/30 text-blue-400',
    }
    return (
        <div className={`p-5 rounded-2xl border bg-gradient-to-br ${colors[color]}`}>
            <div className="flex items-start justify-between mb-3">
                <Icon className="w-5 h-5" />
                {sub !== undefined && <span className="text-xs opacity-60">{sub}</span>}
            </div>
            <div className="text-2xl font-bold text-white">{fmt(value)}</div>
            <div className="text-xs opacity-70 mt-1">{label}</div>
        </div>
    )
}

const Badge = ({ children, color = 'gray' }) => {
    const c = {
        gray: 'bg-gray-500/20 text-gray-300',
        green: 'bg-green-500/20 text-green-400',
        amber: 'bg-amber-500/20 text-amber-400',
        red: 'bg-red-500/20 text-red-400',
        violet: 'bg-violet-500/20 text-violet-300',
        blue: 'bg-blue-500/20 text-blue-300',
    }[color]
    return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c}`}>{children}</span>
}

const ActionBtn = ({ onClick, icon: Icon, label, color = 'gray', loading }) => {
    const c = {
        gray: 'hover:bg-white/10 text-gray-400 hover:text-white',
        red: 'hover:bg-red-500/20 text-gray-400 hover:text-red-400',
        green: 'hover:bg-green-500/20 text-gray-400 hover:text-green-400',
        amber: 'hover:bg-amber-500/20 text-gray-400 hover:text-amber-400',
        violet: 'hover:bg-violet-500/20 text-gray-400 hover:text-violet-400',
    }[color]
    return (
        <button
            onClick={onClick}
            disabled={loading}
            title={label}
            className={`p-1.5 rounded-lg transition-all ${c} disabled:opacity-40`}
        >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
        </button>
    )
}

const Pagination = ({ page, pages, onPage }) => pages <= 1 ? null : (
    <div className="flex items-center justify-center gap-3 mt-4">
        <button onClick={() => onPage(page - 1)} disabled={page <= 1} className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 transition-all">
            <ChevronLeft className="w-4 h-4 text-gray-400" />
        </button>
        <span className="text-sm text-gray-400">{page} / {pages}</span>
        <button onClick={() => onPage(page + 1)} disabled={page >= pages} className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 transition-all">
            <ChevronRight className="w-4 h-4 text-gray-400" />
        </button>
    </div>
)

const SearchInput = ({ value, onChange, placeholder }) => (
    <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className="input pl-9 text-sm w-full"
        />
    </div>
)

const TableTh = ({ children }) => (
    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">{children}</th>
)

// ── TAB: Overview ─────────────────────────────────────────────────────────────
const OverviewTab = ({ stats }) => {
    if (!stats) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-primary-400 animate-spin" /></div>
    const { users, notes, books, reports } = stats
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={Users} label="Total Users" value={users.total} sub={`+${users.new7d} this week`} color="primary" />
                <StatCard icon={TrendingUp} label="Active (7d)" value={users.active7d} sub={`${users.blocked} blocked`} color="green" />
                <StatCard icon={FileText} label="Notes" value={notes.total} sub={`${notes.pending} pending`} color="violet" />
                <StatCard icon={BookOpen} label="Books" value={books.total} sub={`${books.active} active`} color="blue" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={ShieldAlert} label="Open Reports" value={reports.open} sub={`${reports.total} total`} color="red" />
                <StatCard icon={EyeOff} label="Hidden Notes" value={notes.hidden} color="amber" />
                <StatCard icon={Ban} label="Blocked Users" value={users.blocked} color="red" />
                <StatCard icon={Flag} label="Total Reports" value={reports.total} color="amber" />
            </div>

            {/* Signup trend mini-chart */}
            <div className="card">
                <h3 className="text-sm font-semibold text-gray-400 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" /> New User Signups (last 30 days)
                </h3>
                {stats.signupTrend?.length > 0 ? (
                    <div className="flex items-end gap-1 h-24">
                        {stats.signupTrend.map(d => {
                            const max = Math.max(...stats.signupTrend.map(x => x.count), 1)
                            const h = Math.max(8, (d.count / max) * 96)
                            return (
                                <div key={d._id} className="flex-1 flex flex-col items-center gap-1 group relative">
                                    <div
                                        className="w-full bg-primary-500/40 rounded-sm hover:bg-primary-400/60 transition-colors"
                                        style={{ height: `${h}px` }}
                                    />
                                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:flex bg-dark-100 border border-white/10 rounded px-2 py-1 text-[10px] text-white whitespace-nowrap">
                                        {d._id}: {d.count}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : <p className="text-gray-600 text-sm">No signup data yet.</p>}
            </div>
        </div>
    )
}

// ── TAB: Users ────────────────────────────────────────────────────────────────
const UsersTab = () => {
    const [users, setUsers] = useState([])
    const [total, setTotal] = useState(0)
    const [pages, setPages] = useState(1)
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')
    const [role, setRole] = useState('')
    const [blocked, setBlocked] = useState('')
    const [loading, setLoading] = useState(false)
    const [acting, setActing] = useState({})

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({ page, limit: 15, search, role, blocked })
            const res = await api.get(`/admin/users?${params}`)
            setUsers(res.data.users); setTotal(res.data.total)
            setPages(res.data.pages)
        } catch { toast.error('Failed to load users') }
        finally { setLoading(false) }
    }, [page, search, role, blocked])

    useEffect(() => { setPage(1) }, [search, role, blocked])
    useEffect(() => { load() }, [load])

    const act = async (id, fn) => {
        setActing(a => ({ ...a, [id]: true }))
        await fn()
        await load()
        setActing(a => ({ ...a, [id]: false }))
    }

    const toggleBlock = (u) => act(u._id, async () => {
        await api.patch(`/admin/users/${u._id}/block`)
        toast.success(u.isBlocked ? 'User unblocked' : 'User blocked')
    })

    const setRole_ = (u, role) => act(u._id + role, async () => {
        await api.patch(`/admin/users/${u._id}/role`, { role })
        toast.success(`Role set to ${role}`)
    })

    const roleBadge = r => ({ admin: 'red', moderator: 'violet', user: 'gray' }[r] || 'gray')

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
                <div className="flex-1 min-w-48"><SearchInput value={search} onChange={setSearch} placeholder="Search name, email, campus…" /></div>
                <select value={role} onChange={e => setRole(e.target.value)} className="input text-sm">
                    <option value="">All roles</option>
                    <option value="user">User</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                </select>
                <select value={blocked} onChange={e => setBlocked(e.target.value)} className="input text-sm">
                    <option value="">All status</option>
                    <option value="false">Active</option>
                    <option value="true">Blocked</option>
                </select>
            </div>

            <div className="card p-0 overflow-hidden">
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                    <span className="text-sm text-gray-400">{fmt(total)} users</span>
                    {loading && <Loader2 className="w-4 h-4 text-primary-400 animate-spin" />}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-b border-white/5">
                            <tr><TableTh>User</TableTh><TableTh>Campus</TableTh><TableTh>Dept/Sem</TableTh><TableTh>Role</TableTh><TableTh>Rep</TableTh><TableTh>Joined</TableTh><TableTh>Actions</TableTh></tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u._id} className={`border-b border-white/5 hover:bg-white/3 transition-colors ${u.isBlocked ? 'opacity-50' : ''}`}>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-2">
                                            {u.profilePicture
                                                ? <img src={u.profilePicture} className="w-7 h-7 rounded-full object-cover" alt="" />
                                                : <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-xs text-white font-bold">{u.name?.[0]}</div>}
                                            <div>
                                                <div className="text-sm text-white font-medium">{u.name}</div>
                                                <div className="text-xs text-gray-500">{u.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-sm text-gray-400">{u.campus}</td>
                                    <td className="py-3 px-4 text-sm text-gray-400">{u.department?.split(' ')[0]} · Sem {u.semester}</td>
                                    <td className="py-3 px-4"><Badge color={roleBadge(u.role)}>{u.role}</Badge></td>
                                    <td className="py-3 px-4 text-sm text-gray-300">{u.reputationScore}</td>
                                    <td className="py-3 px-4 text-sm text-gray-500">{fmtDt(u.createdAt)}</td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-1">
                                            <ActionBtn onClick={() => toggleBlock(u)} icon={u.isBlocked ? UserCheck : Ban} label={u.isBlocked ? 'Unblock' : 'Block'} color={u.isBlocked ? 'green' : 'red'} loading={acting[u._id]} />
                                            {u.role !== 'moderator' && u.role !== 'admin' && (
                                                <ActionBtn onClick={() => setRole_(u, 'moderator')} icon={ShieldCheck} label="Make Moderator" color="violet" loading={acting[u._id + 'moderator']} />
                                            )}
                                            {u.role === 'moderator' && (
                                                <ActionBtn onClick={() => setRole_(u, 'user')} icon={Users} label="Demote to User" color="amber" loading={acting[u._id + 'user']} />
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {!loading && users.length === 0 && <p className="text-center text-gray-600 py-10">No users found</p>}
                </div>
            </div>
            <Pagination page={page} pages={pages} onPage={setPage} />
        </div>
    )
}

// ── TAB: Notes ────────────────────────────────────────────────────────────────
const NotesTab = () => {
    const [notes, setNotes] = useState([])
    const [total, setTotal] = useState(0)
    const [pages, setPages] = useState(1)
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')
    const [status, setStatus] = useState('')
    const [loading, setLoading] = useState(false)
    const [acting, setActing] = useState({})

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({ page, limit: 15, search, status })
            const res = await api.get(`/admin/notes?${params}`)
            setNotes(res.data.notes); setTotal(res.data.total); setPages(res.data.pages)
        } catch { toast.error('Failed to load notes') }
        finally { setLoading(false) }
    }, [page, search, status])

    useEffect(() => { setPage(1) }, [search, status])
    useEffect(() => { load() }, [load])

    const moderate = (id, action) => {
        setActing(a => ({ ...a, [id + action]: true }))
        api.patch(`/admin/notes/${id}/moderate`, { action })
            .then(() => { toast.success(`Note ${action}d`); load() })
            .catch(() => toast.error('Action failed'))
            .finally(() => setActing(a => ({ ...a, [id + action]: false })))
    }

    const statusBadge = (n) => {
        if (n.isHidden) return <Badge color="red">Hidden</Badge>
        if (n.moderationStatus === 'pending') return <Badge color="amber">Pending</Badge>
        if (n.moderationStatus === 'approved') return <Badge color="green">Approved</Badge>
        if (n.moderationStatus === 'flagged') return <Badge color="violet">Flagged</Badge>
        return <Badge>{n.moderationStatus}</Badge>
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
                <div className="flex-1 min-w-48"><SearchInput value={search} onChange={setSearch} placeholder="Search title, subject…" /></div>
                <select value={status} onChange={e => setStatus(e.target.value)} className="input text-sm">
                    <option value="">All</option>
                    <option value="pending">Pending</option>
                    <option value="flagged">Flagged</option>
                    <option value="hidden">Hidden</option>
                </select>
            </div>
            <div className="card p-0 overflow-hidden">
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                    <span className="text-sm text-gray-400">{fmt(total)} notes</span>
                    {loading && <Loader2 className="w-4 h-4 text-primary-400 animate-spin" />}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-b border-white/5">
                            <tr><TableTh>Note</TableTh><TableTh>Uploader</TableTh><TableTh>Subject</TableTh><TableTh>Status</TableTh><TableTh>Stats</TableTh><TableTh>Uploaded</TableTh><TableTh>Actions</TableTh></tr>
                        </thead>
                        <tbody>
                            {notes.map(n => (
                                <tr key={n._id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                                    <td className="py-3 px-4 max-w-[200px]">
                                        <div className="flex items-center gap-2">
                                            {n.thumbnailUrl && <img src={n.thumbnailUrl} className="w-8 h-8 rounded object-cover flex-shrink-0" alt="" />}
                                            <span className="text-sm text-white truncate">{n.title}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-sm text-gray-400">{n.uploadedBy?.name || '—'}</td>
                                    <td className="py-3 px-4 text-sm text-gray-400">{n.subject}</td>
                                    <td className="py-3 px-4">{statusBadge(n)}</td>
                                    <td className="py-3 px-4 text-xs text-gray-500">↑{n.upvotes} · ↓{n.downvotes} · ⬇{n.downloadCount}</td>
                                    <td className="py-3 px-4 text-sm text-gray-500">{fmtDt(n.createdAt)}</td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-1">
                                            {!n.isHidden && n.moderationStatus !== 'approved' && (
                                                <ActionBtn onClick={() => moderate(n._id, 'approve')} icon={CheckCircle} label="Approve" color="green" loading={acting[n._id + 'approve']} />
                                            )}
                                            {!n.isHidden && (
                                                <ActionBtn onClick={() => moderate(n._id, 'hide')} icon={EyeOff} label="Hide" color="red" loading={acting[n._id + 'hide']} />
                                            )}
                                            {n.isHidden && (
                                                <ActionBtn onClick={() => moderate(n._id, 'approve')} icon={Eye} label="Unhide" color="green" loading={acting[n._id + 'approve']} />
                                            )}
                                            {n.moderationStatus !== 'flagged' && (
                                                <ActionBtn onClick={() => moderate(n._id, 'flag')} icon={Flag} label="Flag" color="amber" loading={acting[n._id + 'flag']} />
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {!loading && notes.length === 0 && <p className="text-center text-gray-600 py-10">No notes found</p>}
                </div>
            </div>
            <Pagination page={page} pages={pages} onPage={setPage} />
        </div>
    )
}

// ── TAB: Books ────────────────────────────────────────────────────────────────
const BooksTab = () => {
    const [books, setBooks] = useState([])
    const [total, setTotal] = useState(0)
    const [pages, setPages] = useState(1)
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')
    const [status, setStatus] = useState('')
    const [loading, setLoading] = useState(false)
    const [acting, setActing] = useState({})

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({ page, limit: 15, search, status })
            const res = await api.get(`/admin/books?${params}`)
            setBooks(res.data.books); setTotal(res.data.total); setPages(res.data.pages)
        } catch { toast.error('Failed to load books') }
        finally { setLoading(false) }
    }, [page, search, status])

    useEffect(() => { setPage(1) }, [search, status])
    useEffect(() => { load() }, [load])

    const remove = (id) => {
        if (!window.confirm('Remove this book listing?')) return
        setActing(a => ({ ...a, [id]: true }))
        api.delete(`/admin/books/${id}`)
            .then(() => { toast.success('Book removed'); load() })
            .catch(() => toast.error('Failed'))
            .finally(() => setActing(a => ({ ...a, [id]: false })))
    }

    const conditionColor = c => ({ 'Like New': 'green', 'Good': 'blue', 'Fair': 'amber', 'Acceptable': 'red' }[c] || 'gray')

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
                <div className="flex-1 min-w-48"><SearchInput value={search} onChange={setSearch} placeholder="Search title, author…" /></div>
                <select value={status} onChange={e => setStatus(e.target.value)} className="input text-sm">
                    <option value="">All status</option>
                    <option value="available">Available</option>
                    <option value="sold">Sold</option>
                    <option value="reserved">Reserved</option>
                </select>
            </div>
            <div className="card p-0 overflow-hidden">
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                    <span className="text-sm text-gray-400">{fmt(total)} books</span>
                    {loading && <Loader2 className="w-4 h-4 text-primary-400 animate-spin" />}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-b border-white/5">
                            <tr><TableTh>Book</TableTh><TableTh>Seller</TableTh><TableTh>Condition</TableTh><TableTh>Price</TableTh><TableTh>Status</TableTh><TableTh>Listed</TableTh><TableTh>Actions</TableTh></tr>
                        </thead>
                        <tbody>
                            {books.map(b => (
                                <tr key={b._id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                                    <td className="py-3 px-4 max-w-[200px]">
                                        <div className="flex items-center gap-2">
                                            {b.images?.[0] && <img src={b.images[0]} className="w-8 h-8 rounded object-cover flex-shrink-0" alt="" />}
                                            <div>
                                                <div className="text-sm text-white truncate">{b.title}</div>
                                                <div className="text-xs text-gray-500">{b.author}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-sm text-gray-400">{b.seller?.name || '—'}</td>
                                    <td className="py-3 px-4"><Badge color={conditionColor(b.condition)}>{b.condition}</Badge></td>
                                    <td className="py-3 px-4 text-sm text-white">₹{b.price}</td>
                                    <td className="py-3 px-4"><Badge color={b.status === 'available' ? 'green' : b.status === 'sold' ? 'gray' : 'amber'}>{b.status}</Badge></td>
                                    <td className="py-3 px-4 text-sm text-gray-500">{fmtDt(b.createdAt)}</td>
                                    <td className="py-3 px-4">
                                        <ActionBtn onClick={() => remove(b._id)} icon={Trash2} label="Remove listing" color="red" loading={acting[b._id]} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {!loading && books.length === 0 && <p className="text-center text-gray-600 py-10">No books found</p>}
                </div>
            </div>
            <Pagination page={page} pages={pages} onPage={setPage} />
        </div>
    )
}

// ── TAB: Reports ──────────────────────────────────────────────────────────────
const ReportsTab = () => {
    const [reports, setReports] = useState([])
    const [total, setTotal] = useState(0)
    const [pages, setPages] = useState(1)
    const [page, setPage] = useState(1)
    const [status, setStatus] = useState('pending')
    const [loading, setLoading] = useState(false)
    const [acting, setActing] = useState({})

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({ page, limit: 15, status })
            const res = await api.get(`/admin/reports?${params}`)
            setReports(res.data.reports); setTotal(res.data.total); setPages(res.data.pages)
        } catch { toast.error('Failed to load reports') }
        finally { setLoading(false) }
    }, [page, status])

    useEffect(() => { setPage(1) }, [status])
    useEffect(() => { load() }, [load])

    const resolve = (id, action) => {
        setActing(a => ({ ...a, [id + action]: true }))
        api.patch(`/admin/reports/${id}/resolve`, { action })
            .then(() => { toast.success(`Report ${action}d`); load() })
            .catch(() => toast.error('Action failed'))
            .finally(() => setActing(a => ({ ...a, [id + action]: false })))
    }

    return (
        <div className="space-y-4">
            <div className="flex gap-3">
                <select value={status} onChange={e => setStatus(e.target.value)} className="input text-sm">
                    <option value="">All</option>
                    <option value="pending">Pending</option>
                    <option value="resolved">Resolved</option>
                    <option value="dismissed">Dismissed</option>
                </select>
            </div>
            <div className="card p-0 overflow-hidden">
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                    <span className="text-sm text-gray-400">{fmt(total)} reports</span>
                    {loading && <Loader2 className="w-4 h-4 text-primary-400 animate-spin" />}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-b border-white/5">
                            <tr><TableTh>Reported By</TableTh><TableTh>Type</TableTh><TableTh>Reason</TableTh><TableTh>Status</TableTh><TableTh>Filed</TableTh><TableTh>Actions</TableTh></tr>
                        </thead>
                        <tbody>
                            {reports.map(r => (
                                <tr key={r._id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                                    <td className="py-3 px-4 text-sm text-white">{r.reportedBy?.name || 'Unknown'}</td>
                                    <td className="py-3 px-4"><Badge color="violet">{r.targetType || r.reportType}</Badge></td>
                                    <td className="py-3 px-4 text-sm text-gray-400 max-w-[220px] truncate">{r.reason}</td>
                                    <td className="py-3 px-4">
                                        <Badge color={r.status === 'pending' ? 'amber' : r.status === 'resolved' ? 'green' : 'gray'}>
                                            {r.status}
                                        </Badge>
                                    </td>
                                    <td className="py-3 px-4 text-sm text-gray-500">{fmtDt(r.createdAt)}</td>
                                    <td className="py-3 px-4">
                                        {r.status === 'pending' && (
                                            <div className="flex items-center gap-1">
                                                <ActionBtn onClick={() => resolve(r._id, 'resolve')} icon={CheckCircle} label="Resolve" color="green" loading={acting[r._id + 'resolve']} />
                                                <ActionBtn onClick={() => resolve(r._id, 'dismiss')} icon={XCircle} label="Dismiss" color="amber" loading={acting[r._id + 'dismiss']} />
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {!loading && reports.length === 0 && <p className="text-center text-gray-600 py-10">No reports found</p>}
                </div>
            </div>
            <Pagination page={page} pages={pages} onPage={setPage} />
        </div>
    )
}

// ── Main Admin Dashboard Page ─────────────────────────────────────────────────
const TABS = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'notes', label: 'Notes', icon: FileText },
    { id: 'books', label: 'Books', icon: BookOpen },
    { id: 'reports', label: 'Reports', icon: Flag },
]

const AdminDashboard = () => {
    const { user } = useAuth()
    const [tab, setTab] = useState('overview')
    const [stats, setStats] = useState(null)
    const [loadingStats, setLoadingStats] = useState(false)

    // Guard: only admin
    if (!user || user.role !== 'admin') {
        return <Navigate to="/dashboard" replace />
    }

    const loadStats = async () => {
        setLoadingStats(true)
        try {
            const res = await api.get('/admin/stats')
            setStats(res.data.stats)
        } catch { toast.error('Could not load stats') }
        finally { setLoadingStats(false) }
    }

    useEffect(() => { loadStats() }, [])

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Crown className="w-5 h-5 text-amber-400" />
                        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
                    </div>
                    <p className="text-gray-500 text-sm">Full platform control · logged in as <span className="text-primary-400">{user.email}</span></p>
                </div>
                <button
                    onClick={loadStats}
                    disabled={loadingStats}
                    className="btn-secondary flex items-center gap-2 text-sm"
                >
                    <RefreshCw className={`w-4 h-4 ${loadingStats ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Warning banner if there are open reports */}
            {stats?.reports?.open > 0 && (
                <div
                    onClick={() => setTab('reports')}
                    className="cursor-pointer flex items-center gap-3 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/15 transition-colors"
                >
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium">{stats.reports.open} open report{stats.reports.open !== 1 ? 's' : ''} need your attention</span>
                    <span className="ml-auto text-xs opacity-60">Click to view →</span>
                </div>
            )}

            {/* Tab Bar */}
            <div className="flex overflow-x-auto gap-1 p-1 bg-dark-200/50 rounded-xl border border-white/5 w-fit max-w-full">
                {TABS.map(t => {
                    const Icon = t.icon
                    return (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${tab === t.id
                                    ? 'bg-primary-500/20 text-primary-400'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {t.label}
                        </button>
                    )
                })}
            </div>

            {/* Tab Content */}
            <div>
                {tab === 'overview' && <OverviewTab stats={stats} />}
                {tab === 'users' && <UsersTab />}
                {tab === 'notes' && <NotesTab />}
                {tab === 'books' && <BooksTab />}
                {tab === 'reports' && <ReportsTab />}
            </div>
        </div>
    )
}

export default AdminDashboard
