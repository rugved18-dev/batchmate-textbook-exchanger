import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Search, Plus, Filter as FilterIcon, X, Sparkles, Zap, Users } from 'lucide-react'
import Fuse from 'fuse.js'
import api from '../utils/api'
import NoteCard from '../components/NoteCard'
import FilterSidebar from '../components/FilterSidebar'
import EmptyState from '../components/EmptyState'
import LoadingSpinner from '../components/LoadingSpinner'

// ── Fuse.js config — fuzzy client-side re-ranking ────────────────────────────
// Keys and their weights mirror the MongoDB text index weights
const FUSE_OPTIONS = {
    includeScore: true,
    threshold: 0.45,        // 0 = perfect match, 1 = match anything
    ignoreLocation: true,   // don't penalise matches far from string start
    useExtendedSearch: true,
    keys: [
        { name: 'title', weight: 10 },
        { name: 'subject', weight: 8 },
        { name: 'subjectCode', weight: 6 },
        { name: 'description', weight: 3 },
        { name: 'uploadedBy.name', weight: 5 },
        { name: 'department', weight: 2 },
    ]
}

// ── Simple debounce hook ──────────────────────────────────────────────────────
function useDebounce(value, delay = 400) {
    const [debounced, setDebounced] = useState(value)
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay)
        return () => clearTimeout(t)
    }, [value, delay])
    return debounced
}

// ── Search badge ──────────────────────────────────────────────────────────────
const SearchBadge = ({ meta, fuseActive }) => {
    if (!meta) return null
    return (
        <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-gray-500">Results for</span>
            <span className="px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-300 font-mono">
                "{meta.query}"
            </span>
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${fuseActive
                    ? 'bg-violet-500/20 text-violet-300'
                    : meta.mode === 'text'
                        ? 'bg-green-500/20 text-green-300'
                        : 'bg-amber-500/20 text-amber-300'
                }`}>
                {fuseActive
                    ? <><Sparkles className="w-3 h-3" /> Fuzzy re-ranked</>
                    : meta.mode === 'text'
                        ? <><Zap className="w-3 h-3" /> Full-text search</>
                        : <><Search className="w-3 h-3" /> Keyword search</>
                }
            </span>
            {meta.uploaderMatchCount > 0 && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">
                    <Users className="w-3 h-3" /> Includes uploader matches
                </span>
            )}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────

const Notes = () => {
    const [rawNotes, setRawNotes] = useState([])  // notes from backend
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchMeta, setSearchMeta] = useState(null)
    const [filters, setFilters] = useState({
        subject: '', semester: '', branch: '', sortBy: 'recent'
    })
    const [showFilters, setShowFilters] = useState(false)

    const debouncedSearch = useDebounce(searchQuery, 400)
    const inputRef = useRef(null)

    // Fetch from backend whenever debounced search or filters change
    useEffect(() => {
        fetchNotes(debouncedSearch)
    }, [debouncedSearch, filters])

    const fetchNotes = async (q = '') => {
        try {
            setLoading(true)
            const params = new URLSearchParams()
            if (filters.subject) params.append('subject', filters.subject)
            if (filters.semester) params.append('semester', filters.semester)
            if (filters.branch) params.append('branch', filters.branch)
            if (filters.sortBy) params.append('sortBy', filters.sortBy)
            if (q.trim()) params.append('search', q.trim())

            const res = await api.get(`/notes?${params.toString()}`)
            setRawNotes(res.data.notes || res.data.data || [])
            setSearchMeta(res.data.searchMeta || null)
        } catch (err) {
            console.error('Failed to fetch notes:', err)
        } finally {
            setLoading(false)
        }
    }

    // ── Fuse.js client-side fuzzy re-ranking ─────────────────────────────────
    // Applied only when there's an active search query.
    // This catches typos the backend may have missed (e.g. "Datastructure").
    const { notes, fuseActive } = useMemo(() => {
        if (!debouncedSearch.trim() || rawNotes.length === 0) {
            return { notes: rawNotes, fuseActive: false }
        }

        const fuse = new Fuse(rawNotes, FUSE_OPTIONS)
        const fuseResults = fuse.search(debouncedSearch.trim())

        // If Fuse found a very good match that the backend missed, use Fuse order.
        // Otherwise keep backend order (which already has textScore).
        if (fuseResults.length > 0 && fuseResults[0].score < 0.25) {
            return {
                notes: fuseResults.map(r => r.item),
                fuseActive: true
            }
        }

        // Fuse results at low confidence — use backend order but filter to Fuse set
        const fuseIds = new Set(fuseResults.map(r => r.item._id?.toString()))
        const filtered = rawNotes.filter(n => fuseIds.has(n._id?.toString()))
        return {
            notes: filtered.length > 0 ? filtered : rawNotes,
            fuseActive: false
        }
    }, [rawNotes, debouncedSearch])

    const handleClearSearch = () => {
        setSearchQuery('')
        inputRef.current?.focus()
    }

    const handleClearFilters = () => {
        setFilters({ subject: '', semester: '', branch: '', sortBy: 'recent' })
        setSearchQuery('')
    }

    return (
        <div className="space-y-6">
            {/* ── Header ────────────────────────────────────────────────────── */}
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

            {/* ── Smart Search Bar ──────────────────────────────────────────── */}
            <div className="card space-y-3">
                <div className="flex gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search title, subject, description, uploader name…"
                            className="input pl-11 pr-10 w-full"
                            autoComplete="off"
                        />
                        {searchQuery && (
                            <button
                                onClick={handleClearSearch}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowFilters(!showFilters)}
                        className="btn-secondary md:hidden flex items-center gap-2"
                    >
                        <FilterIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Hint text */}
                <p className="text-[11px] text-gray-600">
                    ✨ Supports typo tolerance • searches uploader names • finds partial matches
                </p>
            </div>

            {/* ── Content Grid ──────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Filter Sidebar */}
                <div className={`lg:block ${showFilters ? 'block' : 'hidden'}`}>
                    <FilterSidebar
                        filters={filters}
                        onFilterChange={setFilters}
                        onClearFilters={handleClearFilters}
                        type="notes"
                    />
                </div>

                {/* Notes Grid */}
                <div className="lg:col-span-3 space-y-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <LoadingSpinner size="large" text="Searching notes…" />
                        </div>
                    ) : notes.length > 0 ? (
                        <>
                            {/* Result meta bar */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                                <span className="text-sm text-gray-400">
                                    {notes.length} note{notes.length !== 1 ? 's' : ''} found
                                </span>
                                <SearchBadge meta={searchMeta} fuseActive={fuseActive} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {notes.map(note => (
                                    <NoteCard key={note._id} note={note} />
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="space-y-4">
                            {searchMeta && (
                                <div className="card border border-amber-500/20 bg-amber-500/5 text-sm text-amber-300 flex items-start gap-3">
                                    <Search className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-medium mb-1">No results for "{searchMeta.query}"</p>
                                        <p className="text-amber-400/70 text-xs">
                                            Try a different spelling, shorter keyword, or clear the filters below.
                                        </p>
                                    </div>
                                </div>
                            )}
                            <EmptyState
                                type="notes"
                                message={debouncedSearch ? 'No notes match your search' : 'No notes available'}
                                actionText="Upload First Note"
                                actionLink="/upload-note"
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Notes
