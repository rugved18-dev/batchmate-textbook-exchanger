import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Plus, Filter as FilterIcon } from 'lucide-react'
import api from '../utils/api'
import NoteCard from '../components/NoteCard'
import FilterSidebar from '../components/FilterSidebar'
import EmptyState from '../components/EmptyState'
import LoadingSpinner from '../components/LoadingSpinner'

const Notes = () => {
    const [notes, setNotes] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [filters, setFilters] = useState({
        subject: '',
        semester: '',
        branch: '',
        sortBy: 'recent'
    })
    const [showFilters, setShowFilters] = useState(false)

    useEffect(() => {
        fetchNotes()
    }, [filters])

    const fetchNotes = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams()

            if (filters.subject) params.append('subject', filters.subject)
            if (filters.semester) params.append('semester', filters.semester)
            if (filters.branch) params.append('branch', filters.branch)
            if (filters.sortBy) params.append('sortBy', filters.sortBy)
            if (searchQuery) params.append('search', searchQuery)

            const response = await api.get(`/notes?${params.toString()}`)
            setNotes(response.data.data || [])
        } catch (error) {
            console.error('Failed to fetch notes:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = (e) => {
        e.preventDefault()
        fetchNotes()
    }

    const handleClearFilters = () => {
        setFilters({
            subject: '',
            semester: '',
            branch: '',
            sortBy: 'recent'
        })
        setSearchQuery('')
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Notes</h1>
                    <p className="text-gray-400">Browse and download handwritten notes from your batchmates</p>
                </div>
                <Link to="/upload-note" className="btn-primary flex items-center gap-2 w-fit">
                    <Plus className="w-5 h-5" />
                    Upload Note
                </Link>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="card">
                <div className="flex gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search notes by title, subject, or description..."
                            className="input pl-11 w-full"
                        />
                    </div>
                    <button type="submit" className="btn-primary">
                        Search
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowFilters(!showFilters)}
                        className="btn-secondary md:hidden flex items-center gap-2"
                    >
                        <FilterIcon className="w-5 h-5" />
                    </button>
                </div>
            </form>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Filters Sidebar */}
                <div className={`lg:block ${showFilters ? 'block' : 'hidden'}`}>
                    <FilterSidebar
                        filters={filters}
                        onFilterChange={setFilters}
                        onClearFilters={handleClearFilters}
                        type="notes"
                    />
                </div>

                {/* Notes Grid */}
                <div className="lg:col-span-3">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <LoadingSpinner size="large" text="Loading notes..." />
                        </div>
                    ) : notes.length > 0 ? (
                        <>
                            <div className="mb-4 text-sm text-gray-400">
                                Found {notes.length} note{notes.length !== 1 ? 's' : ''}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {notes.map(note => (
                                    <NoteCard key={note._id} note={note} />
                                ))}
                            </div>
                        </>
                    ) : (
                        <EmptyState
                            type="notes"
                            message={searchQuery ? "No notes match your search" : "No notes available"}
                            actionText="Upload First Note"
                            actionLink="/upload-note"
                        />
                    )}
                </div>
            </div>
        </div>
    )
}

export default Notes
