import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, FileText, CheckCircle, X, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import { SUBJECTS, SEMESTERS, BRANCHES } from '../utils/helpers'
import toast from 'react-hot-toast'
import LoadingSpinner from '../components/LoadingSpinner'

const UploadNote = () => {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [selectedFile, setSelectedFile] = useState(null)
    const [formData, setFormData] = useState({
        title: '',
        subject: '',
        semester: '',
        branch: '',
        description: '',
        isHandwritten: false
    })

    const handleFileChange = (e) => {
        const file = e.target.files[0]

        if (!file) return

        // Validate file type
        if (file.type !== 'application/pdf') {
            toast.error('Only PDF files are allowed')
            return
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            toast.error('File size must be less than 10MB')
            return
        }

        setSelectedFile(file)
    }

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        // Validation
        if (!selectedFile) {
            toast.error('Please select a PDF file')
            return
        }

        if (!formData.isHandwritten) {
            toast.error('Please confirm that the notes are handwritten')
            return
        }

        if (!formData.title || !formData.subject || !formData.semester) {
            toast.error('Please fill in all required fields')
            return
        }

        try {
            setLoading(true)

            // Create FormData
            const data = new FormData()
            data.append('file', selectedFile)
            data.append('title', formData.title)
            data.append('subject', formData.subject)
            data.append('semester', formData.semester)
            if (formData.branch) data.append('branch', formData.branch)
            if (formData.description) data.append('description', formData.description)
            data.append('isHandwritten', formData.isHandwritten)

            // Upload
            const response = await api.post('/notes', data, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })

            toast.success('Note uploaded successfully! 🎉')
            navigate(`/notes/${response.data.data._id}`)
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to upload note')
        } finally {
            setLoading(false)
        }
    }

    const removeFile = () => {
        setSelectedFile(null)
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Back Button */}
            <Link to="/notes" className="inline-flex items-center gap-2 text-gray-400 hover:text-white">
                <ArrowLeft className="w-5 h-5" />
                Back to Notes
            </Link>

            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Upload Notes</h1>
                <p className="text-gray-400">Share your handwritten notes with your batchmates</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="card space-y-6">
                {/* File Upload */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        PDF File <span className="text-red-400">*</span>
                    </label>

                    {!selectedFile ? (
                        <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-primary-500 transition-colors bg-dark-200">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-12 h-12 text-gray-500 mb-3" />
                                <p className="mb-2 text-sm text-gray-400">
                                    <span className="font-semibold">Click to upload</span> or drag and drop
                                </p>
                                <p className="text-xs text-gray-500">PDF only (MAX. 10MB)</p>
                            </div>
                            <input
                                type="file"
                                className="hidden"
                                accept=".pdf"
                                onChange={handleFileChange}
                            />
                        </label>
                    ) : (
                        <div className="flex items-center justify-between p-4 bg-dark-200 rounded-lg border border-primary-500/30">
                            <div className="flex items-center gap-3">
                                <FileText className="w-8 h-8 text-primary-400" />
                                <div>
                                    <div className="text-white font-medium">{selectedFile.name}</div>
                                    <div className="text-sm text-gray-400">
                                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                    </div>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={removeFile}
                                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Title */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Title <span className="text-red-400">*</span>
                    </label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="e.g., Data Structures - Unit 3 Notes"
                        className="input w-full"
                        required
                    />
                </div>

                {/* Subject */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Subject <span className="text-red-400">*</span>
                    </label>
                    <select
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        className="input w-full"
                        required
                    >
                        <option value="">Select Subject</option>
                        {SUBJECTS.map(subject => (
                            <option key={subject} value={subject}>{subject}</option>
                        ))}
                    </select>
                </div>

                {/* Semester & Branch */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Semester <span className="text-red-400">*</span>
                        </label>
                        <select
                            name="semester"
                            value={formData.semester}
                            onChange={handleChange}
                            className="input w-full"
                            required
                        >
                            <option value="">Select Semester</option>
                            {SEMESTERS.map(sem => (
                                <option key={sem} value={sem}>{sem}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Branch (Optional)
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

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Description (Optional)
                    </label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Add any additional details about these notes..."
                        className="input w-full min-h-[100px] resize-y"
                        rows={4}
                    />
                </div>

                {/* Handwritten Confirmation */}
                <div className="p-4 bg-primary-500/10 border border-primary-500/30 rounded-lg">
                    <label className="flex items-start gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            name="isHandwritten"
                            checked={formData.isHandwritten}
                            onChange={handleChange}
                            className="mt-1 w-5 h-5 rounded border-gray-600 text-primary-500 focus:ring-primary-500"
                        />
                        <div>
                            <div className="text-white font-medium mb-1">
                                I confirm these are handwritten notes <span className="text-red-400">*</span>
                            </div>
                            <div className="text-sm text-gray-400">
                                Only handwritten notes are allowed. Typed or printed notes will be removed.
                            </div>
                        </div>
                    </label>
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
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Upload className="w-5 h-5" />
                                Upload Note
                            </>
                        )}
                    </button>
                    <Link to="/notes" className="btn-secondary">
                        Cancel
                    </Link>
                </div>
            </form>

            {/* Info Box */}
            <div className="card bg-blue-500/10 border-blue-500/30">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-400" />
                    Earn Reputation Points
                </h3>
                <ul className="space-y-2 text-sm text-gray-300">
                    <li>• Get 5 points when your note receives 3 upvotes</li>
                    <li>• Get 5 points when your note gets 1 download</li>
                    <li>• Help your batchmates and build your reputation!</li>
                </ul>
            </div>
        </div>
    )
}

export default UploadNote
