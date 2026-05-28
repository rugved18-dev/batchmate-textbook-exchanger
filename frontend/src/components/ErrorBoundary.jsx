import { Component } from 'react'

class ErrorBoundary extends Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error }
    }

    componentDidCatch(error, info) {
        console.error('ErrorBoundary caught an error:', error, info)
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center p-6 bg-dark-300">
                    <div className="max-w-xl text-center rounded-3xl border border-white/10 bg-dark-400/80 p-10 shadow-2xl shadow-black/20">
                        <h1 className="text-3xl font-semibold text-white mb-4">Something went wrong</h1>
                        <p className="text-gray-400 mb-6">
                            The application encountered an unexpected error. Please refresh the page or try again later.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="btn-primary px-6 py-3"
                        >
                            Reload
                        </button>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary
