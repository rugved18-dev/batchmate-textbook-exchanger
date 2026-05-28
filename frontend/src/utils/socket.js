import { io } from 'socket.io-client';
import { getBackendUrl } from './api';

// Dynamically compute the socket connection root URL based on the API URL
const getSocketUrl = () => {
    const backendUrl = getBackendUrl();
    return backendUrl.endsWith('/api') ? backendUrl.slice(0, -4) : backendUrl;
};

const SOCKET_URL = getSocketUrl();

// Create socket instance but do NOT auto-connect.
// We manually connect after the user logs in.
export const socket = io(SOCKET_URL, {
    autoConnect: false,
    withCredentials: true,
    transports: ['websocket', 'polling'],
});

/**
 * Connect the socket and register the user's room.
 * Call this right after a successful login.
 * @param {Object} user - The authenticated user object from AuthContext
 */
export const connectSocket = (user) => {
    if (!user?._id) return;
    if (!socket.connected) {
        socket.connect();
    }
    socket.emit('setup', user);
};

/**
 * Disconnect the socket.
 * Call this on logout.
 */
export const disconnectSocket = () => {
    if (socket.connected) {
        socket.disconnect();
    }
};