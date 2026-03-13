import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import MainLayout from '../../layouts/MainLayout';
import { usersAPI, departmentsAPI, positionsAPI, promotionRequestsAPI } from '../../api/auth';
import { Plus, Search, Pencil, Lock, X, Check, Ban, Send } from 'lucide-react';

const ROLE_LABELS = { intern: 'Стажёр', employee: 'Сотрудник', projectmanager: 'Проект-менеджер', admin: 'Администратор', superadmin: 'Суперадмин' };
const ROLE_BADGE  = { intern: 'badge-green', employee: 'badge-blue', projectmanager: 'badge-purple', admin: 'badge-blue', superadmin: 'badge-yellow' };
const ROLE_ICON   = { intern: '📖', admin: '🛡️', superadmin: '👑' };

function normalizeUser(raw) {
  return {
    id: raw.id,
    name: raw.full_name || `${raw.first_name || ''} ${raw.last_name || ''}`.trim() || raw.username,
    username: raw.username,
    email: raw.email || '',
    role: raw.role || 'intern',
    department: raw.department_name || '',
    departmentId: raw.department,
    position: raw.position_name || '',
    positionId: raw.position,
    phone: raw.phone || '',
    telegram: raw.telegram || '',
    status: raw.is_active === false ? 'blocked' : 'active',
  };
}

function normalizePromotion(raw) {
  return {
    id: raw.id,
    userId: raw.user || raw.user_id,
    userName: raw.user_name || raw.full_name || '—',
    status: raw.status || 'pending',
    createdAt: raw.created_at ? new Date(raw.created_at).toLocaleString('ru-RU') : '—',
    requestedBy: raw.requested_by_name || raw.created_by || '—',
    reason: raw.reason || raw.comment || '',
  };
}

