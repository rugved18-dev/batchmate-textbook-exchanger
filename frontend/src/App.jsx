import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import PageLoader from './components/PageLoader'
import LoadingSpinner from './components/LoadingSpinner'

const Landing = lazy(() => import('./pages/Landing'))
const Login = lazy(() => import('./pages/Login'))
const CompleteRegistration = lazy(() => import('./pages/CompleteRegistration'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Notes = lazy(() => import('./pages/Notes'))
const NoteDetail = lazy(() => import('./pages/NoteDetail'))
const UploadNote = lazy(() => import('./pages/UploadNote'))
const Books = lazy(() => import('./pages/Books'))
const BookDetail = lazy(() => import('./pages/BookDetail'))
const ListBook = lazy(() => import('./pages/ListBook'))
const Chat = lazy(() => import('./pages/Chat'))
const Profile = lazy(() => import('./pages/Profile'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const NotFound = lazy(() => import('./pages/NotFound'))

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
        <PageLoader message="Loading Batchmate..." />
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/complete-registration" element={<CompleteRegistration />} />

          {/* Protected Routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Suspense fallback={<PageLoader />}>
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

                      {/* Admin */}
                      <Route path="/admin" element={<AdminDashboard />} />

                      {/* Default & 404 */}
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}

export default App
