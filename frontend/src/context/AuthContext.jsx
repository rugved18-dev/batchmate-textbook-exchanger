import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../utils/api'
import { connectSocket, disconnectSocket, socket } from '../utils/socket'
import toast from 'react-hot-toast'

const AuthContext = createContext()

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider')
    }
    return context
}

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    // Global unread message count — updated via Socket.io so Navbar stays in sync
    const [unreadCount, setUnreadCount] = useState(0)

    useEffect(() => {
        checkAuth()
    }, [])

    // When user is set, connect the socket and fetch initial unread count
    useEffect(() => {
        if (user) {
            connectSocket(user)
            fetchUnreadCount()
        }
        return () => {
            // Clean up socket listeners when user changes/unmounts
        }
    }, [user])

    // Listen for incoming message events to bump unread badge from anywhere in the app
    useEffect(() => {
        const handleUnreadUpdate = () => {
            setUnreadCount(prev => prev + 1)
        }

        socket.on('unread_count_update', handleUnreadUpdate)

        return () => {
            socket.off('unread_count_update', handleUnreadUpdate)
        }
    }, [])

    const fetchUnreadCount = async () => {
        try {
            const res = await api.get('/chat/unread-count')
            setUnreadCount(res.data.data?.unreadCount ?? res.data.unreadCount ?? 0)
        } catch {
            // Silently ignore — not critical
        }
    }

    const checkAuth = async () => {
        const token = localStorage.getItem('accessToken')
        if (token) {
            try {
                const response = await api.get('/auth/me')
                setUser(response.data.user)
            } catch (error) {
                localStorage.removeItem('accessToken')
                localStorage.removeItem('refreshToken')
            }
        }
        setLoading(false)
    }

    const login = (userData, tokens) => {
        setUser(userData)
        localStorage.setItem('accessToken', tokens.accessToken)
        localStorage.setItem('refreshToken', tokens.refreshToken)
    }

    const logout = async () => {
        try {
            await api.post('/auth/logout')
        } catch (error) {
            console.error('Logout error:', error)
        }
        disconnectSocket()
        setUser(null)
        setUnreadCount(0)
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        toast.success('Logged out successfully')
    }

    // Allow chat page to reset unread count when all chats are viewed
    const resetUnreadCount = useCallback(() => setUnreadCount(0), [])
    const decrementUnreadCount = useCallback((amount = 1) => {
        setUnreadCount(prev => Math.max(0, prev - amount))
    }, [])

    const value = {
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
        unreadCount,
        resetUnreadCount,
        decrementUnreadCount
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
