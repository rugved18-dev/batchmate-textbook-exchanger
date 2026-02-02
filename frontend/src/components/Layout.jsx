import Navbar from './Navbar'

const Layout = ({ children }) => {
    return (
        <div className="min-h-screen bg-dark-300">
            <Navbar />

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    )
}

export default Layout

