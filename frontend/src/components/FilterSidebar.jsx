import { Filter, X } from 'lucide-react'
import { SUBJECTS, SEMESTERS, BRANCHES } from '../utils/helpers'

const FilterSidebar = ({ filters, onFilterChange, onClearFilters, type = 'notes' }) => {
    const handleChange = (key, value) => {
        onFilterChange({ ...filters, [key]: value })
    }

    const hasActiveFilters = Object.values(filters).some(val => val !== '' && val !== 'all')

    return (
        <div className="card space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-primary-400" />
                    <h3 className="text-lg font-semibold text-white">Filters</h3>
                </div>
                {hasActiveFilters && (
                    <button
                        onClick={onClearFilters}
                        className="text-sm text-gray-400 hover:text-white flex items-center gap-1"
                    >
                        <X className="w-4 h-4" />
                        Clear
                    </button>
                )}
            </div>

            {/* Subject Filter */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    Subject
                </label>
                <select
                    value={filters.subject || ''}
                    onChange={(e) => handleChange('subject', e.target.value)}
                    className="input w-full"
                >
                    <option value="">All Subjects</option>
                    {SUBJECTS.map(subject => (
                        <option key={subject} value={subject}>{subject}</option>
                    ))}
                </select>
            </div>

            {/* Semester Filter */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    Semester
                </label>
                <select
                    value={filters.semester || ''}
                    onChange={(e) => handleChange('semester', e.target.value)}
                    className="input w-full"
                >
                    <option value="">All Semesters</option>
                    {SEMESTERS.map(sem => (
                        <option key={sem} value={sem}>{sem}</option>
                    ))}
                </select>
            </div>

            {/* Branch Filter */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    Branch
                </label>
                <select
                    value={filters.branch || ''}
                    onChange={(e) => handleChange('branch', e.target.value)}
                    className="input w-full"
                >
                    <option value="">All Branches</option>
                    {BRANCHES.map(branch => (
                        <option key={branch} value={branch}>{branch}</option>
                    ))}
                </select>
            </div>

            {/* Book-specific filters */}
            {type === 'books' && (
                <>
                    {/* Condition Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Condition
                        </label>
                        <select
                            value={filters.condition || ''}
                            onChange={(e) => handleChange('condition', e.target.value)}
                            className="input w-full"
                        >
                            <option value="">All Conditions</option>
                            <option value="Like New">Like New</option>
                            <option value="Good">Good</option>
                            <option value="Fair">Fair</option>
                            <option value="Acceptable">Acceptable</option>
                        </select>
                    </div>

                    {/* Price Range */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Max Price (₹)
                        </label>
                        <input
                            type="number"
                            value={filters.maxPrice || ''}
                            onChange={(e) => handleChange('maxPrice', e.target.value)}
                            placeholder="Enter max price"
                            className="input w-full"
                            min="0"
                        />
                    </div>
                </>
            )}

            {/* Sort Options */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    Sort By
                </label>
                <select
                    value={filters.sortBy || 'recent'}
                    onChange={(e) => handleChange('sortBy', e.target.value)}
                    className="input w-full"
                >
                    <option value="recent">Most Recent</option>
                    {type === 'notes' && (
                        <>
                            <option value="popular">Most Popular</option>
                            <option value="downloads">Most Downloads</option>
                        </>
                    )}
                    {type === 'books' && (
                        <>
                            <option value="price-low">Price: Low to High</option>
                            <option value="price-high">Price: High to Low</option>
                        </>
                    )}
                </select>
            </div>
        </div>
    )
}

export default FilterSidebar
