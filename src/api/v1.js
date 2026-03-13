import api from './axios';

// ── Accounts ──────────────────────────────────────────────────────────────────

export const accountsAPI = {
  companyStructure: () => api.get('/v1/accounts/company/structure/'),
  employeeHome: () => api.get('/v1/accounts/employee/home/'),
  login: (data) => api.post('/v1/accounts/login/', data),
  passwordResetRequest: (data) => api.post('/v1/accounts/password-reset/request/', data),
  passwordResetConfirm: (data) => api.post('/v1/accounts/password-reset/confirm/', data),
  getProfile: () => api.get('/v1/accounts/me/profile/'),
  changePassword: (data) => api.post('/v1/accounts/me/profile/password/', data),
  changePasswordPatch: (data) => api.patch('/v1/accounts/me/profile/password/', data),
  getInternRole: () => api.get('/v1/accounts/me/intern-role/'),
  setInternRole: (data) => api.post('/v1/accounts/me/intern-role/', data),
  positions: () => api.get('/v1/accounts/positions/'),
};

// ── Org ───────────────────────────────────────────────────────────────────────

export const orgAPI = {
  structure: () => api.get('/v1/accounts/org/structure/'),
  departments: {
    list: () => api.get('/v1/accounts/org/departments/'),
    create: (data) => api.post('/v1/accounts/org/departments/', data),
    get: (id) => api.get(`/v1/accounts/org/departments/${id}/`),
    update: (id, data) => api.put(`/v1/accounts/org/departments/${id}/`, data),
    patch: (id, data) => api.patch(`/v1/accounts/org/departments/${id}/`, data),
    delete: (id) => api.delete(`/v1/accounts/org/departments/${id}/`),
  },
  positions: {
    list: () => api.get('/v1/accounts/org/positions/'),
    create: (data) => api.post('/v1/accounts/org/positions/', data),
    get: (id) => api.get(`/v1/accounts/org/positions/${id}/`),
    update: (id, data) => api.put(`/v1/accounts/org/positions/${id}/`, data),
    patch: (id, data) => api.patch(`/v1/accounts/org/positions/${id}/`, data),
    delete: (id) => api.delete(`/v1/accounts/org/positions/${id}/`),
  },
  subdivisions: {
    list: () => api.get('/v1/accounts/org/subdivisions/'),
    create: (data) => api.post('/v1/accounts/org/subdivisions/', data),
    get: (id) => api.get(`/v1/accounts/org/subdivisions/${id}/`),
    update: (id, data) => api.put(`/v1/accounts/org/subdivisions/${id}/`, data),
    patch: (id, data) => api.patch(`/v1/accounts/org/subdivisions/${id}/`, data),
    delete: (id) => api.delete(`/v1/accounts/org/subdivisions/${id}/`),
  },
};

// ── Auth v1 ───────────────────────────────────────────────────────────────────

export const authV1API = {
  login: (data) => api.post('/v1/auth/login/', data),
  refresh: (data) => api.post('/v1/auth/refresh/', data),
};

// ── Attendance ────────────────────────────────────────────────────────────────

export const attendanceAPI = {
  list: (params) => api.get('/v1/attendance/', { params }),
  calendar: (params) => api.get('/v1/attendance/calendar/', { params }),
  checkIn: (data) => api.post('/v1/attendance/check-in/', data),
  checkinsReport: (params) => api.get('/v1/attendance/checkins-report/', { params }),
  my: (params) => api.get('/v1/attendance/my/', { params }),
  team: (params) => api.get('/v1/attendance/team/', { params }),
  mark: {
    create: (data) => api.post('/v1/attendance/mark/', data),
    update: (data) => api.patch('/v1/attendance/mark/', data),
    delete: (data) => api.delete('/v1/attendance/mark/', { data }),
  },
  workCalendar: {
    list: (params) => api.get('/v1/attendance/work-calendar/', { params }),
    create: (data) => api.post('/v1/attendance/work-calendar/', data),
    update: (data) => api.patch('/v1/attendance/work-calendar/', data),
    delete: (data) => api.delete('/v1/attendance/work-calendar/', { data }),
    generate: (data) => api.post('/v1/attendance/work-calendar/generate/', data),
  },
};

// ── BPM ───────────────────────────────────────────────────────────────────────

