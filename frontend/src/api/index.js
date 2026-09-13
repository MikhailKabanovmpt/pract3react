const API_URL = 'http://localhost:3001/api';

const getToken = () => localStorage.getItem('salon_token');

const request = async (path, options = {}) => {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка запроса');
  return data;
};


export const login = (email, password) =>
  request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });

export const register = (name, email, password) =>
  request('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });

export const getMe = () => request('/auth/me');


export const getCategories = () => request('/categories');
export const createCategory = (name) =>
  request('/categories', { method: 'POST', body: JSON.stringify({ name }) });
export const deleteCategory = (id) =>
  request(`/categories/${id}`, { method: 'DELETE' });


export const getServices = (category) =>
  request(`/services${category ? `?category=${category}` : ''}`);
export const createService = (data) =>
  request('/services', { method: 'POST', body: JSON.stringify(data) });
export const updateService = (id, data) =>
  request(`/services/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteService = (id) =>
  request(`/services/${id}`, { method: 'DELETE' });


export const setUserDiscount = (data) =>
  request('/admin/user-discount', { method: 'POST', body: JSON.stringify(data) });
export const setServiceDiscount = (data) =>
  request('/admin/service-discount', { method: 'POST', body: JSON.stringify(data) });


export const getAppointments = () => request('/appointments');
export const createAppointment = (data) =>
  request('/appointments', { method: 'POST', body: JSON.stringify(data) });
export const updateAppointmentStatus = (id, status) =>
  request(`/appointments/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });

export const createPayment = (data) =>
  request('/payments', { method: 'POST', body: JSON.stringify(data) });


export const getUsers = () => request('/admin/users');
