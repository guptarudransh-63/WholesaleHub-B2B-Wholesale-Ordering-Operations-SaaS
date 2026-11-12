import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request Interceptor: Attach JWT Token from localStorage if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('wholesalehub_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Uniform error message unwrapping
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected error occurred. Please try again.';
    
    // If token expired, clear local storage
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('wholesalehub_token');
      localStorage.removeItem('wholesalehub_user');
      localStorage.removeItem('wholesalehub_profile');
    }

    return Promise.reject(new Error(message));
  }
);

export default api;