export const bpmAPI = {
  list: (params) => api.get('/v1/bpm/', { params }),
  get: (id) => api.get(`/v1/bpm/${id}/`),
  createInstance: (data) => api.post('/v1/bpm/instances/', data),
  completeStep: (stepId, data) => api.post(`/v1/bpm/steps/${stepId}/complete/`, data),
  stepTemplates: {
    list: () => api.get('/v1/bpm/admin/step-templates/'),
    create: (data) => api.post('/v1/bpm/admin/step-templates/', data),
    get: (id) => api.get(`/v1/bpm/admin/step-templates/${id}/`),
    update: (id, data) => api.put(`/v1/bpm/admin/step-templates/${id}/`, data),
    patch: (id, data) => api.patch(`/v1/bpm/admin/step-templates/${id}/`, data),
    delete: (id) => api.delete(`/v1/bpm/admin/step-templates/${id}/`),
  },
  templates: {
    list: () => api.get('/v1/bpm/admin/templates/'),
    create: (data) => api.post('/v1/bpm/admin/templates/', data),
    get: (id) => api.get(`/v1/bpm/admin/templates/${id}/`),
    update: (id, data) => api.put(`/v1/bpm/admin/templates/${id}/`, data),
    patch: (id, data) => api.patch(`/v1/bpm/admin/templates/${id}/`, data),
    delete: (id) => api.delete(`/v1/bpm/admin/templates/${id}/`),
  },
};

// ── Notifications ─────────────────────────────────────────────────────────────

export const notificationsAPI = {
  list: (params) => api.get('/v1/common/notifications/', { params }),
  markRead: (id) => api.patch(`/v1/common/notifications/${id}/read/`),
  markAllRead: () => api.patch('/v1/common/notifications/read-all/'),
};

// ── Content ───────────────────────────────────────────────────────────────────

export const contentAPI = {
  // User-facing
  news: {
    list: () => api.get('/v1/content/news/'),
    get: (id) => api.get(`/v1/content/news/${id}/`),
    sliderSettings: () => api.get('/v1/content/news/slider-settings/'),
  },
  welcome: () => api.get('/v1/content/welcome/'),
  instruction: () => api.get('/v1/content/instruction/'),
  languages: () => api.get('/v1/content/languages/'),
  employees: () => api.get('/v1/content/employees/'),
  feedback: (data) => api.post('/v1/content/feedback/', data),

  // Courses (user)
  courses: {
    available: () => api.get('/v1/content/courses/available/'),
    my: () => api.get('/v1/content/courses/my/'),
    menuAccess: () => api.get('/v1/content/courses/menu-access/'),
    start: (data) => api.post('/v1/content/courses/start/', data),
    accept: (data) => api.post('/v1/content/courses/accept/', data),
    selfEnroll: (data) => api.post('/v1/content/courses/self-enroll/', data),
    progress: (data) => api.post('/v1/content/courses/progress/', data),
  },

  // Courses (admin)
  adminCourses: {
    list: () => api.get('/v1/content/admin/courses/'),
    create: (data) => api.post('/v1/content/admin/courses/', data),
    get: (id) => api.get(`/v1/content/admin/courses/${id}/`),
    update: (id, data) => api.put(`/v1/content/admin/courses/${id}/`, data),
    patch: (id, data) => api.patch(`/v1/content/admin/courses/${id}/`, data),
    delete: (id) => api.delete(`/v1/content/admin/courses/${id}/`),
    assign: (data) => api.post('/v1/content/admin/courses/assign/', data),
  },

  // Feedback (admin)
  adminFeedback: {
    list: () => api.get('/v1/content/admin/feedback/'),
    create: (data) => api.post('/v1/content/admin/feedback/', data),
    get: (id) => api.get(`/v1/content/admin/feedback/${id}/`),
    patch: (id, data) => api.patch(`/v1/content/admin/feedback/${id}/`, data),
    delete: (id) => api.delete(`/v1/content/admin/feedback/${id}/`),
    setStatus: (id, data) => api.post(`/v1/content/admin/feedback/${id}/set-status/`, data),
    meta: () => api.get('/v1/content/admin/feedback/meta/'),
    stats: () => api.get('/v1/content/admin/feedback/stats/'),
  },
};

// ── Knowledge Base ────────────────────────────────────────────────────────────

export const kbAPI = {
  list: (params) => api.get('/v1/kb/', { params }),
  get: (id) => api.get(`/v1/kb/${id}/`),
  report: () => api.get('/v1/kb/report/'),

  admin: {
    articles: {
      list: () => api.get('/v1/kb/admin/articles/'),
      create: (data) => api.post('/v1/kb/admin/articles/', data),
      get: (id) => api.get(`/v1/kb/admin/articles/${id}/`),
      update: (id, data) => api.put(`/v1/kb/admin/articles/${id}/`, data),
      patch: (id, data) => api.patch(`/v1/kb/admin/articles/${id}/`, data),
      delete: (id) => api.delete(`/v1/kb/admin/articles/${id}/`),
    },
    categories: {
      list: () => api.get('/v1/kb/admin/categories/'),
      create: (data) => api.post('/v1/kb/admin/categories/', data),
      get: (id) => api.get(`/v1/kb/admin/categories/${id}/`),
      update: (id, data) => api.put(`/v1/kb/admin/categories/${id}/`, data),
      patch: (id, data) => api.patch(`/v1/kb/admin/categories/${id}/`, data),
      delete: (id) => api.delete(`/v1/kb/admin/categories/${id}/`),
    },
  },
};

