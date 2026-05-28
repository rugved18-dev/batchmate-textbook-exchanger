const PageLoader = ({ message = 'Loading page…' }) => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-dark-300">
            <div className="rounded-3xl border border-white/10 bg-dark-400/80 p-8 text-center shadow-2xl shadow-black/20">
                <div className="h-10 w-10 mx-auto mb-4 rounded-full border-4 border-primary-500 border-t-transparent animate-spin" />
                <p className="text-white font-medium mb-2">{message}</p>
                <p className="text-gray-400 text-sm">Please wait while we load the page.</p>
            </div>
        </div>
    )
}

export default PageLoader
