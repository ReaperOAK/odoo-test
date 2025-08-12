import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log error for debugging
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data
    });

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.patch('/auth/profile', data),
  becomeHost: (data) => api.post('/auth/become-host', data),
  changePassword: (data) => api.post('/auth/change-password', data),
};

// Listings API calls
export const listingsAPI = {
  getAll: (params) => api.get('/listings', { params }),
  getById: (id) => api.get(`/listings/${id}`),
  create: (data) => api.post('/listings', data),
  update: (id, data) => api.patch(`/listings/${id}`, data),
  delete: (id) => api.delete(`/listings/${id}`),
  checkAvailability: (id, params) => api.get(`/listings/${id}/availability`, { params }),
};

// Orders API calls
export const ordersAPI = {
  create: (data) => api.post('/orders', data),
  getMyOrders: (params) => api.get('/orders/my-orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  updateStatus: (id, data) => api.patch(`/orders/${id}/status`, data),
  cancel: (id) => api.post(`/orders/${id}/cancel`),
  initiatePayment: (id, data) => api.post(`/orders/${id}/initiate-payment`, data),
  confirmPayment: (id, data) => api.post(`/orders/${id}/confirm-payment`, data),
};

// Payments API calls
export const paymentsAPI = {
  getOrderPayments: (orderId) => api.get(`/payments/orders/${orderId}/payments`),
  getPaymentDetails: (id) => api.get(`/payments/${id}`),
  retryPayment: (id) => api.post(`/payments/${id}/retry`),
  mockPaymentSuccess: (orderId) => api.post(`/payments/mock/${orderId}/success`),
};

// Host API calls
export const hostAPI = {
  getDashboard: () => api.get('/host/dashboard'),
  getListings: (params) => api.get('/host/listings', { params }),
  getOrders: (params) => api.get('/host/orders', { params }),
  getCalendar: (params) => api.get('/host/calendar', { params }),
  getWalletTransactions: (params) => api.get('/host/wallet/transactions', { params }),
  markPickup: (orderId, data) => api.post(`/host/orders/${orderId}/pickup`, data),
  markReturn: (orderId, data) => api.post(`/host/orders/${orderId}/return`, data),
};

// Admin API calls
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getAnalytics: () => api.get('/admin/analytics'),
  getSystemHealth: () => api.get('/admin/system-health'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUser: (id, data) => api.patch(`/admin/users/${id}`, data),
  getOrders: (params) => api.get('/admin/orders', { params }),
  getOrderById: (id) => api.get(`/admin/orders/${id}`),
  updateOrderStatus: (id, data) => api.patch(`/admin/orders/${id}/status`, data),
  resolveDispute: (orderId, data) => api.post(`/admin/orders/${orderId}/resolve-dispute`, data),
  getPayouts: (params) => api.get('/admin/payouts', { params }),
  createPayout: (data) => api.post('/admin/payouts', data),
  processPayout: (id, data) => api.post(`/admin/payouts/${id}/process`, data),
};

export default api;
