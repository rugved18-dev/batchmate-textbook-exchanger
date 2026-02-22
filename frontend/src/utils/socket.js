import { io } from 'socket.io-client';

// In dev: connect to same origin → Vite proxies /socket.io → backend:5000 (ws:true in vite.config.js)
// In prod: set VITE_API_URL to your deployed backend URL
const SOCKET_URL = import.meta.env.VITE_API_URL || window.location.origin;

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