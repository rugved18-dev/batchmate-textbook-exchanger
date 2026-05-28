import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { BookOpen, FileText, MessageCircle } from 'lucide-react'

const Login = () => {
    const navigate = useNavigate()
    const { login } = useAuth()
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        // Parse token, refreshToken, or error from URL query params (redirect callback)
        const params = new URLSearchParams(window.location.search)
        const token = params.get('token')
        const refreshToken = params.get('refreshToken')
        const error = params.get('error')

        if (error) {
            toast.error(decodeURIComponent(error))
            window.history.replaceState({}, document.title, window.location.pathname)
        } else if (token && refreshToken) {
            setLoading(true)
            localStorage.setItem('accessToken', token)
            localStorage.setItem('refreshToken', refreshToken)

            const fetchUserAndLogin = async () => {
                try {
                    const response = await api.get('/auth/me', {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                    login(response.data.user, { accessToken: token, refreshToken })
                    toast.success('Logged in successfully!')
                    navigate('/dashboard')
                } catch (err) {
                    console.error('Failed to get user after Google redirect:', err)
                    toast.error('Authentication failed')
                    localStorage.removeItem('accessToken')
                    localStorage.removeItem('refreshToken')
                } finally {
                    setLoading(false)
                    window.history.replaceState({}, document.title, window.location.pathname)
                }
            }
            fetchUserAndLogin()
        }
    }, [navigate, login])

    const handleGoogleLogin = () => {
        setLoading(true)
        let backendUrl = import.meta.env.VITE_API_URL || ''
        
        // If relative (dev proxy), fallback to absolute backend URL on port 5000
        if (!backendUrl.startsWith('http')) {
            backendUrl = `${window.location.protocol}//${window.location.hostname}:5000/api`
        }

        window.location.href = `${backendUrl}/auth/google`
    }

    return (
        <div className="min-h-screen bg-dark-300 flex">
            {/* Left Side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-900 to-accent-900 p-12 flex-col justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-white mb-4">
                        Batchmate
                    </h1>
                    <p className="text-xl text-gray-200">
                        Your campus community for notes and textbooks
                    </p>
                </div>

                <div className="space-y-6">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-white font-semibold mb-1">
                                Share Notes
                            </h3>
                            <p className="text-gray-200 text-sm">
                                Upload handwritten notes and help your
                                batchmates
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-white font-semibold mb-1">
                                Exchange Books
                            </h3>
                            <p className="text-gray-200 text-sm">
                                Buy and sell textbooks within your campus
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                            <MessageCircle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-white font-semibold mb-1">
                                Connect Safely
                            </h3>
                            <p className="text-gray-200 text-sm">
                                Chat with verified students from your college
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Login */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-white mb-2">
                            Welcome Back
                        </h2>
                        <p className="text-gray-400">
                            Sign in with your college email to continue
                        </p>
                    </div>

                    <div className="card">
                        <div className="flex flex-col items-center">
                            <button
                                onClick={handleGoogleLogin}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-3 bg-dark-200 hover:bg-dark-100 text-white font-semibold py-3 px-4 rounded-xl border border-dark-100 hover:border-primary-500/50 shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed group"
                            >
                                <svg className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 24 24">
                                    <path
                                        fill="#4285F4"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="#34A853"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C4 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="#FBBC05"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                                    />
                                    <path
                                        fill="#EA4335"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 4 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                                    />
                                </svg>
                                <span>Sign in with Google</span>
                            </button>

                            {loading && (
                                <div className="mt-4 text-gray-400 text-sm">
                                    Redirecting to Google...
                                </div>
                            )}
                        </div>

                        <div className="mt-6 p-4 bg-primary-500/10 border border-primary-500/30 rounded-xl">
                            <p className="text-sm text-gray-300">
                                <strong className="text-white">Note:</strong>{' '}
                                Only college emails ending with .edu or .ac.in
                                are accepted.
                            </p>
                        </div>
                    </div>

                    <p className="text-center text-gray-500 text-sm mt-6">
                        By signing in, you agree to our Terms of Service and
                        Privacy Policy
                    </p>
                </div>
            </div>
        </div>
    )

}

export default Login
