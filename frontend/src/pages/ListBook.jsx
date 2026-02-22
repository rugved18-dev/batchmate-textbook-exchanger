import { useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Upload, X, Plus, ArrowLeft, IndianRupee, TrendingDown, AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import api from '../utils/api'
import { SUBJECTS, SEMESTERS, BRANCHES } from '../utils/helpers'
import toast from 'react-hot-toast'
import LoadingSpinner from '../components/LoadingSpinner'

// ── Condition → price multipliers ───────────────────────────────────────────
const CONDITION_MULTIPLIERS = {
    'Like New': { mid: 0.65, label: 'Like New', color: 'text-green-400', desc: 'Minimal wear — you can price higher' },
    'Good': { mid: 0.55, label: 'Good', color: 'text-blue-400', desc: 'Light wear — solid mid-range price' },
    'Fair': { mid: 0.45, label: 'Fair', color: 'text-yellow-400', desc: 'Visible wear — price competitively' },
    'Acceptable': { mid: 0.35, label: 'Acceptable', color: 'text-orange-400', desc: 'Heavy wear — aggressive discount needed' },
};

// ── Price Band UI component ───────────────────────────────────────────────────
const PriceBand = ({ mrp, condition, currentPrice }) => {
    if (!mrp || !condition || !CONDITION_MULTIPLIERS[condition]) return null;
    const mrpNum = parseFloat(mrp);
    if (isNaN(mrpNum) || mrpNum <= 0) return null;

    const meta = CONDITION_MULTIPLIERS[condition];
    const recMid = Math.round(mrpNum * meta.mid);
    const recLow = Math.round(mrpNum * (meta.mid - 0.10));
    const recHigh = Math.round(mrpNum * (meta.mid + 0.10));
    const hardCeil = Math.round(mrpNum * 0.80);   // above this = hard to sell

    const priceNum = parseFloat(currentPrice);
    const hasPrice = !isNaN(priceNum) && priceNum > 0;
    const tooHigh = hasPrice && priceNum > hardCeil;
    const inBand = hasPrice && priceNum >= recLow && priceNum <= recHigh;
    const discount = hasPrice ? Math.round(((mrpNum - priceNum) / mrpNum) * 100) : null;

    // Slider range: recLow - 20% to hardCeil + 20%
    const sliderMin = Math.round(mrpNum * (meta.mid - 0.30));
    const sliderMax = Math.round(mrpNum * 0.90);
    const pctLow = ((recLow - sliderMin) / (sliderMax - sliderMin)) * 100;
    const pctHigh = ((recHigh - sliderMin) / (sliderMax - sliderMin)) * 100;
    const pctPrice = hasPrice ? Math.min(100, Math.max(0, ((priceNum - sliderMin) / (sliderMax - sliderMin)) * 100)) : null;

    return (
        <div className={`mt-3 p-4 rounded-xl border text-sm space-y-3 ${tooHigh
                ? 'bg-red-500/10 border-red-500/30'
                : inBand
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-dark-200 border-white/10'
            }`}>
            {/* Band label */}
            <div className="flex items-center justify-between">
                <span className="text-gray-400 text-xs">Recommended range</span>
                <span className="font-bold text-white">₹{recLow} – ₹{recHigh}</span>
            </div>

            {/* Visual gradient bar */}
            <div className="relative h-2 bg-white/5 rounded-full overflow-visible">
                {/* green band */}
                <div
                    className="absolute h-full bg-green-500/40 rounded-full"
                    style={{ left: `${pctLow}%`, width: `${pctHigh - pctLow}%` }}
                />
                {/* current price marker */}
                {pctPrice !== null && (
                    <div
                        className={`absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-white shadow-lg transition-all ${tooHigh ? 'bg-red-500' : inBand ? 'bg-green-400' : 'bg-amber-400'
                            }`}
                        style={{ left: `calc(${pctPrice}% - 7px)` }}
                    />
                )}
            </div>

            <div className="flex justify-between text-[10px] text-gray-600">
                <span>₹{sliderMin}</span>
                <span>₹{sliderMax}</span>
            </div>

            {/* Status messages */}
            {tooHigh && (
                <div className="flex items-start gap-2 text-red-400">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Hard to sell above ₹{hardCeil} (80% of MRP). Buyers rarely pay this for a {condition} book.</span>
                </div>
            )}
            {inBand && !tooHigh && (
                <div className="flex items-start gap-2 text-green-400">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Great price! {discount}% off MRP — this will attract buyers quickly.</span>
                </div>
            )}
            {!inBand && !tooHigh && hasPrice && (
                <div className="flex items-start gap-2 text-amber-400">
                    <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Suggested: ₹{recMid} for {condition} condition ({Math.round(meta.mid * 100)}% of MRP).</span>
                </div>
            )}
            {!hasPrice && (
                <p className="text-gray-600 text-xs">{meta.desc}</p>
            )}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────

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
        setFormData(prev => {
            const next = { ...prev, [name]: value }

            // Recalculate suggested price whenever MRP or condition changes
            const mrpNum = parseFloat(name === 'mrp' ? value : next.mrp)
            const cond = name === 'condition' ? value : next.condition
            const mult = CONDITION_MULTIPLIERS[cond]?.mid

            if (!isNaN(mrpNum) && mrpNum > 0 && mult) {
                // Only auto-fill price if user hasn't manually typed one yet
                // (or if they changed MRP/condition)
                if (name === 'mrp' || name === 'condition') {
                    next.price = Math.round(mrpNum * mult).toString()
                }
            }
            return next
        })
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
                            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="number"
                                name="mrp"
                                value={formData.mrp}
                                onChange={handleChange}
                                placeholder="Original price"
                                className="input w-full pl-10"
                                min="0"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Selling Price (₹) <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                placeholder="Your asking price"
                                className="input w-full pl-10"
                                min="0"
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Smart Price Band */}
                <PriceBand
                    mrp={formData.mrp}
                    condition={formData.condition}
                    currentPrice={formData.price}
                />

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
