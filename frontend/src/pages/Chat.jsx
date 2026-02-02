import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Send, User, Search, MessageCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import { formatDate } from '../utils/helpers'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import toast from 'react-hot-toast'

const Chat = () => {
    const { user } = useAuth()
    const [searchParams] = useSearchParams()
    const [chats, setChats] = useState([])
    const [selectedChat, setSelectedChat] = useState(null)
    const [messages, setMessages] = useState([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const messagesEndRef = useRef(null)

    useEffect(() => {
        fetchChats()
    }, [])

    useEffect(() => {
        const chatId = searchParams.get('chatId')
        if (chatId && chats.length > 0) {
            const chat = chats.find(c => c._id === chatId)
            if (chat) {
                handleSelectChat(chat)
            }
        }
    }, [searchParams, chats])

    useEffect(() => {
        if (selectedChat) {
            fetchMessages(selectedChat._id)
            // Mark as read
            markAsRead(selectedChat._id)
        }
    }, [selectedChat])

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

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
            // Update chat list
            setChats(prev => prev.map(chat =>
                chat._id === chatId ? { ...chat, unreadCount: 0 } : chat
            ))
        } catch (error) {
            console.error('Failed to mark as read:', error)
        }
    }

    const handleSelectChat = (chat) => {
        setSelectedChat(chat)
        setMessages([])
    }

    const handleSendMessage = async (e) => {
        e.preventDefault()

        if (!newMessage.trim() || !selectedChat) return

        try {
            setSending(true)
            const response = await api.post(`/chat/${selectedChat._id}/messages`, {
                content: newMessage.trim()
            })

            setMessages(prev => [...prev, response.data.data])
            setNewMessage('')

            // Update last message in chat list
            setChats(prev => prev.map(chat =>
                chat._id === selectedChat._id
                    ? { ...chat, lastMessage: response.data.data }
                    : chat
            ))
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send message')
        } finally {
            setSending(false)
        }
    }

    const getOtherUser = (chat) => {
        if (!chat || !chat.participants) return null
        return chat.participants.find(p => p._id !== user._id)
    }

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
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Messages</h1>
                <p className="text-gray-400">Chat with buyers and sellers</p>
            </div>

            {/* Chat Interface */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
                {/* Chat List */}
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
                                    return (
                                        <button
                                            key={chat._id}
                                            onClick={() => handleSelectChat(chat)}
                                            className={`w-full p-4 text-left hover:bg-white/5 transition-colors ${selectedChat?._id === chat._id ? 'bg-primary-500/10' : ''
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center flex-shrink-0">
                                                    {otherUser?.profilePicture ? (
                                                        <img
                                                            src={otherUser.profilePicture}
                                                            alt={otherUser.name}
                                                            className="w-full h-full rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <User className="w-6 h-6 text-white" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <div className="text-white font-medium truncate">
                                                            {otherUser?.name || 'Unknown User'}
                                                        </div>
                                                        {chat.unreadCount > 0 && (
                                                            <span className="bg-primary-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                                                                {chat.unreadCount}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-gray-400 truncate">
                                                        {chat.lastMessage?.content || 'No messages yet'}
                                                    </div>
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
                                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
                                    {getOtherUser(selectedChat)?.profilePicture ? (
                                        <img
                                            src={getOtherUser(selectedChat).profilePicture}
                                            alt={getOtherUser(selectedChat).name}
                                            className="w-full h-full rounded-full object-cover"
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
                                        {getOtherUser(selectedChat)?.college || 'College'}
                                    </div>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {messages.map((message, index) => {
                                    const isOwn = message.sender._id === user._id
                                    return (
                                        <div
                                            key={message._id || index}
                                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                                                <div
                                                    className={`px-4 py-2 rounded-2xl ${isOwn
                                                            ? 'bg-primary-500 text-white rounded-br-sm'
                                                            : 'bg-dark-200 text-white rounded-bl-sm'
                                                        }`}
                                                >
                                                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                                                </div>
                                                <div className={`text-xs text-gray-500 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                                                    {formatDate(message.createdAt)}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Message Input */}
                            <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10">
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        className="input flex-1"
                                        disabled={sending}
                                    />
                                    <button
                                        type="submit"
                                        disabled={sending || !newMessage.trim()}
                                        className="btn-primary flex items-center gap-2"
                                    >
                                        <Send className="w-5 h-5" />
                                        Send
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
