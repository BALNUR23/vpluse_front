import { useRef, useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import MainLayout from '../../layouts/MainLayout';
import { Plus, Trash2, Camera, Save, Check, Eye, EyeOff } from 'lucide-react';
import { authAPI, departmentsAPI, subdivisionsAPI, positionsAPI } from '../../api/auth';

const ROLE_META = {
  intern:         { label: 'Стажёр',             color: '#2563EB', bg: 'linear-gradient(135deg,#DBEAFE,#EDE9FE)' },
  employee:       { label: 'Сотрудник',          color: '#16A34A', bg: 'linear-gradient(135deg,#D1FAE5,#DBEAFE)' },
  projectmanager: { label: 'Проект-менеджер',    color: '#7C3AED', bg: 'linear-gradient(135deg,#EDE9FE,#FEE2E2)' },
  admin:          { label: 'Администратор',      color: '#EA580C', bg: 'linear-gradient(135deg,#FED7AA,#FEF9C3)' },
  superadmin:     { label: 'Суперадминистратор', color: '#BE123C', bg: 'linear-gradient(135deg,#FECDD3,#FED7AA)' },
};

// ── SuperAdmin: manage departments, subdivisions & positions ──────────────
function OrgSection() {
  const [departments,  setDepts]  = useState([]);
  const [subdivisions, setSubs]   = useState([]);
  const [positions,    setPos]    = useState([]);
  const [tab,    setTab]    = useState('depts');
  const [newName, setNew]   = useState('');
  const [newDeptId, setNDI] = useState('');
  const [toast,  setToast]  = useState(null);

  const showToast = (msg, type='success') => { setToast({msg,type}); setTimeout(()=>setToast(null),2000); };

  const load = () => {
    departmentsAPI.list().then(r => setDepts(Array.isArray(r.data) ? r.data : r.data.results || [])).catch(()=>{});
    subdivisionsAPI.list().then(r => setSubs(Array.isArray(r.data) ? r.data : r.data.results || [])).catch(()=>{});
    positionsAPI.list().then(r => setPos(Array.isArray(r.data) ? r.data : r.data.results || [])).catch(()=>{});
  };

  useEffect(() => { load(); }, []);

  const addDept = async () => {
    if (!newName.trim()) return;
    try {
      const r = await departmentsAPI.create({ name: newName.trim() });
      setDepts(d => [...d, r.data]);
      setNew('');
      showToast('Отдел добавлен');
    } catch { showToast('Ошибка', 'error'); }
  };

  const delDept = async (id) => {
    try {
      await departmentsAPI.delete(id);
      setDepts(d => d.filter(x => x.id !== id));
      showToast('Удалено');
    } catch { showToast('Ошибка удаления', 'error'); }
  };

  const addSub = async () => {
    if (!newName.trim() || !newDeptId) return;
    try {
      const r = await subdivisionsAPI.create({ name: newName.trim(), department_id: Number(newDeptId) });
      setSubs(s => [...s, r.data]);
      setNew('');
      showToast('Подразделение добавлено');
    } catch { showToast('Ошибка', 'error'); }
  };

  const delSub = async (id) => {
    try {
      await subdivisionsAPI.delete(id);
      setSubs(s => s.filter(x => x.id !== id));
      showToast('Удалено');
    } catch { showToast('Ошибка удаления', 'error'); }
  };

  const addPos = async () => {
    if (!newName.trim()) return;
    try {
      const r = await positionsAPI.create({ name: newName.trim(), department_id: newDeptId ? Number(newDeptId) : undefined });
      setPos(p => [...p, r.data]);
      setNew('');
      showToast('Должность добавлена');
    } catch { showToast('Ошибка', 'error'); }
  };

  const delPos = async (id) => {
    try {
      await positionsAPI.delete(id);
      setPos(p => p.filter(x => x.id !== id));
      showToast('Удалено');
    } catch { showToast('Ошибка удаления', 'error'); }
  };

  const items     = tab === 'depts' ? departments : tab === 'subs' ? subdivisions : positions;
  const onAdd     = tab === 'depts' ? addDept : tab === 'subs' ? addSub : addPos;
  const onDel     = tab === 'depts' ? delDept : tab === 'subs' ? delSub : delPos;
  const needsDept = tab !== 'depts';

  return (
    <div className="card" style={{ marginTop: 20 }}>
      <div className="card-header">
        <span className="card-title">🏢 Структура компании</span>
      </div>
      <div className="card-body">
        <div className="tabs" style={{ marginBottom: 16 }}>
          <button className={`tab-btn ${tab==='depts'?'active':''}`} onClick={()=>{setTab('depts');setNew('');}}>Отделы ({departments.length})</button>
          <button className={`tab-btn ${tab==='subs'?'active':''}`}  onClick={()=>{setTab('subs');setNew('');}}>Подразделения ({subdivisions.length})</button>
          <button className={`tab-btn ${tab==='pos'?'active':''}`}   onClick={()=>{setTab('pos');setNew('');}}>Должности ({positions.length})</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginBottom: 16 }}>
          {items.map(item => (
            <div key={item.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 12px', background:'var(--gray-50)', borderRadius:'var(--radius)', border:'1px solid var(--gray-200)' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{item.name}</div>
                {item.department_name && <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{item.department_name}</div>}
              </div>
              <button onClick={() => onDel(item.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--danger)', padding:2 }}><Trash2 size={13}/></button>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <input className="form-input" placeholder={`Название${tab==='depts'?' отдела':tab==='subs'?' подразделения':' должности'}`}
            value={newName} onChange={e => setNew(e.target.value)} onKeyDown={e => e.key==='Enter' && onAdd()} style={{ flex: 1 }} />
          {needsDept && (
            <select className="form-select" value={newDeptId} onChange={e => setNDI(e.target.value)} style={{ width: 180 }}>
              <option value="">Отдел</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          )}
          <button className="btn btn-primary btn-sm" onClick={onAdd}><Plus size={14}/> Добавить</button>
        </div>

        {toast && (
          <div style={{ marginTop: 10, fontSize: 13, color: toast.type === 'error' ? 'var(--danger)' : 'var(--success)' }}>{toast.msg}</div>
        )}
      </div>
    </div>
  );
}

// ── Password Change Section ───────────────────────────────────────────────
function PasswordSection() {
  const [form, setForm] = useState({ old_password: '', new_password: '', confirm: '' });
  const [show, setShow] = useState(false);
  const [msg, setMsg]   = useState(null);
  const [saving, setSaving] = useState(false);

  const handleChange = async (e) => {
    e.preventDefault();
    if (form.new_password !== form.confirm) { setMsg({ text: 'Пароли не совпадают', type: 'error' }); return; }
    if (form.new_password.length < 6) { setMsg({ text: 'Минимум 6 символов', type: 'error' }); return; }
    setSaving(true);
    try {
      await authAPI.changePassword({ old_password: form.old_password, new_password: form.new_password });
      setMsg({ text: 'Пароль успешно изменён', type: 'success' });
      setForm({ old_password: '', new_password: '', confirm: '' });
      setTimeout(() => setMsg(null), 3000);
    } catch (err) {
      const d = err.response?.data;
      setMsg({ text: d?.old_password?.[0] || d?.new_password?.[0] || d?.detail || 'Ошибка изменения пароля', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card" style={{ marginTop: 20 }}>
      <div className="card-header"><span className="card-title">🔒 Смена пароля</span></div>
      <div className="card-body">
        <form onSubmit={handleChange}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { key: 'old_password', label: 'Текущий пароль' },
              { key: 'new_password', label: 'Новый пароль' },
              { key: 'confirm',      label: 'Повторите новый пароль' },
            ].map(({ key, label }) => (
              <div className="form-group" key={key}>
                <label className="form-label">{label}</label>
                <div style={{ position: 'relative' }}>
                  <input className="form-input" type={show ? 'text' : 'password'} value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder="••••••••" style={{ paddingRight: 36 }} />
                  <button type="button" onClick={() => setShow(s => !s)}
                    style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--gray-400)' }}>
                    {show ? <EyeOff size={15}/> : <Eye size={15}/>}
                  </button>
                </div>
              </div>
            ))}
          </div>
          {msg && (
            <div style={{ marginTop: 10, fontSize: 13, color: msg.type === 'error' ? 'var(--danger)' : 'var(--success)' }}>{msg.text}</div>
          )}
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Сохранение...' : 'Изменить пароль'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Profile ──────────────────────────────────────────────────────────
export default function Profile() {
  const { user, updateUser } = useAuth();
  const meta = ROLE_META[user?.role] || ROLE_META.intern;
  const fileRef = useRef();

  const [departments, setDepartments] = useState([]);
  const [positions,   setPositions]   = useState([]);

  const [form, setForm] = useState({
    name:       user?.name       || '',
    departmentId: user?.department || '',
    subdivision: user?.subdivision_name || user?.subdivision || '',
    positionId: user?.position   || '',
    telegram:   user?.telegram   || '',
    phone:      user?.phone      || '',
  });
  const [avatar,  setAvatar]  = useState(null);
  const [saved,   setSaved]   = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [errors,  setErrors]  = useState({});

  useEffect(() => {
    departmentsAPI.list().then(r => setDepartments(Array.isArray(r.data) ? r.data : r.data.results || [])).catch(()=>{});
    positionsAPI.list().then(r => setPositions(Array.isArray(r.data) ? r.data : r.data.results || [])).catch(()=>{});
  }, []);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Обязательное поле';
    return e;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    setErrors({});
    setSaving(true);
    try {
      const [firstName, ...rest] = form.name.trim().split(' ');
      const payload = {
        first_name: firstName,
        last_name: rest.join(' '),
        phone: form.phone,
        telegram: form.telegram,
        department: form.departmentId || null,
        position: form.positionId || null,
      };
      const r = await authAPI.updateMe(payload);
      updateUser?.({
        ...r.data,
        name: r.data.full_name || form.name,
        department: r.data.department,
        department_name: r.data.department_name,
        position: r.data.position,
        position_name: r.data.position_name,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setErrors({ name: 'Ошибка сохранения' });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatar = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setAvatar(ev.target.result);
    reader.readAsDataURL(file);
  };

  const initials = form.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() || '??';
  const deptName = departments.find(d => String(d.id) === String(form.departmentId))?.name || user?.department_name || '';
  const posName  = positions.find(p => String(p.id) === String(form.positionId))?.name || user?.position_name || '';

  return (
    <MainLayout title="Личный кабинет">
      <div style={{ maxWidth: 760 }}>
        <div className="page-header">
          <div>
            <div className="page-title">Личный кабинет</div>
            <div className="page-subtitle">Управляйте своими данными и настройками</div>
          </div>
        </div>

        <div className="card">
          <div style={{ height: 100, background: meta.bg, borderRadius: '12px 12px 0 0', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 12, right: 16, background: meta.color, color: 'white', fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20 }}>
              {meta.label}
            </div>
          </div>

          <div className="card-body" style={{ paddingTop: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginTop: -36, marginBottom: 24 }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div className="avatar" style={{ width: 72, height: 72, fontSize: 24, border: '3px solid white', boxShadow: 'var(--shadow)', background: avatar ? 'transparent' : meta.color, overflow: 'hidden' }}>
                  {avatar ? <img src={avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
                </div>
                <button onClick={() => fileRef.current.click()}
                  style={{ position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: '50%', background: meta.color, border: '2px solid white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Camera size={11} color="white" />
                </button>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatar} />
              </div>
              <div style={{ marginBottom: 4 }}>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{form.name || '—'}</div>
                <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>{posName} · {deptName}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24, background: 'var(--gray-50)', borderRadius: 'var(--radius)', padding: '14px 16px' }}>
              {[
                { label: 'Логин',      value: user?.login || user?.username || '—' },
                { label: 'Email',      value: user?.email || '—' },
                { label: 'Дата найма', value: user?.hireDate || user?.hire_date || '—' },
              ].map(item => (
                <div key={item.label}>
                  <div style={{ fontSize: 11, color: 'var(--gray-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{item.value}</div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSave}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Персональные данные</div>

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">ФИО <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input className={`form-input ${errors.name ? 'input-error' : ''}`}
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Фамилия Имя Отчество" />
                {errors.name && <div style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>{errors.name}</div>}
              </div>

              <div className="grid-2" style={{ marginBottom: 16 }}>
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

              <div className="grid-2" style={{ marginBottom: 24 }}>
                <div className="form-group">
                  <label className="form-label">Telegram</label>
                  <input className="form-input" value={form.telegram} onChange={e => setForm(f => ({ ...f, telegram: e.target.value }))} placeholder="@username" />
                </div>
                <div className="form-group">
                  <label className="form-label">Телефон</label>
                  <input className="form-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+996 ..." />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="btn btn-secondary"
                  onClick={() => setForm({ name: user?.name || '', departmentId: user?.department || '', subdivision: user?.subdivision_name || '', positionId: user?.position || '', telegram: user?.telegram || '', phone: user?.phone || '' })}>
                  Сбросить
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {saved ? <><Check size={15} /> Сохранено!</> : <><Save size={15} /> {saving ? 'Сохранение...' : 'Сохранить изменения'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>

        <PasswordSection />

        {user?.role === 'intern' && (
          <div className="card" style={{ marginTop: 20 }}>
            <div className="card-header"><span className="card-title">Перевод в сотрудники</span></div>
            <div className="card-body">
              <div style={{ fontSize: 13, color: 'var(--gray-600)' }}>
                Процесс перевода ведёт администратор: после завершения стажировки он отправляет запрос суперадминистратору на подтверждение роли сотрудника.
              </div>
            </div>
          </div>
        )}

        {user?.role === 'superadmin' && <OrgSection />}
      </div>
    </MainLayout>
  );
}