// ── Metrics ───────────────────────────────────────────────────────────────────

export const metricsAPI = {
  list: (params) => api.get('/v1/metrics/', { params }),
  team: (params) => api.get('/v1/metrics/team/', { params }),
};

// ── Onboarding v1 ─────────────────────────────────────────────────────────────

export const onboardingV1API = {
  // User
  days: {
    list: () => api.get('/v1/onboarding/days/'),
    get: (id) => api.get(`/v1/onboarding/days/${id}/`),
    complete: (id, data) => api.post(`/v1/onboarding/days/${id}/complete/`, data),
  },
  overview: () => api.get('/v1/onboarding/overview/'),
  userProgress: (userId) => api.get(`/v1/onboarding/progress/${userId}/detail/`),

  // Admin
  admin: {
    days: {
      list: () => api.get('/v1/onboarding/admin/onboarding/days/'),
      create: (data) => api.post('/v1/onboarding/admin/onboarding/days/', data),
      get: (id) => api.get(`/v1/onboarding/admin/onboarding/days/${id}/`),
      update: (id, data) => api.put(`/v1/onboarding/admin/onboarding/days/${id}/`, data),
      patch: (id, data) => api.patch(`/v1/onboarding/admin/onboarding/days/${id}/`, data),
      delete: (id) => api.delete(`/v1/onboarding/admin/onboarding/days/${id}/`),
    },
    materials: {
      list: () => api.get('/v1/onboarding/admin/onboarding/materials/'),
      create: (data) => api.post('/v1/onboarding/admin/onboarding/materials/', data),
      get: (id) => api.get(`/v1/onboarding/admin/onboarding/materials/${id}/`),
      update: (id, data) => api.put(`/v1/onboarding/admin/onboarding/materials/${id}/`, data),
      patch: (id, data) => api.patch(`/v1/onboarding/admin/onboarding/materials/${id}/`, data),
      delete: (id) => api.delete(`/v1/onboarding/admin/onboarding/materials/${id}/`),
    },
    progress: {
      list: () => api.get('/v1/onboarding/admin/onboarding/progress/'),
      get: (id) => api.get(`/v1/onboarding/admin/onboarding/progress/${id}/`),
    },
  },
};

// ── Payroll ───────────────────────────────────────────────────────────────────

export const payrollAPI = {
  list: (params) => api.get('/v1/payroll/', { params }),
  admin: {
    list: (params) => api.get('/v1/payroll/admin/', { params }),
    generate: (data) => api.post('/v1/payroll/admin/generate/', data),
    setPeriodStatus: (periodId, data) => api.patch(`/v1/payroll/admin/periods/${periodId}/status/`, data),
    salaryProfiles: {
      list: () => api.get('/v1/payroll/admin/salary-profiles/'),
      create: (data) => api.post('/v1/payroll/admin/salary-profiles/', data),
      patch: (profileId, data) => api.patch(`/v1/payroll/admin/salary-profiles/${profileId}/`, data),
    },
  },
};

// ── Reports ───────────────────────────────────────────────────────────────────

export const reportsAPI = {
  submit: (data) => api.post('/v1/reports/submit/', data),
  admin: {
    onboarding: {
      reportLogs: {
        list: (params) => api.get('/v1/reports/admin/onboarding/report-logs/', { params }),
        get: (id) => api.get(`/v1/reports/admin/onboarding/report-logs/${id}/`),
      },
      reports: {
        list: (params) => api.get('/v1/reports/admin/onboarding/reports/', { params }),
        get: (id) => api.get(`/v1/reports/admin/onboarding/reports/${id}/`),
        patch: (id, data) => api.patch(`/v1/reports/admin/onboarding/reports/${id}/`, data),
      },
    },
  },
  employee: {
    daily: {
      list: (params) => api.get('/v1/reports/employee/daily/', { params }),
      create: (data) => api.post('/v1/reports/employee/daily/', data),
    },
  },
  notifications: {
    list: (params) => api.get('/v1/reports/notifications/', { params }),
    create: (data) => api.post('/v1/reports/notifications/', data),
    get: (id) => api.get(`/v1/reports/notifications/${id}/`),
    update: (id, data) => api.put(`/v1/reports/notifications/${id}/`, data),
    patch: (id, data) => api.patch(`/v1/reports/notifications/${id}/`, data),
    delete: (id) => api.delete(`/v1/reports/notifications/${id}/`),
  },
};

