import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
    BookOpen,
    FileText,
    MessageCircle,
    User,
    LogOut,
    LayoutDashboard,
    Menu,
    X,
    Crown
} from 'lucide-react'
import { useState } from 'react'
import NotificationBell from './NotificationBell'

const Navbar = () => {
    const { user, logout, unreadCount } = useAuth()
    const location = useLocation()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const navLinks = [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/notes', label: 'Notes', icon: FileText },
        { path: '/books', label: 'Books', icon: BookOpen },
        { path: '/chat', label: 'Chat', icon: MessageCircle, badge: unreadCount },
    ]

    const isActive = (path) => location.pathname === path

    return (
        <nav className="glass border-b border-white/10 sticky top-0 z-50 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link to="/dashboard" className="flex items-center gap-2 group">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center transform group-hover:scale-110 transition-transform">
                            <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold gradient-text hidden sm:block">
                            Batchmate
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => {
                            const Icon = link.icon
                            return (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`
                    relative flex items-center gap-2 px-4 py-2 rounded-lg transition-all
                    ${isActive(link.path)
                                            ? 'bg-primary-500/20 text-primary-400'
                                            : 'text-gray-300 hover:bg-white/5 hover:text-white'
                                        }
                  `}
                                >
                                    <span className="relative">
                                        <Icon className="w-5 h-5" />
                                        {/* Unread badge */}
                                        {link.badge > 0 && (
                                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full px-1 leading-none animate-pulse">
                                                {link.badge > 99 ? '99+' : link.badge}
                                            </span>
                                        )}
                                    </span>
                                    <span className="font-medium">{link.label}</span>
                                </Link>
                            )
                        })}
                    </div>

                    {/* User Menu */}
                    <div className="hidden md:flex items-center gap-2">
                        {/* 🔔 Real-time notification bell */}
                        <NotificationBell />

                        {/* 👑 Admin link — only for admin role */}
                        {user?.role === 'admin' && (
                            <Link
                                to="/admin"
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${isActive('/admin')
                                        ? 'bg-amber-500/20 text-amber-400'
                                        : 'text-amber-500/80 hover:bg-amber-500/10 hover:text-amber-400'
                                    }`}
                            >
                                <Crown className="w-4 h-4" />
                                Admin
                            </Link>
                        )}
                        <Link
                            to="/profile"
                            className={`
                flex items-center gap-3 px-4 py-2 rounded-lg transition-all
                ${isActive('/profile')
                                    ? 'bg-primary-500/20 text-primary-400'
                                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                                }
              `}
                        >
                            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center overflow-hidden">
                                {user?.profilePicture ? (
                                    <img
                                        src={user.profilePicture}
                                        alt={user.name}
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                ) : (
                                    <User className="w-5 h-5 text-white" />
                                )}
                            </div>
                            <div className="hidden lg:block text-left">
                                <div className="text-sm font-medium">{user?.name}</div>
                                <div className="text-xs text-gray-400">{user?.reputationPoints || 0} pts</div>
                            </div>
                        </Link>

                        <button
                            onClick={logout}
                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                            title="Logout"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 text-gray-300 hover:bg-white/5 rounded-lg relative"
                    >
                        {mobileMenuOpen ? (
                            <X className="w-6 h-6" />
                        ) : (
                            <>
                                <Menu className="w-6 h-6" />
                                {/* Mobile unread dot */}
                                {unreadCount > 0 && (
                                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
                                )}
                            </>
                        )}
                    </button>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden py-4 border-t border-white/10 animate-slide-up">
                        <div className="flex flex-col gap-2">
                            {navLinks.map((link) => {
                                const Icon = link.icon
                                return (
                                    <Link
                                        key={link.path}
                                        to={link.path}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                      ${isActive(link.path)
                                                ? 'bg-primary-500/20 text-primary-400'
                                                : 'text-gray-300 hover:bg-white/5 hover:text-white'
                                            }
                    `}
                                    >
                                        <span className="relative">
                                            <Icon className="w-5 h-5" />
                                            {link.badge > 0 && (
                                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full px-1">
                                                    {link.badge > 99 ? '99+' : link.badge}
                                                </span>
                                            )}
                                        </span>
                                        <span className="font-medium">{link.label}</span>
                                        {link.badge > 0 && (
                                            <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                                {link.badge}
                                            </span>
                                        )}
                                    </Link>
                                )
                            })}

                            <Link
                                to="/profile"
                                onClick={() => setMobileMenuOpen(false)}
                                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                  ${isActive('/profile')
                                        ? 'bg-primary-500/20 text-primary-400'
                                        : 'text-gray-300 hover:bg-white/5 hover:text-white'
                                    }
                `}
                            >
                                <User className="w-5 h-5" />
                                <span className="font-medium">Profile</span>
                            </Link>

                            <button
                                onClick={() => {
                                    logout()
                                    setMobileMenuOpen(false)
                                }}
                                className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                            >
                                <LogOut className="w-5 h-5" />
                                <span className="font-medium">Logout</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    )
}

export default Navbar
