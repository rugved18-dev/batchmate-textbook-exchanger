import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Send, User, Search, MessageCircle, Wifi, WifiOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { socket } from '../utils/socket'
import api from '../utils/api'
import { formatDate } from '../utils/helpers'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import toast from 'react-hot-toast'

const Chat = () => {
    const { user, decrementUnreadCount } = useAuth()
    const [searchParams] = useSearchParams()

    const [chats, setChats] = useState([])
    const [selectedChat, setSelectedChat] = useState(null)
    const [messages, setMessages] = useState([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [isConnected, setIsConnected] = useState(socket.connected)

    // Typing indicators: Set of userIds currently typing in the active chat
    const [typingUsers, setTypingUsers] = useState(new Set())
    const typingTimeoutRef = useRef(null)
    const isTypingRef = useRef(false)

    const messagesEndRef = useRef(null)
    const currentChatRef = useRef(null)  // mirror of selectedChat for socket handlers

    // ── Scroll to bottom ─────────────────────────────────────────────────────

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [])

    useEffect(() => {
        scrollToBottom()
    }, [messages, typingUsers])

    // ── Initial data load ─────────────────────────────────────────────────────

    useEffect(() => {
        fetchChats()
    }, [])

    useEffect(() => {
        const chatId = searchParams.get('chatId')
        if (chatId && chats.length > 0) {
            const chat = chats.find(c => c._id === chatId)
            if (chat) handleSelectChat(chat)
        }
    }, [searchParams, chats])

    // ── Socket.io event listeners ─────────────────────────────────────────────

    useEffect(() => {
        const onConnect = () => setIsConnected(true)
        const onDisconnect = () => setIsConnected(false)

        // Incoming message from the other chat participant
        const onMessageReceived = (message) => {
            const activeChatId = currentChatRef.current?._id

            if (message.chat === activeChatId || message.chat?._id === activeChatId) {
                // We are in this chat — append message and mark read
                setMessages(prev => {
                    // Avoid duplicate if we somehow get echo
                    if (prev.some(m => m._id === message._id)) return prev
                    return [...prev, message]
                })
                markAsRead(activeChatId)
            } else {
                // We are NOT in this chat — bump unread badge
                setChats(prev => prev.map(chat =>
                    (chat._id === message.chat || chat._id === message.chat?._id)
                        ? { ...chat, unreadCount: (chat.unreadCount || 0) + 1, lastMessage: message }
                        : chat
                ))
            }

            // Always update lastMessage preview in the sidebar
            setChats(prev => prev.map(chat =>
                (chat._id === message.chat || chat._id === message.chat?._id)
                    ? { ...chat, lastMessage: message }
                    : chat
            ))

            // Clear typing indicator when message arrives
            if (message.sender?._id) {
                setTypingUsers(prev => {
                    const next = new Set(prev)
                    next.delete(message.sender._id)
                    return next
                })
            }
        }

        // Typing indicator received
        const onTyping = ({ userId }) => {
            if (userId === user?._id) return
            setTypingUsers(prev => new Set(prev).add(userId))
        }

        const onStopTyping = ({ userId }) => {
            setTypingUsers(prev => {
                const next = new Set(prev)
                next.delete(userId)
                return next
            })
        }

        socket.on('connect', onConnect)
        socket.on('disconnect', onDisconnect)
        socket.on('message_received', onMessageReceived)
        socket.on('typing', onTyping)
        socket.on('stop_typing', onStopTyping)

        return () => {
            socket.off('connect', onConnect)
            socket.off('disconnect', onDisconnect)
            socket.off('message_received', onMessageReceived)
            socket.off('typing', onTyping)
            socket.off('stop_typing', onStopTyping)
        }
    }, [user])

    // ── Data fetching ─────────────────────────────────────────────────────────

    const fetchChats = async () => {
        try {
            setLoading(true)
            const response = await api.get('/chat')
            setChats(response.data.data || [])
        } catch (error) {
            console.error('Failed to fetch chats:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchMessages = async (chatId) => {
        try {
            const response = await api.get(`/chat/${chatId}/messages`)
            setMessages(response.data.data || [])
        } catch (error) {
            console.error('Failed to fetch messages:', error)
        }
    }

    const markAsRead = async (chatId) => {
        try {
            await api.put(`/chat/${chatId}/read`)
            const prevUnread = chats.find(c => c._id === chatId)?.unreadCount || 0
            setChats(prev => prev.map(chat =>
                chat._id === chatId ? { ...chat, unreadCount: 0 } : chat
            ))
            if (prevUnread > 0) decrementUnreadCount(prevUnread)
        } catch (error) {
            // Silently ignore read-receipt failures
        }
    }

    // ── Chat selection ────────────────────────────────────────────────────────

    const handleSelectChat = (chat) => {
        // Leave previous chat room
        if (currentChatRef.current?._id) {
            socket.emit('leave_chat', currentChatRef.current._id)
        }

        setSelectedChat(chat)
        currentChatRef.current = chat
        setMessages([])
        setTypingUsers(new Set())

        fetchMessages(chat._id)
        markAsRead(chat._id)

        // Join the new chat room
        socket.emit('join_chat', chat._id)
    }

    // ── Typing logic ─────────────────────────────────────────────────────────

    const handleTyping = (e) => {
        setNewMessage(e.target.value)

        if (!selectedChat || !socket.connected) return

        if (!isTypingRef.current) {
            isTypingRef.current = true
            socket.emit('typing', {
                chatId: selectedChat._id,
                userId: user._id,
                userName: user.name
            })
        }

        // Reset stop-typing timer on every keystroke
        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = setTimeout(() => {
            isTypingRef.current = false
            socket.emit('stop_typing', {
                chatId: selectedChat._id,
                userId: user._id
            })
        }, 1500)
    }

    // ── Send message ──────────────────────────────────────────────────────────

    const handleSendMessage = async (e) => {
        e.preventDefault()
        if (!newMessage.trim() || !selectedChat) return

        // Stop typing indicator immediately
        clearTimeout(typingTimeoutRef.current)
        if (isTypingRef.current) {
            isTypingRef.current = false
            socket.emit('stop_typing', {
                chatId: selectedChat._id,
                userId: user._id
            })
        }

        const messageText = newMessage.trim()
        setNewMessage('')

        try {
            setSending(true)
            const response = await api.post(`/chat/${selectedChat._id}/messages`, {
                content: messageText
            })

            const savedMessage = response.data.data

            // Add to local messages immediately (optimistic)
            setMessages(prev => {
                if (prev.some(m => m._id === savedMessage._id)) return prev
                return [...prev, savedMessage]
            })

            // Update sidebar preview
            setChats(prev => prev.map(chat =>
                chat._id === selectedChat._id
                    ? { ...chat, lastMessage: savedMessage }
                    : chat
            ))

            // Emit to other participants via Socket.io
            const participantIds = selectedChat.participants
                ?.map(p => (typeof p === 'string' ? p : p._id))
                .filter(id => id !== user._id)

            socket.emit('new_message', {
                chatId: selectedChat._id,
                message: savedMessage,
                participants: selectedChat.participants?.map(p =>
                    typeof p === 'string' ? p : p._id
                )
            })
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send message')
            setNewMessage(messageText)  // restore on error
        } finally {
            setSending(false)
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    const getOtherUser = (chat) => {
        if (!chat?.participants) return null
        return chat.participants.find(p =>
            (typeof p === 'string' ? p : p._id) !== user._id
        )
    }

    // ── Render ────────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <LoadingSpinner size="large" text="Loading chats..." />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Messages</h1>
                    <p className="text-gray-400">Chat with buyers and sellers</p>
                </div>
                {/* Connection status pill */}
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${isConnected
                        ? 'border-green-500/30 bg-green-500/10 text-green-400'
                        : 'border-red-500/30 bg-red-500/10 text-red-400'
                    }`}>
                    {isConnected
                        ? <><Wifi className="w-3.5 h-3.5" /> Live</>
                        : <><WifiOff className="w-3.5 h-3.5" /> Offline</>
                    }
                </div>
            </div>

            {/* Chat Interface */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-250px)]">

                {/* Chat List Sidebar */}
                <div className="lg:col-span-1 card p-0 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-white/10">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search conversations..."
                                className="input pl-11 w-full"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {chats.length > 0 ? (
                            <div className="divide-y divide-white/10">
                                {chats.map(chat => {
                                    const otherUser = getOtherUser(chat)
                                    const isSelected = selectedChat?._id === chat._id
                                    return (
                                        <button
                                            key={chat._id}
                                            onClick={() => handleSelectChat(chat)}
                                            className={`w-full p-4 text-left hover:bg-white/5 transition-colors ${isSelected ? 'bg-primary-500/10 border-l-2 border-primary-500' : ''
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                {/* Avatar */}
                                                <div className="relative flex-shrink-0">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center overflow-hidden">
                                                        {otherUser?.profilePicture ? (
                                                            <img
                                                                src={otherUser.profilePicture}
                                                                alt={otherUser.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <User className="w-6 h-6 text-white" />
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-0.5">
                                                        <span className="text-white font-medium truncate">
                                                            {otherUser?.name || 'Unknown User'}
                                                        </span>
                                                        {chat.unreadCount > 0 && (
                                                            <span className="bg-primary-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full ml-2 flex-shrink-0">
                                                                {chat.unreadCount}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-400 truncate">
                                                        {chat.lastMessage?.content || 'No messages yet'}
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="p-8">
                                <EmptyState type="chat" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Messages Area */}
                <div className="lg:col-span-2 card p-0 overflow-hidden flex flex-col">
                    {selectedChat ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b border-white/10 flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                                    {getOtherUser(selectedChat)?.profilePicture ? (
                                        <img
                                            src={getOtherUser(selectedChat).profilePicture}
                                            alt={getOtherUser(selectedChat).name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <User className="w-5 h-5 text-white" />
                                    )}
                                </div>
                                <div>
                                    <div className="text-white font-semibold">
                                        {getOtherUser(selectedChat)?.name || 'Unknown User'}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        {typingUsers.size > 0 ? (
                                            <span className="text-primary-400 animate-pulse">typing...</span>
                                        ) : (
                                            getOtherUser(selectedChat)?.college || 'Student'
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {messages.map((message, index) => {
                                    const senderId = typeof message.sender === 'string'
                                        ? message.sender
                                        : message.sender?._id
                                    const isOwn = senderId === user._id

                                    return (
                                        <div
                                            key={message._id || index}
                                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`max-w-[70%]`}>
                                                <div className={`px-4 py-2.5 rounded-2xl leading-relaxed ${isOwn
                                                        ? 'bg-primary-500 text-white rounded-br-sm'
                                                        : 'bg-dark-200 text-white rounded-bl-sm'
                                                    }`}>
                                                    <p className="whitespace-pre-wrap break-words text-sm">
                                                        {message.content || message.text}
                                                    </p>
                                                </div>
                                                <div className={`text-xs text-gray-500 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                                                    {formatDate(message.createdAt)}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}

                                {/* Typing Indicator */}
                                {typingUsers.size > 0 && (
                                    <div className="flex justify-start">
                                        <div className="bg-dark-200 px-4 py-3 rounded-2xl rounded-bl-sm">
                                            <div className="flex items-center gap-1">
                                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>

                            {/* Message Input */}
                            <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10">
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={handleTyping}
                                        placeholder="Type a message..."
                                        className="input flex-1"
                                        disabled={sending}
                                        autoComplete="off"
                                    />
                                    <button
                                        type="submit"
                                        disabled={sending || !newMessage.trim()}
                                        className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Send className={`w-5 h-5 ${sending ? 'animate-pulse' : ''}`} />
                                        <span className="hidden sm:inline">Send</span>
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <MessageCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-white mb-2">
                                    Select a conversation
                                </h3>
                                <p className="text-gray-400">
                                    Choose a chat from the list to start messaging
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Chat
