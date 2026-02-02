import { Link } from 'react-router-dom'
import { Home, Search, FileQuestion } from 'lucide-react'

const NotFound = () => {
    return (
        <div className="min-h-screen bg-dark-300 flex items-center justify-center px-4">
            <div className="text-center max-w-md">
                {/* Animated 404 */}
                <div className="mb-8 animate-float">
                    <div className="text-9xl font-bold gradient-text mb-4">404</div>
                    <div className="w-32 h-32 bg-dark-200 rounded-full flex items-center justify-center mx-auto">
                        <FileQuestion className="w-16 h-16 text-gray-600" />
                    </div>
                </div>

                {/* Message */}
                <h1 className="text-3xl font-bold text-white mb-4">
                    Page Not Found
                </h1>
                <p className="text-gray-400 mb-8">
                    Oops! The page you're looking for doesn't exist. It might have been moved or deleted.
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link to="/dashboard" className="btn-primary flex items-center justify-center gap-2">
                        <Home className="w-5 h-5" />
                        Go to Dashboard
                    </Link>
                    <Link to="/notes" className="btn-secondary flex items-center justify-center gap-2">
                        <Search className="w-5 h-5" />
                        Browse Notes
                    </Link>
                </div>

                {/* Helpful Links */}
                <div className="mt-12 pt-8 border-t border-white/10">
                    <p className="text-sm text-gray-500 mb-4">You might be looking for:</p>
                    <div className="flex flex-wrap gap-4 justify-center text-sm">
                        <Link to="/notes" className="text-primary-400 hover:text-primary-300">
                            Notes
                        </Link>
                        <Link to="/books" className="text-primary-400 hover:text-primary-300">
                            Books
                        </Link>
                        <Link to="/chat" className="text-primary-400 hover:text-primary-300">
                            Messages
                        </Link>
                        <Link to="/profile" className="text-primary-400 hover:text-primary-300">
                            Profile
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default NotFound
