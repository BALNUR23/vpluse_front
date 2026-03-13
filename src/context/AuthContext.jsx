import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/auth';

const AuthContext = createContext(null);

const USE_MOCK = false;

const ROLE_LABELS = {
  intern: 'Стажёр',
  employee: 'Сотрудник',
  projectmanager: 'Проект-менеджер',
  admin: 'Администратор',
  superadmin: 'Суперадминистратор',
};

const ROLE_MAP = {
  project_manager: 'projectmanager',
  super_admin: 'superadmin',
};

function normalizeUser(raw) {
  const rawRole = raw.role || 'intern';
  const role = ROLE_MAP[rawRole] || rawRole;
  return {
    id: raw.id,
    username: raw.username,
    login: raw.username,
    name: raw.full_name || `${raw.first_name || ''} ${raw.last_name || ''}`.trim() || raw.username,
    first_name: raw.first_name || '',
    last_name: raw.last_name || '',
    email: raw.email || '',
    role,
    roleLabel: raw.role_label || ROLE_LABELS[role] || role,
    department: raw.department,
    department_name: raw.department_name || '',
    subdivision: raw.subdivision,
    subdivision_name: raw.subdivision_name || '',
    position: raw.position,
    position_name: raw.position_name || '',
    phone: raw.phone || '',
    telegram: raw.telegram || '',
    hireDate: raw.hire_date || '',
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      authAPI.getMe()
        .then(res => setUser(normalizeUser(res.data)))
        .catch(err => {
          const status = err.response?.status;
          if (status === 401 || status === 403) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
          }
        })
        .finally(() => setBootstrapped(true));
    } else {
      setBootstrapped(true);
    }
  }, []);

  const login = async (loginVal, password) => {
    setLoading(true);
    try {
      let res;
      try {
        res = await authAPI.login(loginVal, password);
      } catch (e) {
        const d = e.response?.data;
        const msg = d?.detail || d?.non_field_errors?.[0] || d?.username?.[0] || d?.password?.[0] || 'Неверный логин или пароль';
        throw new Error(msg);
      }
      const { access, refresh } = res.data;
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      const meRes = await authAPI.getMe();
      const normalized = normalizeUser(meRes.data);
      setUser(normalized);
      return normalized;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    const refresh = localStorage.getItem('refresh_token');
    if (refresh) await authAPI.logout(refresh).catch(() => {});
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  const updateUser = (data) => setUser(u => ({ ...u, ...data }));

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const isSuperAdmin = user?.role === 'superadmin';
  const isIntern = user?.role === 'intern';

  if (!bootstrapped) return null;

  return (
    <AuthContext.Provider value={{
      user, login, logout, updateUser, loading,
      isAdmin, isSuperAdmin, isIntern, USE_MOCK, mockUsers: [],
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
