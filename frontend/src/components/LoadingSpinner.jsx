const LoadingSpinner = ({ size = 'medium', text = '' }) => {
    const sizes = {
        small: 'w-4 h-4',
        medium: 'w-8 h-8',
        large: 'w-12 h-12'
    }

    return (
        <div className="flex flex-col items-center justify-center gap-3">
            <div className={`${sizes[size]} border-4 border-white/20 border-t-primary-500 rounded-full animate-spin`} />
            {text && <p className="text-gray-400 text-sm">{text}</p>}
        </div>
    )
}

export default LoadingSpinner
