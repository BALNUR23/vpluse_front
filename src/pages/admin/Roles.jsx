import { useEffect, useMemo, useState } from 'react';
import MainLayout from '../../layouts/MainLayout';
import { usersAPI } from '../../api/auth';

const ROLE_META = {
  superadmin: {
    label: 'Суперадмин',
    icon: 'SA',
    desc: 'Полный доступ ко всей системе, включая системные разделы.',
    perms: ['Все права', 'Система/Безопасность', 'Интерфейс'],
  },
  admin: {
    label: 'Админ',
    icon: 'AD',
    desc: 'Почти полный доступ, кроме системных разделов.',
    perms: ['Пользователи', 'Роли', 'Контент', 'Графики', 'Обратная связь'],
  },
  department_head: {
    label: 'Руководитель отдела',
    icon: 'RO',
    desc: 'Управление сотрудниками своего отдела и операционными процессами.',
    perms: ['Пользователи отдела', 'Графики', 'Обратная связь'],
  },
  projectmanager: {
    label: 'Тимлид',
    icon: 'TL',
    desc: 'Управление задачами команды и просмотр отчетов подчиненных.',
    perms: ['Задачи команды', 'Отчеты команды'],
  },
  employee: {
    label: 'Сотрудник',
    icon: 'EM',
    desc: 'Работа в личном кабинете: задачи, график, отчеты.',
    perms: ['Личный кабинет', 'Задачи', 'График'],
  },
  intern: {
    label: 'Стажер',
    icon: 'IN',
    desc: 'Прохождение программы адаптации и отчеты стажировки.',
    perms: ['Онбординг', 'Отчеты'],
  },
};

function extractErrorMessage(e, fallback) {
  const data = e?.response?.data;
  if (!data) return fallback;
  if (typeof data.detail === 'string') return data.detail;
  if (typeof data === 'string') return data;
  if (typeof data === 'object') {
    const firstKey = Object.keys(data)[0];
    const firstVal = data[firstKey];
    if (Array.isArray(firstVal) && firstVal.length) return String(firstVal[0]);
    if (typeof firstVal === 'string') return firstVal;
  }
  return fallback;
}

export default function AdminRoles() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const usersRes = await usersAPI.list();
      const nextUsers = Array.isArray(usersRes?.data) ? usersRes.data : [];
      setUsers(nextUsers);
    } catch (e) {
      setError(extractErrorMessage(e, 'Не удалось загрузить данные страницы.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const roleCards = useMemo(() => {
    const counts = users.reduce((acc, user) => {
      const key = user.role || 'employee';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(ROLE_META).map(([id, meta]) => ({
      id,
      ...meta,
      count: counts[id] || 0,
    }));
  }, [users]);

  return (
    <MainLayout title="Роли и права">
      <div className="page-header">
        <div>
          <div className="page-title">Роли и права доступа</div>
          <div className="page-subtitle">Сводка по ролям в системе</div>
        </div>
      </div>

      {error && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="card-body" style={{ color: '#b91c1c' }}>{error}</div>
        </div>
      )}
      {loading && <div className="card"><div className="card-body">Загрузка...</div></div>}

      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {roleCards.map((role) => (
            <div key={role.id} className="card">
              <div className="card-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{role.icon}</span>
                  <span style={{ fontWeight: 700, fontSize: 16 }}>{role.label}</span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 14, lineHeight: 1.5 }}>{role.desc}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                  {role.perms.map((perm) => (
                    <span key={perm} className="badge badge-blue" style={{ fontSize: 11 }}>{perm}</span>
                  ))}
                </div>
                <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>Пользователей: {role.count}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </MainLayout>
  );
}
