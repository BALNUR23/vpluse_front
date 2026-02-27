import api from './axios';

export const newsAPI = {
  list: () => api.get('/core/news/'),
  create: (data) => api.post('/core/news/', data),
  update: (id, data) => api.patch(`/core/news/${id}/`, data),
  delete: (id) => api.delete(`/core/news/${id}/`),
};

export const regulationsAPI = {
  list: (params) => api.get('/content/regulations/', { params }),
  create: (data) => api.post('/content/regulations/', data),
  update: (id, data) => api.patch(`/content/regulations/${id}/`, data),
  delete: (id) => api.delete(`/content/regulations/${id}/`),
};

export const instructionsAPI = {
  list: () => api.get('/content/instructions/'),
};

export const onboardingAPI = {
  getMy: () => api.get('/onboarding/my/'),
  submitReport: (data) => api.post('/onboarding/reports/', data),
  updateReport: (id, data) => api.patch(`/onboarding/reports/${id}/`, data),
  getReports: (params) => api.get('/onboarding/reports/', { params }),
  reviewReport: (id, data) => api.post(`/onboarding/reports/${id}/review/`, data),
};

export const schedulesAPI = {
  getWorkSchedules: () => api.get('/schedules/work-schedules/'),
  getMine: () => api.get('/schedules/user-schedules/mine/'),
  getHolidays: (year) => api.get('/schedules/holidays/', { params: { year } }),
};

export const feedbackAPI = {
  list: () => api.get('/feedback/tickets/'),
  create: (data) => api.post('/feedback/tickets/', data),
  reply: (id, data) => api.post(`/feedback/tickets/${id}/reply/`, data),
};

export const auditAPI = {
  list: (params) => api.get('/core/audit/', { params }),
};
