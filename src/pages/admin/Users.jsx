import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import MainLayout from '../../layouts/MainLayout';
import { USERS } from '../../data/mockData';
import { Plus, Search, Pencil, Trash2, BarChart2, Lock, X, Check, Ban, Send } from 'lucide-react';
import { upsertCustomMockUser } from '../../utils/mockUsers';

const ROLE_LABELS = { intern: 'Стажёр', employee: 'Сотрудник', projectmanager: 'Проект-менеджер', admin: 'Администратор', superadmin: 'Суперадмин' };
const ROLE_BADGE = { intern: 'badge-green', employee: 'badge-blue', projectmanager: 'badge-purple', admin: 'badge-blue', superadmin: 'badge-yellow' };
const ROLE_ICON = { intern: '📖', admin: '🛡️', superadmin: '👑' };
const PROMOTION_REQUESTS_KEY = 'vpluse_promotion_requests';

export default function AdminUsers() {
  const { user, isSuperAdmin } = useAuth();
  const isAdminOrSuper = isSuperAdmin || user?.role === 'admin';
  const allowedPositions = isSuperAdmin
    ? ['Стажёр', 'Frontend-разработчик', 'Менеджер продаж', 'Руководитель отдела']
    : ['Стажёр'];
  const [users, setUsers] = useState(USERS);
  const [search, setSearch] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterPosition, setFilterPosition] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', telegram: '', department: '', position: '', role: 'intern', password: '', status: 'active' });
  const [promotionRequests, setPromotionRequests] = useState(() => {
    try {
      const raw = localStorage.getItem(PROMOTION_REQUESTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(PROMOTION_REQUESTS_KEY, JSON.stringify(promotionRequests));
  }, [promotionRequests]);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const baseUsers = isAdminOrSuper
    ? users.filter(u => u.role !== 'superadmin')
    : users.filter(u => u.role === 'intern');
  const departmentOptions = Array.from(new Set(baseUsers.map(u => u.department).filter(Boolean)));
  const positionOptions = Array.from(new Set(baseUsers.map(u => u.position).filter(Boolean)));

  const filtered = baseUsers.filter(u => {
    const matchSearch = !search
      || u.name.toLowerCase().includes(search.toLowerCase())
      || u.email.toLowerCase().includes(search.toLowerCase())
      || (u.department || '').toLowerCase().includes(search.toLowerCase())
      || (u.position || '').toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'all' || u.role === filterRole;
    const matchStatus = filterStatus === 'all' || u.status === filterStatus;
    const matchDepartment = filterDepartment === 'all' || u.department === filterDepartment;
    const matchPosition = filterPosition === 'all' || u.position === filterPosition;
    return matchSearch && matchRole && matchStatus && matchDepartment && matchPosition;
  });

  const openAdd = () => {
    setEditUser(null);
    setForm({
      name: '',
      email: '',
      phone: '',
      telegram: '',
      department: '',
      position: isSuperAdmin ? '' : 'Стажёр',
      role: 'intern',
      password: '',
      status: 'active',
    });
    setShowModal(true);
  };
  const openEdit = (u) => { setEditUser(u); setForm({ name: u.name, email: u.email, phone: u.phone || '', telegram: u.telegram || '', department: u.department || '', position: u.position || '', role: u.role, password: '', status: u.status }); setShowModal(true); };
  
  const handleSave = () => {
    if (!form.name || !form.email || !form.department || !form.position) return;
    if (editUser) {
      const payload = isSuperAdmin ? form : { ...form, role: editUser.role };
      setUsers(us => us.map(u => u.id === editUser.id ? { ...u, ...payload } : u));
      upsertCustomMockUser({
        id: editUser.id,
        name: payload.name,
        email: payload.email,
        login: payload.email,
        username: payload.email,
        role: payload.role,
        roleLabel: ROLE_LABELS[payload.role] || payload.role,
        department: payload.department,
        department_name: payload.department,
        position: payload.position,
        position_name: payload.position,
        phone: payload.phone,
        telegram: payload.telegram,
        status: payload.status,
        password: form.password || '1234',
      });
      showToast('Пользователь обновлён');
    } else {
      const newUser = {
        ...form,
        role: isSuperAdmin ? form.role : 'intern',
        position: isSuperAdmin ? form.position : 'Стажёр',
        id: Date.now()
      };
      setUsers(us => [...us, newUser]);
      upsertCustomMockUser({
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        login: newUser.email,
        username: newUser.email,
        role: newUser.role,
        roleLabel: ROLE_LABELS[newUser.role] || newUser.role,
        department: newUser.department,
        department_name: newUser.department,
        position: newUser.position,
        position_name: newUser.position,
        phone: newUser.phone,
        telegram: newUser.telegram,
        status: newUser.status,
        password: form.password || '1234',
      });
      showToast(`Пользователь «${form.name}» успешно добавлен.`);
    }
    setShowModal(false);
  };

  const toggleStatus = (id) => {
    setUsers(us => us.map(u => u.id === id ? { ...u, status: u.status === 'active' ? 'blocked' : 'active' } : u));
  };

  const pendingRequests = promotionRequests.filter(r => r.status === 'pending');
  const hasPendingForUser = (userId) => pendingRequests.some(r => r.userId === userId);

  const handleSendPromotionRequest = (internUser) => {
    if (internUser.role !== 'intern') return;
    if (hasPendingForUser(internUser.id)) {
      showToast(`По ${internUser.name} уже есть заявка на рассмотрении.`, 'error');
      return;
    }
    const req = {
      id: Date.now(),
      userId: internUser.id,
      userName: internUser.name,
      status: 'pending',
      createdAt: new Date().toLocaleString('ru-RU'),
      requestedBy: user?.name || 'Администратор',
      requestedByRole: user?.role || 'admin',
      reason: 'Стажировка завершена. Запрос на перевод в сотрудники.',
    };
    setPromotionRequests(rs => [req, ...rs]);
    showToast(`Заявка на перевод ${internUser.name} отправлена суперадминистратору.`);
  };

  const handleApprovePromotion = (requestId) => {
    const req = promotionRequests.find(r => r.id === requestId);
    if (!req) return;
    setPromotionRequests(rs => rs.map(r => r.id === requestId ? { ...r, status: 'approved', reviewedAt: new Date().toISOString() } : r));
    setUsers(us => us.map(u => u.id === req.userId ? { ...u, role: 'employee' } : u));
    showToast(`Заявка от ${req.userName} одобрена. Роль обновлена на "Сотрудник".`);
  };

  const handleRejectPromotion = (requestId) => {
    const req = promotionRequests.find(r => r.id === requestId);
    if (!req) return;
    setPromotionRequests(rs => rs.map(r => r.id === requestId ? { ...r, status: 'rejected', reviewedAt: new Date().toISOString() } : r));
    showToast(`Заявка от ${req.userName} отклонена.`, 'error');
  };

  return (
    <MainLayout title="Админ-панель · Пользователи">
      <div className="page-header">
        <div>
          <div className="page-title">{isAdminOrSuper ? 'Сотрудники' : 'Управление пользователями'}</div>
          <div className="page-subtitle">
            {isAdminOrSuper
              ? 'Список сотрудников: отдел, должность и поиск.'
              : 'Администратор работает только со стажёрами.'}
          </div>
        </div>
        {!isAdminOrSuper && <button className="btn btn-primary" onClick={openAdd}><Plus size={15} /> Добавить пользователя</button>}
      </div>

      {isSuperAdmin && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <span className="card-title">Заявки стажёров на перевод в сотрудники</span>
            <span className="badge badge-blue">{pendingRequests.length} на рассмотрении</span>
          </div>
          <div className="card-body">
            {pendingRequests.length === 0 && (
              <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>Новых заявок нет.</div>
            )}
            {pendingRequests.map(req => (
              <div key={req.id} style={{ border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', padding: '12px 14px', marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{req.userName}</div>
                    <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>Отправлено: {req.createdAt || '—'}</div>
                    <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>Инициатор: {req.requestedBy || '—'}</div>
                    {req.reason && <div style={{ marginTop: 6, fontSize: 13, color: 'var(--gray-700)' }}>{req.reason}</div>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <button className="btn btn-primary btn-sm" onClick={() => handleApprovePromotion(req.id)}><Check size={14} /> Одобрить</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleRejectPromotion(req.id)}><Ban size={14} /> Отклонить</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body" style={{ padding: '14px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
              <input className="form-input" style={{ paddingLeft: 32 }} placeholder="Поиск по имени, email или должности..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            {isAdminOrSuper && (
              <div style={{ display: 'flex', gap: 8 }}>
                <select className="form-select" value={filterDepartment} onChange={e => setFilterDepartment(e.target.value)} style={{ minWidth: 170 }}>
                  <option value="all">Все отделы</option>
                  {departmentOptions.map(dep => <option key={dep} value={dep}>{dep}</option>)}
                </select>
                <select className="form-select" value={filterPosition} onChange={e => setFilterPosition(e.target.value)} style={{ minWidth: 190 }}>
                  <option value="all">Все должности</option>
                  {positionOptions.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                </select>
              </div>
            )}
            {!isAdminOrSuper && <div style={{ display: 'flex', gap: 8 }}>
              {(isSuperAdmin
                ? ['all', 'employee', 'admin', 'intern', 'blocked']
                : ['all', 'intern', 'blocked']
              ).map(f => {
                const labels = {
                  all: 'Все',
                  employee: 'Сотрудники',
                  admin: 'Администраторы',
                  intern: 'Стажёры',
                  blocked: 'Заблокированные',
                };
                const dots = {
                  all: '',
                  employee: '#16A34A',
                  admin: '#3B82F6',
                  intern: '#22C55E',
                  blocked: '#EF4444',
                };
                return (
                  <button key={f} onClick={() => { if (f === 'blocked') setFilterStatus(filterStatus === 'blocked' ? 'all' : 'blocked'); else { setFilterRole(filterRole === f ? 'all' : f); setFilterStatus('all'); } }}
                    style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid var(--gray-200)', background: (filterRole === f || (f === 'blocked' && filterStatus === 'blocked')) ? 'var(--gray-100)' : 'transparent', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 500, color: 'var(--gray-700)' }}>
                    {dots[f] && <span style={{ width: 8, height: 8, borderRadius: '50%', background: dots[f], display: 'inline-block' }} />}
                    {labels[f]}
                  </button>
                );
              })}
              <button className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                Фильтры
              </button>
            </div>}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ПОЛЬЗОВАТЕЛЬ</th>
                <th>ДОЛЖНОСТЬ</th>
                <th>ОТДЕЛ</th>
                {!isAdminOrSuper && <th>РОЛЬ</th>}
                {!isAdminOrSuper && <th>СТАТУС</th>}
                {!isAdminOrSuper && <th>ДЕЙСТВИЯ</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="user-cell">
                      <div className="avatar" style={{ width: 34, height: 34, fontSize: 12 }}>
                        {u.name.split(' ').map(p => p[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <div className="user-cell-name">{u.name}</div>
                        <div className="user-cell-email">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{u.position}</div>
                  </td>
                  <td><div style={{ fontSize: 13, fontWeight: 500 }}>{u.department}</div></td>
                  {!isAdminOrSuper && (
                    <td>
                      <span className={`badge ${ROLE_BADGE[u.role] || 'badge-gray'}`}>
                        {ROLE_ICON[u.role] && <span style={{ marginRight: 2 }}>{ROLE_ICON[u.role]}</span>}
                        {ROLE_LABELS[u.role] || u.role}
                      </span>
                    </td>
                  )}
                  {!isAdminOrSuper && (
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                        <span className={`status-dot ${u.status === 'active' ? 'green' : 'red'}`} />
                        {u.status === 'active' ? 'Активен' : 'Заблокирован'}
                      </span>
                    </td>
                  )}
                  {!isAdminOrSuper && (
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {u.role !== 'superadmin' && (
                          <>
                            <button className="btn-icon" title="Редактировать" onClick={() => openEdit(u)}><Pencil size={14} /></button>
                            <button className="btn-icon" title="Статистика"><BarChart2 size={14} /></button>
                            {!isSuperAdmin && u.role === 'intern' && (
                              <button
                                className="btn-icon"
                                title={hasPendingForUser(u.id) ? 'Заявка уже отправлена' : 'Отправить запрос суперадмину'}
                                onClick={() => handleSendPromotionRequest(u)}
                                disabled={hasPendingForUser(u.id)}
                                style={{ color: hasPendingForUser(u.id) ? 'var(--gray-300)' : 'var(--primary)' }}
                              >
                                <Send size={14} />
                              </button>
                            )}
                            {isSuperAdmin && (
                              <button className="btn-icon" title={u.status === 'active' ? 'Заблокировать' : 'Разблокировать'} onClick={() => toggleStatus(u.id)} style={{ color: u.status === 'active' ? 'var(--danger)' : 'var(--success)' }}>
                                <Lock size={14} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '12px 20px', fontSize: 13, color: 'var(--gray-500)', borderTop: '1px solid var(--gray-200)' }}>
          Показано 1–{filtered.length} из {baseUsers.length} пользователей
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editUser ? 'Редактирование пользователя' : 'Добавление нового пользователя'}</div>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="modal-section-label">ОСНОВНАЯ ИНФОРМАЦИЯ</div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div className="avatar" style={{ width: 56, height: 56, fontSize: 18, border: '2px solid var(--gray-200)' }}>
                  {form.name ? form.name.split(' ').map(p => p[0]).join('').slice(0, 2) : '?'}
                </div>
                <button className="btn btn-secondary btn-sm">Загрузить фото</button>
                {editUser && <button className="btn btn-sm" style={{ color: 'var(--danger)', background: 'none' }}>Удалить</button>}
              </div>

              <div className="grid-2" style={{ marginBottom: 12 }}>
                <div className="form-group">
                  <label className="form-label">Фамилия Имя</label>
                  <input className="form-input" placeholder="Иванов Иван" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email (Логин)</label>
                  <input className="form-input" placeholder="example@vpluse.kg" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
              </div>
              <div className="grid-2" style={{ marginBottom: 12 }}>
                <div className="form-group">
                  <label className="form-label">Телефон</label>
                  <input className="form-input" placeholder="+996 ..." value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Telegram</label>
                  <input className="form-input" placeholder="@username" value={form.telegram} onChange={e => setForm(f => ({ ...f, telegram: e.target.value }))} />
                </div>
              </div>
              <div className="grid-2" style={{ marginBottom: 16 }}>
                <div className="form-group">
                  <label className="form-label">Отдел</label>
                  <select className="form-select" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}>
                    <option value="">Выберите отдел</option>
                    <option>Разработка</option><option>Продажи</option><option>Маркетинг</option><option>HR</option><option>Логистика</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Должность</label>
                  <select className="form-select" value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} disabled={!isSuperAdmin}>
                    <option value="">Выберите должность</option>
                    {allowedPositions.map(pos => <option key={pos}>{pos}</option>)}
                  </select>
                  {!isSuperAdmin && <div style={{ marginTop: 4, fontSize: 11, color: 'var(--gray-500)' }}>Для администратора доступна только должность «Стажёр».</div>}
                </div>
              </div>

              {editUser
                ? <div className="modal-section-label">РОЛЬ И ПРАВА ДОСТУПА</div>
                : <div className="modal-section-label">НАСТРОЙКА ДОСТУПА</div>
              }

              {!editUser && (
                <div className="grid-2" style={{ marginBottom: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Пароль</label>
                    <input className="form-input" type="password" placeholder="Задайте пароль" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Повторите пароль</label>
                    <input className="form-input" type="password" placeholder="Повторите пароль" />
                  </div>
                </div>
              )}

              <div className="modal-section-label">РОЛЬ В СИСТЕМЕ</div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Роль в системе</label>
                  <select className="form-select" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} disabled={!isSuperAdmin}>
                    <option value="intern">Стажёр</option>
                    <option value="employee">Сотрудник</option>
                    <option value="projectmanager">Проект-менеджер</option>
                    <option value="admin">Администратор</option>
                    {isSuperAdmin && <option value="superadmin">Суперадмин</option>}
                  </select>
                  {!isSuperAdmin && <div style={{ marginTop: 4, fontSize: 11, color: 'var(--gray-500)' }}>Администратор может создавать только стажёров.</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Статус учётной записи</label>
                  <select className="form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    <option value="active">Активен</option>
                    <option value="blocked">Заблокирован</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Отмена</button>
              <button className="btn btn-primary" onClick={handleSave}>
                {editUser ? 'Сохранить изменения' : 'Создать пользователя'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast toast-success">
          <div>
            <div className="toast-title">Успешно</div>
            <div className="toast-msg">{toast.msg}</div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
