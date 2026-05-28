import axios from 'axios'

export const getBackendUrl = () => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:5000/api';
    }
    return import.meta.env.VITE_API_URL || '/api';
};

const api = axios.create({
    baseURL: getBackendUrl(),
    headers: {
        'Content-Type': 'application/json',
    },
})

// Request interceptor - add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => Promise.reject(error)
)

const refreshClient = axios.create({
    baseURL: getBackendUrl(),
    headers: { 'Content-Type': 'application/json' }
});

const getErrorMessage = (error) => {
    return error?.response?.data?.message || error?.message || 'An unexpected error occurred';
};

// Response interceptor - handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true

            try {
                const refreshToken = localStorage.getItem('refreshToken')
                const response = await refreshClient.post('/auth/refresh', { refreshToken })

                const { accessToken } = response.data.tokens
                localStorage.setItem('accessToken', accessToken)

                originalRequest.headers.Authorization = `Bearer ${accessToken}`
                return api(originalRequest)
            } catch (refreshError) {
                localStorage.removeItem('accessToken')
                localStorage.removeItem('refreshToken')
                window.location.href = '/login'
                return Promise.reject(refreshError)
            }
        }

        // Attach friendly error message for callers
        error.userMessage = getErrorMessage(error)
        return Promise.reject(error)
    }
)

export default api
