import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { BookOpen, FileText, MessageCircle } from 'lucide-react'

const Login = () => {
    const navigate = useNavigate()
    const { login } = useAuth()
    const [loading, setLoading] = useState(false)


    const handleGoogleSuccess = async () => {
        try {
            setLoading(true)

            // Redirect to Render backend Google OAuth route
            window.location.href =
                'https://batchmate-backend.onrender.com/auth/google'
        } catch (error) {
            console.error('Login error:', error)
            toast.error('Google login failed')
            setLoading(false)
        }
    }

    const handleGoogleError = () => {
        toast.error('Google login failed')
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
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={handleGoogleError}
                                useOneTap
                                theme="filled_black"
                                size="large"
                                text="signin_with"
                                shape="rectangular"
                            />

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
