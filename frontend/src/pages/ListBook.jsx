import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Upload, X, Plus, ArrowLeft, DollarSign } from 'lucide-react'
import api from '../utils/api'
import { SUBJECTS, SEMESTERS, BRANCHES } from '../utils/helpers'
import toast from 'react-hot-toast'
import LoadingSpinner from '../components/LoadingSpinner'

const ListBook = () => {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [images, setImages] = useState([])
    const [formData, setFormData] = useState({
        title: '',
        author: '',
        isbn: '',
        subject: '',
        semester: '',
        branch: '',
        condition: '',
        mrp: '',
        price: '',
        description: '',
        preferredMeetupLocation: ''
    })

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files)

        if (images.length + files.length > 5) {
            toast.error('Maximum 5 images allowed')
            return
        }

        // Validate file types
        const validFiles = files.filter(file => {
            if (!file.type.startsWith('image/')) {
                toast.error(`${file.name} is not an image`)
                return false
            }
            if (file.size > 5 * 1024 * 1024) {
                toast.error(`${file.name} is too large (max 5MB)`)
                return false
            }
            return true
        })

        setImages(prev => [...prev, ...validFiles])
    }

    const removeImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index))
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))

        // Auto-suggest price when MRP is entered
        if (name === 'mrp' && value) {
            const mrpValue = parseFloat(value)
            if (!isNaN(mrpValue)) {
                const suggestedPrice = Math.round(mrpValue * 0.5) // 50% of MRP
                setFormData(prev => ({
                    ...prev,
                    price: suggestedPrice.toString()
                }))
            }
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        // Validation
        if (images.length === 0) {
            toast.error('Please upload at least one image')
            return
        }

        if (!formData.title || !formData.condition || !formData.price) {
            toast.error('Please fill in all required fields')
            return
        }

        try {
            setLoading(true)

            // Create FormData
            const data = new FormData()
            images.forEach(image => {
                data.append('images', image)
            })

            Object.keys(formData).forEach(key => {
                if (formData[key]) {
                    data.append(key, formData[key])
                }
            })

            // Submit
            const response = await api.post('/books', data, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })

            toast.success('Book listed successfully! 🎉')
            navigate(`/books/${response.data.data._id}`)
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to list book')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Back Button */}
            <Link to="/books" className="inline-flex items-center gap-2 text-gray-400 hover:text-white">
                <ArrowLeft className="w-5 h-5" />
                Back to Books
            </Link>

            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">List a Book</h1>
                <p className="text-gray-400">Sell your textbooks to your batchmates</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="card space-y-6">
                {/* Images Upload */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Book Images <span className="text-red-400">*</span>
                        <span className="text-xs text-gray-500 ml-2">(Max 5 images, 5MB each)</span>
                    </label>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {images.map((image, index) => (
                            <div key={index} className="relative aspect-square bg-dark-200 rounded-lg overflow-hidden group">
                                <img
                                    src={URL.createObjectURL(image)}
                                    alt={`Preview ${index + 1}`}
                                    className="w-full h-full object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-4 h-4 text-white" />
                                </button>
                            </div>
                        ))}

                        {images.length < 5 && (
                            <label className="aspect-square border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-primary-500 transition-colors flex flex-col items-center justify-center bg-dark-200">
                                <Plus className="w-8 h-8 text-gray-500 mb-2" />
                                <span className="text-xs text-gray-500">Add Image</span>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageChange}
                                />
                            </label>
                        )}
                    </div>
                </div>

                {/* Title */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Book Title <span className="text-red-400">*</span>
                    </label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="e.g., Introduction to Algorithms"
                        className="input w-full"
                        required
                    />
                </div>

                {/* Author & ISBN */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Author
                        </label>
                        <input
                            type="text"
                            name="author"
                            value={formData.author}
                            onChange={handleChange}
                            placeholder="e.g., Thomas H. Cormen"
                            className="input w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            ISBN (Optional)
                        </label>
                        <input
                            type="text"
                            name="isbn"
                            value={formData.isbn}
                            onChange={handleChange}
                            placeholder="e.g., 978-0262033848"
                            className="input w-full"
                        />
                    </div>
                </div>

                {/* Subject, Semester, Branch */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Subject
                        </label>
                        <select
                            name="subject"
                            value={formData.subject}
                            onChange={handleChange}
                            className="input w-full"
                        >
                            <option value="">Select Subject</option>
                            {SUBJECTS.map(subject => (
                                <option key={subject} value={subject}>{subject}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Semester
                        </label>
                        <select
                            name="semester"
                            value={formData.semester}
                            onChange={handleChange}
                            className="input w-full"
                        >
                            <option value="">Select Semester</option>
                            {SEMESTERS.map(sem => (
                                <option key={sem} value={sem}>{sem}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Branch
                        </label>
                        <select
                            name="branch"
                            value={formData.branch}
                            onChange={handleChange}
                            className="input w-full"
                        >
                            <option value="">Select Branch</option>
                            {BRANCHES.map(branch => (
                                <option key={branch} value={branch}>{branch}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Condition */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Condition <span className="text-red-400">*</span>
                    </label>
                    <select
                        name="condition"
                        value={formData.condition}
                        onChange={handleChange}
                        className="input w-full"
                        required
                    >
                        <option value="">Select Condition</option>
                        <option value="Like New">Like New - Minimal wear, looks almost new</option>
                        <option value="Good">Good - Some wear, all pages intact</option>
                        <option value="Fair">Fair - Noticeable wear, some markings</option>
                        <option value="Acceptable">Acceptable - Heavy wear, readable</option>
                    </select>
                </div>

                {/* MRP & Price */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            MRP (₹)
                        </label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="number"
                                name="mrp"
                                value={formData.mrp}
                                onChange={handleChange}
                                placeholder="Original price"
                                className="input w-full pl-11"
                                min="0"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Selling Price (₹) <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                placeholder="Your price"
                                className="input w-full pl-11"
                                min="0"
                                required
                            />
                        </div>
                        {formData.mrp && formData.price && formData.mrp > formData.price && (
                            <p className="text-xs text-green-400 mt-1">
                                {Math.round(((formData.mrp - formData.price) / formData.mrp) * 100)}% off MRP
                            </p>
                        )}
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Description
                    </label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Add details about the book's condition, any highlights, missing pages, etc..."
                        className="input w-full min-h-[100px] resize-y"
                        rows={4}
                    />
                </div>

                {/* Meetup Location */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Preferred Meetup Location
                    </label>
                    <input
                        type="text"
                        name="preferredMeetupLocation"
                        value={formData.preferredMeetupLocation}
                        onChange={handleChange}
                        placeholder="e.g., College Library, Main Gate"
                        className="input w-full"
                    />
                </div>

                {/* Submit Button */}
                <div className="flex gap-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary flex-1 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <LoadingSpinner size="small" />
                                Listing...
                            </>
                        ) : (
                            <>
                                <Upload className="w-5 h-5" />
                                List Book
                            </>
                        )}
                    </button>
                    <Link to="/books" className="btn-secondary">
                        Cancel
                    </Link>
                </div>
            </form>
        </div>
    )
}

export default ListBook
