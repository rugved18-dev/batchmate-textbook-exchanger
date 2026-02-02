// Format helpers
export const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    })
}

export const formatRelativeTime = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000)

    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60
    }

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit)
        if (interval >= 1) {
            return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`
        }
    }

    return 'just now'
}

export const formatPrice = (price) => {
    return `₹${price.toLocaleString('en-IN')}`
}

export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

export const getInitials = (name) => {
    return name
        ?.split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || '??'
}

// Constants
export const DEPARTMENTS = [
    'Computer Science',
    'Electrical Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Electronics',
    'Information Technology',
    'Chemical Engineering',
    'Biotechnology',
    'Mathematics',
    'Physics',
    'Chemistry',
    'Business Administration',
    'Economics',
    'Other'
]

export const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8]

export const CONDITIONS = ['Like New', 'Good', 'Fair', 'Acceptable']

export const CONDITION_COLORS = {
    'Like New': 'badge-primary',
    'Good': 'badge-accent',
    'Fair': 'px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium border border-yellow-500/30',
    'Acceptable': 'px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs font-medium border border-orange-500/30'
}