export default function AdminUsers() {
  const { user, isSuperAdmin } = useAuth();
  const isAdminOrSuper = isSuperAdmin || user?.role === 'admin';

  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [promotionRequests, setPromotionRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterPosition, setFilterPosition] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({ name: '', username: '', email: '', phone: '', telegram: '', departmentId: '', positionId: '', role: 'intern', password: '', status: 'active' });

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const loadAll = () => {
    setLoading(true);
    Promise.all([
      usersAPI.list().then(r => setUsers((Array.isArray(r.data) ? r.data : r.data.results || []).map(normalizeUser))),
      departmentsAPI.list().then(r => setDepartments(Array.isArray(r.data) ? r.data : r.data.results || [])),
      positionsAPI.list().then(r => setPositions(Array.isArray(r.data) ? r.data : r.data.results || [])),
      promotionRequestsAPI.list().then(r => setPromotionRequests((Array.isArray(r.data) ? r.data : r.data.results || []).map(normalizePromotion))),
    ]).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { loadAll(); }, []);

  const baseUsers = isAdminOrSuper
    ? users.filter(u => u.role !== 'superadmin')
    : users.filter(u => u.role === 'intern');

  const filtered = baseUsers.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !search || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.department.toLowerCase().includes(q) || u.position.toLowerCase().includes(q);
    const matchRole = filterRole === 'all' || u.role === filterRole;
    const matchStatus = filterStatus === 'all' || u.status === filterStatus;
    const matchDept = filterDepartment === 'all' || u.department === filterDepartment;
    const matchPos = filterPosition === 'all' || u.position === filterPosition;
    return matchSearch && matchRole && matchStatus && matchDept && matchPos;
  });

  const openAdd = () => {
    setEditUser(null);
    setForm({ name: '', username: '', email: '', phone: '', telegram: '', departmentId: '', positionId: '', role: 'intern', password: '', status: 'active' });
    setShowModal(true);
  };

  const openEdit = (u) => {
    setEditUser(u);
    setForm({ name: u.name, username: u.username, email: u.email, phone: u.phone, telegram: u.telegram, departmentId: u.departmentId || '', positionId: u.positionId || '', role: u.role, password: '', status: u.status });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.email) return;
    setSaving(true);
    try {
      const [firstName, ...rest] = form.name.trim().split(' ');
      const payload = {
        first_name: firstName,
        last_name: rest.join(' '),
        email: form.email,
        phone: form.phone,
        telegram: form.telegram,
        department: form.departmentId || null,
        position: form.positionId || null,
        role: isSuperAdmin ? form.role : (editUser ? editUser.role : 'intern'),
        is_active: form.status === 'active',
      };
      if (!editUser && form.password) payload.password = form.password;
      if (!editUser) payload.username = form.username || form.email.split('@')[0];

      if (editUser) {
        const r = await usersAPI.update(editUser.id, payload);
        setUsers(us => us.map(u => u.id === editUser.id ? normalizeUser(r.data) : u));
        showToast('Пользователь обновлён');
      } else {
        const r = await usersAPI.create(payload);
        setUsers(us => [...us, normalizeUser(r.data)]);
        showToast(`Пользователь «${form.name}» создан`);
      }
      setShowModal(false);
    } catch (e) {
      const d = e.response?.data;
      const msg = d?.detail || d?.email?.[0] || d?.username?.[0] || 'Ошибка сохранения';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (u) => {
    try {
      await usersAPI.toggleStatus(u.id);
      setUsers(us => us.map(x => x.id === u.id ? { ...x, status: x.status === 'active' ? 'blocked' : 'active' } : x));
    } catch { showToast('Ошибка изменения статуса', 'error'); }
  };

  const pendingRequests = promotionRequests.filter(r => r.status === 'pending');
  const hasPendingForUser = (userId) => pendingRequests.some(r => r.userId === userId);

  const handleSendPromotion = async (intern) => {
    if (hasPendingForUser(intern.id)) { showToast(`По ${intern.name} уже есть заявка`, 'error'); return; }
    try {
      const r = await promotionRequestsAPI.create({ user: intern.id, reason: 'Стажировка завершена. Запрос на перевод в сотрудники.' });
      setPromotionRequests(rs => [normalizePromotion(r.data), ...rs]);
      showToast(`Заявка на перевод ${intern.name} отправлена`);
    } catch { showToast('Ошибка отправки заявки', 'error'); }
  };

  const handlePromoAction = async (reqId, action) => {
    try {
      await promotionRequestsAPI.action(reqId, action);
      setPromotionRequests(rs => rs.map(r => r.id === reqId ? { ...r, status: action === 'approve' ? 'approved' : 'rejected' } : r));
      if (action === 'approve') {
        const req = promotionRequests.find(r => r.id === reqId);
        if (req) setUsers(us => us.map(u => u.id === req.userId ? { ...u, role: 'employee' } : u));
        showToast('Заявка одобрена. Роль обновлена.');
      } else {
        showToast('Заявка отклонена', 'error');
      }
    } catch { showToast('Ошибка обработки заявки', 'error'); }
  };

  const deptOptions = Array.from(new Set(baseUsers.map(u => u.department).filter(Boolean)));
  const posOptions  = Array.from(new Set(baseUsers.map(u => u.position).filter(Boolean)));

  return (
    <MainLayout title="Админ-панель · Пользователи">
      <div className="page-header">
        <div>
          <div className="page-title">{isAdminOrSuper ? 'Сотрудники' : 'Управление пользователями'}</div>
          <div className="page-subtitle">{isAdminOrSuper ? 'Список сотрудников: отдел, должность и поиск.' : 'Администратор работает только со стажёрами.'}</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={15} /> Добавить пользователя</button>
      </div>

      {/* Promotion requests (superadmin only) */}
      {isSuperAdmin && pendingRequests.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <span className="card-title">Заявки стажёров на перевод в сотрудники</span>
            <span className="badge badge-blue">{pendingRequests.length} на рассмотрении</span>
          </div>
          <div className="card-body">
            {pendingRequests.map(req => (
              <div key={req.id} style={{ border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', padding: '12px 14px', marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{req.userName}</div>
                    <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>Отправлено: {req.createdAt}</div>
                    {req.reason && <div style={{ marginTop: 6, fontSize: 13, color: 'var(--gray-700)' }}>{req.reason}</div>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <button className="btn btn-primary btn-sm" onClick={() => handlePromoAction(req.id, 'approve')}><Check size={14} /> Одобрить</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => handlePromoAction(req.id, 'reject')}><Ban size={14} /> Отклонить</button>
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
                  {deptOptions.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select className="form-select" value={filterPosition} onChange={e => setFilterPosition(e.target.value)} style={{ minWidth: 190 }}>
                  <option value="all">Все должности</option>
                  {posOptions.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            )}
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
                <th>РОЛЬ</th>
                <th>СТАТУС</th>
                <th>ДЕЙСТВИЯ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--gray-400)' }}>Загрузка...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--gray-400)' }}>Пользователей не найдено</td></tr>
              ) : filtered.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="user-cell">
                      <div className="avatar" style={{ width: 34, height: 34, fontSize: 12 }}>
                        {u.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="user-cell-name">{u.name}</div>
                        <div className="user-cell-email">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: 13 }}>{u.position || '—'}</td>
                  <td style={{ fontSize: 13 }}>{u.department || '—'}</td>
                  <td>
                    <span className={`badge ${ROLE_BADGE[u.role] || 'badge-gray'}`}>
                      {ROLE_ICON[u.role] && <span style={{ marginRight: 2 }}>{ROLE_ICON[u.role]}</span>}
                      {ROLE_LABELS[u.role] || u.role}
                    </span>
                  </td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                      <span className={`status-dot ${u.status === 'active' ? 'green' : 'red'}`} />
                      {u.status === 'active' ? 'Активен' : 'Заблокирован'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn-icon" title="Редактировать" onClick={() => openEdit(u)}><Pencil size={14} /></button>
                      {!isSuperAdmin && u.role === 'intern' && (
                        <button className="btn-icon" title={hasPendingForUser(u.id) ? 'Заявка уже отправлена' : 'Запрос на перевод'}
                          onClick={() => handleSendPromotion(u)} disabled={hasPendingForUser(u.id)}
                          style={{ color: hasPendingForUser(u.id) ? 'var(--gray-300)' : 'var(--primary)' }}>
                          <Send size={14} />
                        </button>
                      )}
                      {isSuperAdmin && (
                        <button className="btn-icon" title={u.status === 'active' ? 'Заблокировать' : 'Разблокировать'}
                          onClick={() => toggleStatus(u)}
                          style={{ color: u.status === 'active' ? 'var(--danger)' : 'var(--success)' }}>
                          <Lock size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '12px 20px', fontSize: 13, color: 'var(--gray-500)', borderTop: '1px solid var(--gray-200)' }}>
          Показано {filtered.length} из {baseUsers.length} пользователей
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editUser ? 'Редактирование пользователя' : 'Добавление пользователя'}</div>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="modal-section-label">ОСНОВНАЯ ИНФОРМАЦИЯ</div>
              <div className="grid-2" style={{ marginBottom: 12 }}>
                <div className="form-group">
                  <label className="form-label">Фамилия Имя</label>
                  <input className="form-input" placeholder="Иванов Иван" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" placeholder="example@vpluse.kg" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
              </div>
              {!editUser && (
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label className="form-label">Логин (username)</label>
                  <input className="form-input" placeholder="ivanov_ivan" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
                </div>
              )}
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
              <div className="grid-2" style={{ marginBottom: 12 }}>
                <div className="form-group">
                  <label className="form-label">Отдел</label>
                  <select className="form-select" value={form.departmentId} onChange={e => setForm(f => ({ ...f, departmentId: e.target.value }))}>
                    <option value="">Выберите отдел</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Должность</label>
                  <select className="form-select" value={form.positionId} onChange={e => setForm(f => ({ ...f, positionId: e.target.value }))}>
                    <option value="">Выберите должность</option>
                    {positions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="modal-section-label">РОЛЬ И ДОСТУП</div>
              <div className="grid-2" style={{ marginBottom: 12 }}>
                <div className="form-group">
                  <label className="form-label">Роль в системе</label>
                  <select className="form-select" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} disabled={!isSuperAdmin}>
                    <option value="intern">Стажёр</option>
                    <option value="employee">Сотрудник</option>
                    <option value="projectmanager">Проект-менеджер</option>
                    <option value="admin">Администратор</option>
                    {isSuperAdmin && <option value="superadmin">Суперадмин</option>}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Статус</label>
                  <select className="form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    <option value="active">Активен</option>
                    <option value="blocked">Заблокирован</option>
                  </select>
                </div>
              </div>

              {!editUser && (
                <>
                  <div className="modal-section-label">ПАРОЛЬ</div>
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Пароль</label>
                      <input className="form-input" type="password" placeholder="Задайте пароль" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Отмена</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Сохранение...' : editUser ? 'Сохранить изменения' : 'Создать пользователя'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}>
          <div>
            <div className="toast-title">{toast.type === 'error' ? 'Ошибка' : 'Успешно'}</div>
            <div className="toast-msg">{toast.msg}</div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
