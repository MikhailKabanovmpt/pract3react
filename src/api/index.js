
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});


api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});



export const createService = (serviceData) => 
  api.post('/services', serviceData);

export const updateService = (id, serviceData) => 
  api.put(`/services/${id}`, serviceData);

export const deleteService = (id) => 
  api.delete(`/services/${id}`);



export const login = (email, password) =>
  api.post('/login', { email, password });

export const register = (data) =>
  api.post('/register', data);

export const getMe = () =>
  api.get('/auth/me');


export const getCategories = () =>
  api.get('/categories');

export const createCategory = (name) =>
  api.post('/categories', { name });


export const getServices = (params = {}) =>
  api.get('/services', { params }); 

export const getServiceById = (id) =>
  api.get(`/services/${id}`);

export const setServiceDiscount = (id, discount_percent) =>
  api.patch(`/services/${id}/discount`, { discount_percent });


export const createAppointment = (items, coupon_code) =>
  api.post('/appointments', { items, coupon_code });

export const getMyAppointments = () =>
  api.get('/appointments/my');


export const getUsers = () =>
  api.get('/admin/users');

export const assignCoupon = (user_id, coupon_code, coupon_discount) =>
  api.post('/admin/users/coupon', { user_id, coupon_code, coupon_discount });


export const validateCoupon = (code) =>
  api.post('/coupons/validate', { code });

export default api;
