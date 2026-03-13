import MainLayout from '../../layouts/MainLayout';
import { useState, useEffect } from 'react';
import { usersAPI } from '../../api/auth';

const MODULES = [
  { id: 'content',    label: 'Контент (Главная, Инструкция, Регламенты)', desc: 'Новости, приветственные блоки, инструкции, регламенты.',         options: ['CRUD', 'Только просмотр'],                                       def: 'CRUD' },
  { id: 'onboarding', label: 'Онбординг / Отчёты',                        desc: 'Дни стажировки, дедлайны, статусы отчётов, комментарии.',         options: ['Управление днями и контентом', 'Проверка отчётов'],              def: 'Управление днями и контентом', extra: 'Проверка отчётов' },
  { id: 'users',      label: 'Пользователи',                               desc: 'Работа только со стажёрами, без доступа к администраторам.',      options: ['Стажёры (создание / деактивация)', 'Администраторы'],           def: 'Стажёры (создание / деактивация)' },
  { id: 'schedules',  label: 'Графики работы',                             desc: 'Типовые графики и назначение графиков стажёрам.',                 options: ['Типовые графики', 'Управление календарём'],                     def: 'Типовые графики' },
  { id: 'feedback',   label: 'Обратная связь',                             desc: 'Очередь обращений, статусы, типы жалоб и предложений.',          options: ['Просмотр и обработка обращений'],                               def: 'Просмотр и обработка обращений' },
  { id: 'system',     label: 'Система, безопасность, интерфейс',           desc: 'Доступ только у суперадмина, для админа всегда выключено.',       options: ['Система и безопасность', 'Настройки интерфейса'],               def: null },
];

export default function AdminOverview() {
  const [admins, setAdmins] = useState([]);
  const [selectedAdmin, setSelectedAdmin] = useState(null);

  useEffect(() => {
    usersAPI.list({ role: 'admin' })
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : res.data.results || [];
        const normalized = data.map(u => ({
          id: u.id,
          name: u.full_name || u.username,
          role: u.role,
        }));
        setAdmins(normalized);
        if (normalized.length > 0) setSelectedAdmin(normalized[0]);
      })
      .catch(() => {});
  }, []);
  const [moduleState, setModuleState] = useState({});
  const visibleModules = MODULES.filter((m) => {
    if (m.id !== 'system') return true;
    return selectedAdmin?.role === 'superadmin';
  });

  return (
    <MainLayout title="Админ-панель">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div className="page-title">Обзор ролей и прав доступа</div>
          <div className="page-subtitle">Управление пользователями, ролями, модулями и системными настройками платформы.</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span className="badge badge-purple" style={{ marginBottom: 6, display: 'block' }}>
            🛡️ Полный доступ · Суперадминистратор
          </span>
          <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>
            Активных: — · Стажёров: —
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: 24 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Ролевой доступ (RBAC)</span>
            <span className="badge badge-gray">3 роли</span>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { name: 'Стажёр',                      icon: '📖', desc: 'Онбординг, регламенты, отчёты, профиль, инструкция.',                      badge: 'Только просмотр + свои отчёты',   color: '#D1FAE5' },
              { name: 'Администратор / Проверяющий', icon: '🛡️', desc: 'Операционная работа с контентом, онбордингом, стажёрами.',               badge: 'Набор модулей по чек-боксам',     color: '#DBEAFE' },
              { name: 'Суперадминистратор',           icon: '👑', desc: 'Роли, права, система, безопасность, структура интерфейса.',               badge: 'Полный контроль платформы',       color: '#FEF9C3' },
            ].map(role => (
              <div key={role.name} style={{ border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', padding: '12px 14px', background: role.color + '40' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 16 }}>{role.icon}</span>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{role.name}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 6 }}>{role.desc}</div>
                <span className="badge badge-gray" style={{ fontSize: 11 }}>{role.badge}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Модули и права администратора</span>
          </div>
          <div className="card-body">
            <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 12 }}>
              Суперадмин настраивает доступ к модулям для каждого администратора отдельно.
            </div>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Выбранный администратор</label>
              <select className="form-select" value={selectedAdmin?.id}
                onChange={e => setSelectedAdmin(admins.find(a => a.id == e.target.value))}>
                {admins.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} · {a.role === 'superadmin' ? 'Суперадминистратор' : 'Администратор'}
                  </option>
                ))}
              </select>
            </div>
            {visibleModules.map(mod => {
              return (
                <div key={mod.id} style={{ borderBottom: '1px solid var(--gray-100)', paddingBottom: 10, marginBottom: 10 }}>
                  <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 2 }}>{mod.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--gray-400)', marginBottom: 6 }}>{mod.desc}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {mod.options.map(opt => {
                      const key = mod.id + '_' + opt;
                      const defaultVal = opt === mod.def || opt === mod.extra;
                      const checked = moduleState[key] !== undefined ? moduleState[key] : defaultVal;
                      return (
                        <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 12 }}>
                          <input type="checkbox" checked={!!checked}
                            onChange={() => setModuleState(s => ({ ...s, [key]: !checked }))} />
                          <span style={{ background: 'var(--gray-100)', padding: '2px 8px', borderRadius: 20 }}>{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-header"><span className="card-title">Быстрый доступ к модулям</span></div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { label: 'Пользователи', icon: '👥', count: null },
              { label: 'Роли и права',  icon: '🛡️', count: null },
              { label: 'Контент',       icon: '📰', count: null },
              { label: 'Онбординг',     icon: '🎓', count: null },
            ].map(item => (
              <div key={item.label} style={{ border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>{item.icon}</span>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{item.label}</div>
                  {item.count && <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{item.count} записей</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
