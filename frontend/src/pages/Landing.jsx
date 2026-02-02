import { Link } from 'react-router-dom'
import { BookOpen, FileText, MessageCircle, TrendingUp, ArrowRight } from 'lucide-react'

const Landing = () => {
    return (
        <div className="min-h-screen bg-dark-300">
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                    <div className="text-center">
                        <h1 className="text-6xl font-bold mb-6">
                            <span className="gradient-text">Batchmate</span>
                        </h1>
                        <p className="text-2xl text-gray-300 mb-4">
                            Campus Textbook & Notes Exchange
                        </p>
                        <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
                            Share handwritten notes, exchange textbooks, and connect with your batchmates.
                            Built by students, for students.
                        </p>

                        <div className="flex gap-4 justify-center">
                            <Link to="/login" className="btn-primary flex items-center gap-2">
                                Get Started
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                            <a href="#features" className="btn-secondary">
                                Learn More
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features */}
            <div id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <h2 className="text-3xl font-bold text-center mb-12 text-white">
                    Everything You Need
                </h2>

                <div className="grid md:grid-cols-3 gap-8">
                    <div className="card text-center">
                        <div className="w-16 h-16 bg-primary-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-8 h-8 text-primary-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">Share Notes</h3>
                        <p className="text-gray-400">
                            Upload and download handwritten notes from your batchmates. Earn reputation points.
                        </p>
                    </div>

                    <div className="card text-center">
                        <div className="w-16 h-16 bg-accent-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <BookOpen className="w-8 h-8 text-accent-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">Exchange Books</h3>
                        <p className="text-gray-400">
                            Buy and sell textbooks within your campus. Safe, verified transactions.
                        </p>
                    </div>

                    <div className="card text-center">
                        <div className="w-16 h-16 bg-primary-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <MessageCircle className="w-8 h-8 text-primary-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">Connect Safely</h3>
                        <p className="text-gray-400">
                            Chat with verified students from your college. Same-campus only.
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="glass border-y border-white/10 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-3 gap-8 text-center">
                        <div>
                            <div className="text-4xl font-bold gradient-text mb-2">1000+</div>
                            <div className="text-gray-400">Notes Shared</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold gradient-text mb-2">500+</div>
                            <div className="text-gray-400">Books Exchanged</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold gradient-text mb-2">50+</div>
                            <div className="text-gray-400">Colleges</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CTA */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
                <h2 className="text-3xl font-bold text-white mb-4">
                    Ready to join your campus community?
                </h2>
                <p className="text-gray-400 mb-8">
                    Sign in with your college email to get started
                </p>
                <Link to="/login" className="btn-primary inline-flex items-center gap-2">
                    Sign In with Google
                    <ArrowRight className="w-5 h-5" />
                </Link>
            </div>
        </div>
    )
}

export default Landing
