import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import CompleteRegistration from './pages/CompleteRegistration'
import Dashboard from './pages/Dashboard'
import Notes from './pages/Notes'
import NoteDetail from './pages/NoteDetail'
import UploadNote from './pages/UploadNote'
import Books from './pages/Books'
import BookDetail from './pages/BookDetail'
import ListBook from './pages/ListBook'
import Chat from './pages/Chat'
import Profile from './pages/Profile'
import NotFound from './pages/NotFound'
import LoadingSpinner from './components/LoadingSpinner'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text="Loading..." />
      </div>
    )
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function App() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-300">
        <LoadingSpinner size="large" text="Loading Batchmate..." />
      </div>
    )
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/complete-registration" element={<CompleteRegistration />} />

      {/* Protected Routes */}
      <Route path="/*" element={
        <ProtectedRoute>
          <Layout>
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />

              {/* Notes Routes */}
              <Route path="/notes" element={<Notes />} />
              <Route path="/notes/:id" element={<NoteDetail />} />
              <Route path="/upload-note" element={<UploadNote />} />

              {/* Books Routes */}
              <Route path="/books" element={<Books />} />
              <Route path="/books/:id" element={<BookDetail />} />
              <Route path="/list-book" element={<ListBook />} />

              {/* Chat & Profile */}
              <Route path="/chat" element={<Chat />} />
              <Route path="/profile" element={<Profile />} />

              {/* Default & 404 */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </ProtectedRoute>
      } />
    </Routes>
  )
}

export default App