// ── Regulations v1 ────────────────────────────────────────────────────────────

export const regulationsV1API = {
  list: (params) => api.get('/v1/regulations/', { params }),
  get: (id) => api.get(`/v1/regulations/${id}/`),
  acknowledge: (id) => api.post(`/v1/regulations/${id}/acknowledge/`),
  download: (id) => api.get(`/v1/regulations/${id}/download/`),
  feedback: (id, data) => api.post(`/v1/regulations/${id}/feedback/`, data),
  quiz: (id, data) => api.post(`/v1/regulations/${id}/quiz/`, data),
  read: (id) => api.post(`/v1/regulations/${id}/read/`),
  view: (id) => api.get(`/v1/regulations/${id}/view/`),
  intern: {
    overview: () => api.get('/v1/regulations/intern/overview/'),
    start: (data) => api.post('/v1/regulations/intern/start/', data),
    submit: (data) => api.post('/v1/regulations/intern/submit/', data),
  },
  firstDay: {
    mandatory: () => api.get('/v1/regulations/first-day/mandatory/'),
  },
  admin: {
    list: (params) => api.get('/v1/regulations/admin/', { params }),
    create: (data) => api.post('/v1/regulations/admin/', data),
    get: (id) => api.get(`/v1/regulations/admin/${id}/`),
    update: (id, data) => api.put(`/v1/regulations/admin/${id}/`, data),
    patch: (id, data) => api.patch(`/v1/regulations/admin/${id}/`, data),
    delete: (id) => api.delete(`/v1/regulations/admin/${id}/`),
    internRequests: {
      list: (params) => api.get('/v1/regulations/admin/intern-requests/', { params }),
      approve: (requestId, data) => api.post(`/v1/regulations/admin/intern-requests/${requestId}/approve/`, data),
    },
  },
};

// ── Security v1 ───────────────────────────────────────────────────────────────

export const securityV1API = {
  systemLogs: {
    list: (params) => api.get('/v1/security/admin/system-logs/', { params }),
    get: (id) => api.get(`/v1/security/admin/system-logs/${id}/`),
  },
};

// ── Work Schedules v1 ─────────────────────────────────────────────────────────

export const workSchedulesAPI = {
  list: (params) => api.get('/v1/work-schedules/', { params }),
  my: () => api.get('/v1/work-schedules/my/'),
  select: (data) => api.post('/v1/work-schedules/select/', data),
  calendar: (params) => api.get('/v1/work-schedules/calendar/', { params }),
  weeklyPlans: {
    my: () => api.get('/v1/work-schedules/weekly-plans/my/'),
    create: (data) => api.post('/v1/work-schedules/weekly-plans/my/', data),
    myChanges: () => api.get('/v1/work-schedules/weekly-plans/my/changes/'),
  },
  admin: {
    assign: (data) => api.post('/v1/work-schedules/admin/assign/', data),
    calendarDay: (data) => api.post('/v1/work-schedules/admin/calendar/day/', data),
    calendarGenerate: (data) => api.post('/v1/work-schedules/admin/calendar/generate/', data),
    requests: {
      list: (params) => api.get('/v1/work-schedules/admin/requests/', { params }),
      decide: (requestId, data) => api.post(`/v1/work-schedules/admin/requests/${requestId}/decision/`, data),
    },
    templates: {
      list: (params) => api.get('/v1/work-schedules/admin/templates/', { params }),
      create: (data) => api.post('/v1/work-schedules/admin/templates/', data),
      patch: (scheduleId, data) => api.patch(`/v1/work-schedules/admin/templates/${scheduleId}/`, data),
      users: (scheduleId) => api.get(`/v1/work-schedules/admin/templates/${scheduleId}/users/`),
    },
    weeklyPlans: {
      list: (params) => api.get('/v1/work-schedules/admin/weekly-plans/', { params }),
      changes: (planId) => api.get(`/v1/work-schedules/admin/weekly-plans/${planId}/changes/`),
      decide: (planId, data) => api.post(`/v1/work-schedules/admin/weekly-plans/${planId}/decision/`, data),
    },
  },
};

// ── Tasks v1 ──────────────────────────────────────────────────────────────────

export const tasksV1API = {
  my: (params) => api.get('/v1/tasks/my/', { params }),
  team: (params) => api.get('/v1/tasks/team/', { params }),
  assignees: () => api.get('/v1/tasks/assignees/'),
  get: (id) => api.get(`/v1/tasks/${id}/`),
  create: (data) => api.post('/v1/tasks/create/', data),
  patch: (id, data) => api.patch(`/v1/tasks/${id}/`, data),
  move: (id, data) => api.patch(`/v1/tasks/${id}/move/`, data),
};
