import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { DEPARTMENTS, SEMESTERS } from '../utils/helpers'
import { BookOpen, AlertCircle } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'

const CompleteRegistration = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const { login } = useAuth()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        department: '',
        semester: '',
        campus: 'Default Campus'
    })

    // Get user data passed from Login page, or fallback to query parameters (backend callback redirect)
    const params = new URLSearchParams(location.search)
    const queryUserData = params.get('email') ? {
        name: params.get('name') || '',
        email: params.get('email') || '',
        picture: params.get('picture') || ''
    } : null

    const [userData] = useState(() => location.state?.userData || queryUserData)
    const [credential] = useState(() => location.state?.credential || params.get('credential') || '')

    // Clean up query parameters from location search bar for UX/security
    useEffect(() => {
        if (location.search) {
            window.history.replaceState({}, document.title, window.location.pathname)
        }
    }, [location])

    // Redirect if accessed directly without registration flow
    if (!userData) {
        return (
            <div className="min-h-screen bg-dark-300 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-white mb-2">Invalid Access</h1>
                    <p className="text-gray-400 mb-6">Please login first to complete registration</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="btn btn-primary"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        )
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        // Validation
        if (!formData.department) {
            toast.error('Please select a department')
            return
        }

        if (!formData.semester) {
            toast.error('Please select a semester')
            return
        }

        setLoading(true)
        try {
            const response = await api.post('/auth/complete-registration', {
                credential: credential,
                department: formData.department,
                semester: parseInt(formData.semester),
                campus: formData.campus
            })

            // Login the user with received tokens
            login(response.data.user, response.data.tokens)
            toast.success('Registration completed successfully!')
            navigate('/dashboard')
        } catch (error) {
            console.error('Registration error:', error)
            toast.error(error.response?.data?.message || 'Failed to complete registration')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-dark-300 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center">
                            <BookOpen className="w-8 h-8 text-primary-500" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Complete Your Profile</h1>
                    <p className="text-gray-400">
                        Welcome, <span className="text-primary-500 font-semibold">{userData?.name}</span>
                    </p>
                    <p className="text-gray-500 text-sm mt-1">{userData?.email}</p>
                </div>

                <div className="card">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Department Selection */}
                        <div>
                            <label htmlFor="department" className="block text-sm font-medium text-white mb-2">
                                Department <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="department"
                                name="department"
                                value={formData.department}
                                onChange={handleInputChange}
                                disabled={loading}
                                className="w-full px-4 py-2 bg-dark-200 border border-dark-100 text-white rounded-lg focus:border-primary-500 focus:outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <option value="">Select your department</option>
                                {DEPARTMENTS.map((dept, idx) => (
                                    <option key={idx} value={dept}>
                                        {dept}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Semester Selection */}
                        <div>
                            <label htmlFor="semester" className="block text-sm font-medium text-white mb-2">
                                Current Semester <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="semester"
                                name="semester"
                                value={formData.semester}
                                onChange={handleInputChange}
                                disabled={loading}
                                className="w-full px-4 py-2 bg-dark-200 border border-dark-100 text-white rounded-lg focus:border-primary-500 focus:outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <option value="">Select your semester</option>
                                {SEMESTERS.map((sem) => (
                                    <option key={sem} value={sem}>
                                        Semester {sem}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Campus Information */}
                        <div>
                            <label htmlFor="campus" className="block text-sm font-medium text-white mb-2">
                                Campus
                            </label>
                            <input
                                id="campus"
                                type="text"
                                name="campus"
                                value={formData.campus}
                                onChange={handleInputChange}
                                disabled={loading}
                                placeholder="Enter your campus name"
                                className="w-full px-4 py-2 bg-dark-200 border border-dark-100 text-white rounded-lg placeholder-gray-500 focus:border-primary-500 focus:outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <LoadingSpinner size="small" />
                                    Completing Registration...
                                </>
                            ) : (
                                'Complete Registration'
                            )}
                        </button>
                    </form>

                    {/* Help Text */}
                    <div className="mt-6 p-4 bg-primary-500/10 border border-primary-500/30 rounded-lg">
                        <p className="text-sm text-gray-300">
                            <strong className="text-white">ℹ️ Info:</strong> This information helps us connect you with the right batchmates and content for your academic journey.
                        </p>
                    </div>
                </div>

                {/* Back to Login */}
                <p className="text-center text-gray-500 text-sm mt-6">
                    Want to use a different account?{' '}
                    <button
                        onClick={() => navigate('/login')}
                        className="text-primary-500 hover:text-primary-400 font-semibold transition"
                    >
                        Sign in again
                    </button>
                </p>
            </div>
        </div>
    )
}

export default CompleteRegistration
