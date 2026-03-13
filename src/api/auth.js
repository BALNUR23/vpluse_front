import api from './axios';

export const authAPI = {
  login: (username, password) =>
    api.post('/auth/login/', { username, password }),

  logout: (refresh) =>
    api.post('/auth/logout/', { refresh }),

  getMe: () =>
    api.get('/auth/me/'),

  updateMe: (data) =>
    api.patch('/auth/me/', data),

  changePassword: (data) =>
    api.post('/auth/me/password/', data),
};

export const usersAPI = {
  list: (params) => api.get('/auth/users/', { params }),
  create: (data) => api.post('/auth/users/', data),
  update: (id, data) => api.patch(`/auth/users/${id}/`, data),
  delete: (id) => api.delete(`/auth/users/${id}/`),
  toggleStatus: (id) => api.post(`/auth/users/${id}/toggle_status/`),
  setRole: (id, role) => api.post(`/auth/users/${id}/set_role/`, { role }),
};

export const departmentsAPI = {
  list: () => api.get('/auth/departments/'),
  create: (data) => api.post('/auth/departments/', data),
  update: (id, data) => api.patch(`/auth/departments/${id}/`, data),
  delete: (id) => api.delete(`/auth/departments/${id}/`),
  transferUsers: (id, data) => api.post(`/auth/departments/${id}/transfer-users/`, data),
};

export const subdivisionsAPI = {
  list: (params) => api.get('/auth/subdivisions/', { params }),
  create: (data) => api.post('/auth/subdivisions/', data),
  update: (id, data) => api.patch(`/auth/subdivisions/${id}/`, data),
  delete: (id) => api.delete(`/auth/subdivisions/${id}/`),
};

export const positionsAPI = {
  list: (params) => api.get('/auth/positions/', { params }),
  create: (data) => api.post('/auth/positions/', data),
  delete: (id) => api.delete(`/auth/positions/${id}/`),
};

export const promotionRequestsAPI = {
  list: (params) => api.get('/auth/promotion-requests/', { params }),
  create: (data) => api.post('/auth/promotion-requests/', data),
  action: (id, action) => api.post(`/auth/promotion-requests/${id}/${action}/`),
};

export const orgStructureAPI = {
  list: (params) => api.get('/auth/org-units/', { params }),
  tree: () => api.get('/auth/org-units/tree/'),
  create: (data) => api.post('/auth/org-units/', data),
  update: (id, data) => api.patch(`/auth/org-units/${id}/`, data),
  delete: (id) => api.delete(`/auth/org-units/${id}/`),
  seedLargeDemo: () => api.post('/auth/org-units/seed_large_demo/'),
};
