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
    X
} from 'lucide-react'
import { useState } from 'react'

const Navbar = () => {
    const { user, logout } = useAuth()
    const location = useLocation()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const navLinks = [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/notes', label: 'Notes', icon: FileText },
        { path: '/books', label: 'Books', icon: BookOpen },
        { path: '/chat', label: 'Chat', icon: MessageCircle },
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
                    flex items-center gap-2 px-4 py-2 rounded-lg transition-all
                    ${isActive(link.path)
                                            ? 'bg-primary-500/20 text-primary-400'
                                            : 'text-gray-300 hover:bg-white/5 hover:text-white'
                                        }
                  `}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="font-medium">{link.label}</span>
                                </Link>
                            )
                        })}
                    </div>

                    {/* User Menu */}
                    <div className="hidden md:flex items-center gap-4">
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
                            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
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
                        className="md:hidden p-2 text-gray-300 hover:bg-white/5 rounded-lg"
                    >
                        {mobileMenuOpen ? (
                            <X className="w-6 h-6" />
                        ) : (
                            <Menu className="w-6 h-6" />
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
                                        <Icon className="w-5 h-5" />
                                        <span className="font-medium">{link.label}</span>
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
