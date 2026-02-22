import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Check, CheckCheck, Trash2, BookOpen, FileText, MessageCircle, Star, ShoppingBag, Volume2 } from 'lucide-react'
import { socket } from '../utils/socket'
import api from '../utils/api'

// ── Icon map by notification type ────────────────────────────────────────────
const TYPE_META = {
    new_message: { icon: MessageCircle, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    book_request: { icon: BookOpen, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    note_upvote: { icon: Star, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    note_milestone: { icon: FileText, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    book_sold: { icon: ShoppingBag, color: 'text-green-400', bg: 'bg-green-500/10' },
    system: { icon: Volume2, color: 'text-gray-400', bg: 'bg-gray-500/10' },
}

const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
}

const NotificationBell = () => {
    const [open, setOpen] = useState(false)
    const [notifications, setNotifications] = useState([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [loading, setLoading] = useState(false)
    const panelRef = useRef(null)

    // ── Fetch from API ────────────────────────────────────────────────────────
    const fetchNotifications = useCallback(async () => {
        try {
            setLoading(true)
            const res = await api.get('/notifications?limit=30')
            setNotifications(res.data.data.notifications)
            setUnreadCount(res.data.data.unreadCount)
        } catch (err) {
            console.error('Failed to fetch notifications:', err)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchNotifications()
    }, [fetchNotifications])

    // ── Socket: incoming real-time notification ────────────────────────────────
    useEffect(() => {
        const handler = (notification) => {
            setNotifications(prev => [notification, ...prev].slice(0, 30))
            setUnreadCount(prev => prev + 1)
        }
        socket.on('new_notification', handler)
        return () => socket.off('new_notification', handler)
    }, [])

    // ── Close on outside click ────────────────────────────────────────────────
    useEffect(() => {
        const handleOutside = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                setOpen(false)
            }
        }
        if (open) document.addEventListener('mousedown', handleOutside)
        return () => document.removeEventListener('mousedown', handleOutside)
    }, [open])

    // ── Load notifications when panel opens ───────────────────────────────────
    const handleToggle = () => {
        setOpen(prev => {
            if (!prev) fetchNotifications()
            return !prev
        })
    }

    // ── Mark single as read ───────────────────────────────────────────────────
    const markRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`)
            setNotifications(prev =>
                prev.map(n => n._id === id ? { ...n, isRead: true } : n)
            )
            setUnreadCount(prev => Math.max(0, prev - 1))
        } catch { /* ignore */ }
    }

    // ── Mark all read ─────────────────────────────────────────────────────────
    const markAllRead = async () => {
        try {
            await api.put('/notifications/read-all')
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
            setUnreadCount(0)
        } catch { /* ignore */ }
    }

    // ── Delete single ─────────────────────────────────────────────────────────
    const deleteNotification = async (e, id) => {
        e.preventDefault()
        e.stopPropagation()
        try {
            await api.delete(`/notifications/${id}`)
            const wasUnread = notifications.find(n => n._id === id && !n.isRead)
            setNotifications(prev => prev.filter(n => n._id !== id))
            if (wasUnread) setUnreadCount(prev => Math.max(0, prev - 1))
        } catch { /* ignore */ }
    }

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="relative" ref={panelRef}>
            {/* Bell button */}
            <button
                onClick={handleToggle}
                className={`relative p-2 rounded-lg transition-all ${open
                        ? 'bg-primary-500/20 text-primary-400'
                        : 'text-gray-300 hover:bg-white/5 hover:text-white'
                    }`}
                aria-label="Notifications"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1 leading-none animate-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown panel */}
            {open && (
                <div className="absolute right-0 top-12 w-80 sm:w-96 glass border border-white/10 rounded-2xl shadow-2xl z-[100] overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                        <div className="flex items-center gap-2">
                            <Bell className="w-4 h-4 text-primary-400" />
                            <span className="font-semibold text-white text-sm">Notifications</span>
                            {unreadCount > 0 && (
                                <span className="bg-primary-500/20 text-primary-400 text-xs font-semibold px-2 py-0.5 rounded-full">
                                    {unreadCount} new
                                </span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 transition-colors"
                            >
                                <CheckCheck className="w-3.5 h-3.5" />
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div className="max-h-[420px] overflow-y-auto">
                        {loading ? (
                            <div className="py-12 flex items-center justify-center">
                                <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="py-12 text-center">
                                <Bell className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                                <p className="text-gray-400 text-sm">No notifications yet</p>
                                <p className="text-gray-600 text-xs mt-1">We'll let you know when things happen!</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {notifications.map(notification => {
                                    const meta = TYPE_META[notification.type] || TYPE_META.system
                                    const Icon = meta.icon
                                    const content = (
                                        <div
                                            key={notification._id}
                                            className={`flex gap-3 px-4 py-3 group transition-colors ${notification.isRead
                                                    ? 'hover:bg-white/3'
                                                    : 'bg-primary-500/5 hover:bg-primary-500/10'
                                                }`}
                                            onClick={() => !notification.isRead && markRead(notification._id)}
                                        >
                                            {/* Icon */}
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
                                                <Icon className={`w-4 h-4 ${meta.color}`} />
                                            </div>

                                            {/* Body */}
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-xs font-semibold mb-0.5 ${notification.isRead ? 'text-gray-300' : 'text-white'}`}>
                                                    {notification.title}
                                                </p>
                                                <p className={`text-xs leading-relaxed ${notification.isRead ? 'text-gray-500' : 'text-gray-400'}`}>
                                                    {notification.message}
                                                </p>
                                                <p className="text-[11px] text-gray-600 mt-1">
                                                    {timeAgo(notification.createdAt)}
                                                </p>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                                {!notification.isRead && (
                                                    <span className="w-2 h-2 bg-primary-500 rounded-full mt-1" />
                                                )}
                                                <button
                                                    onClick={(e) => deleteNotification(e, notification._id)}
                                                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-600 hover:text-red-400 transition-all"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    )

                                    // Wrap with a link if notification has a destination
                                    return notification.link ? (
                                        <Link
                                            key={notification._id}
                                            to={notification.link}
                                            onClick={() => { setOpen(false); !notification.isRead && markRead(notification._id) }}
                                        >
                                            {content}
                                        </Link>
                                    ) : (
                                        <div key={notification._id}>{content}</div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="border-t border-white/10 px-4 py-2.5 text-center">
                            <span className="text-xs text-gray-500">
                                Showing last {notifications.length} notifications · auto-deleted after 30 days
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default NotificationBell
