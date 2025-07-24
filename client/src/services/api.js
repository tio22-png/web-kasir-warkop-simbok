import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || '') + '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
};

export const productsAPI = {
  getAllProducts: () => api.get('/products'),
  getProductsByCategory: (category) => api.get(`/products/category/${category}`),
  getCategories: () => api.get('/products/categories'),
  addProduct: (data) => api.post('/products', data),
  updateProduct: (id, data) => api.put(`/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  updateStock: (productId, stock) => api.patch(`/products/${productId}/stock`, { stock }),
};

export const ordersAPI = {
  createOrder: (orderData) => api.post('/orders', orderData),
  getAllOrders: () => api.get('/orders'),
  updateOrderStatus: (orderId, status) => api.patch(`/orders/${orderId}/status`, { status }),
  updateOrderPayment: (orderId, paymentMethod) => api.patch(`/orders/${orderId}/payment`, { payment_method: paymentMethod }),
};

export default api;
