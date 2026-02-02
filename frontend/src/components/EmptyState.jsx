import { FileQuestion, BookX, MessageSquareOff, SearchX } from 'lucide-react'
import { Link } from 'react-router-dom'

const EmptyState = ({ type, message, actionText, actionLink }) => {
    const getIcon = () => {
        switch (type) {
            case 'notes':
                return <FileQuestion className="w-20 h-20 text-gray-600" />
            case 'books':
                return <BookX className="w-20 h-20 text-gray-600" />
            case 'chat':
                return <MessageSquareOff className="w-20 h-20 text-gray-600" />
            case 'search':
                return <SearchX className="w-20 h-20 text-gray-600" />
            default:
                return <FileQuestion className="w-20 h-20 text-gray-600" />
        }
    }

    const getDefaultMessage = () => {
        switch (type) {
            case 'notes':
                return 'No notes found'
            case 'books':
                return 'No books available'
            case 'chat':
                return 'No messages yet'
            case 'search':
                return 'No results found'
            default:
                return 'Nothing to show'
        }
    }

    return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-32 h-32 bg-dark-200 rounded-full flex items-center justify-center mb-6 animate-float">
                {getIcon()}
            </div>

            <h3 className="text-xl font-semibold text-white mb-2">
                {message || getDefaultMessage()}
            </h3>

            <p className="text-gray-400 text-center mb-6 max-w-md">
                {type === 'notes' && 'Be the first to share your notes with your batchmates!'}
                {type === 'books' && 'Start by listing a book you want to sell.'}
                {type === 'chat' && 'Start a conversation to connect with other students.'}
                {type === 'search' && 'Try adjusting your filters or search terms.'}
            </p>

            {actionText && actionLink && (
                <Link to={actionLink} className="btn-primary">
                    {actionText}
                </Link>
            )}
        </div>
    )
}

export default EmptyState
