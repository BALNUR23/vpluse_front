import { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import MainLayout from '../../layouts/MainLayout';
import { DollarSign, Pencil, Check, X } from 'lucide-react';
import { getAttendanceStore } from '../../utils/attendance';
import { getAssignedScheduleForUser } from '../../utils/scheduleApproval';

const fmt = (n) => (n || 0).toLocaleString('ru-RU') + ' KGS';
const SETTINGS_KEY = 'vpluse_salary_settings_v1';

const STATUS_COLORS = {
  paid: { color: '#16A34A', bg: '#D1FAE5', label: 'Выплачено' },
  pending: { color: '#D97706', bg: '#FEF9C3', label: 'Ожидает' },
  delayed: { color: '#EF4444', bg: '#FEE2E2', label: 'Задержка' },
};

const PAY_TYPE_LABELS = {
  fixed: 'Оклад',
  hourly: 'Почасовая',
  minute: 'Поминутная',
};

// История выплат и бонусы
const SALARY_DATA = {
  5: { name: 'Мария К.', role: 'Суперадминистратор', dept: 'Управление', history: [
    { month: 'Январь 2026', bonus: 30000, status: 'paid' },
    { month: 'Декабрь 2025', bonus: 25000, status: 'paid' },
  ]},
  9: { name: 'Админ А.', role: 'Администратор', dept: 'Управление', history: [
    { month: 'Январь 2026', bonus: 12000, status: 'paid' },
    { month: 'Декабрь 2025', bonus: 10000, status: 'paid' },
  ]},
  2: { name: 'Айбек Усупов', role: 'Сотрудник', dept: 'Отдел холодных продаж', history: [
    { month: 'Январь 2026', bonus: 5000, status: 'paid' },
    { month: 'Декабрь 2025', bonus: 8000, status: 'paid' },
  ]},
  3: { name: 'Султаналиев Максат', role: 'Проект-менеджер', dept: 'Отдел маркетинга', history: [
    { month: 'Январь 2026', bonus: 15000, status: 'paid' },
    { month: 'Декабрь 2025', bonus: 20000, status: 'paid' },
  ]},
  4: { name: 'Иван С.', role: 'Руководитель', dept: 'Управление', history: [
    { month: 'Январь 2026', bonus: 20000, status: 'paid' },
    { month: 'Декабрь 2025', bonus: 25000, status: 'paid' },
  ]},
};

const DEFAULT_SETTINGS = {
  5: { payType: 'fixed', baseSalary: 180000, hourlyRate: 500, minuteRate: 8, bonus: 30000, penalty: 0, status: 'paid' },
  9: { payType: 'fixed', baseSalary: 110000, hourlyRate: 350, minuteRate: 6, bonus: 12000, penalty: 0, status: 'paid' },
  2: { payType: 'fixed', baseSalary: 80000, hourlyRate: 300, minuteRate: 5, bonus: 5000, penalty: 0, status: 'paid' },
  3: { payType: 'hourly', baseSalary: 120000, hourlyRate: 350, minuteRate: 6, bonus: 15000, penalty: 0, status: 'paid' },
  4: { payType: 'fixed', baseSalary: 150000, hourlyRate: 400, minuteRate: 7, bonus: 20000, penalty: 0, status: 'paid' },
};

const ROLE_FALLBACK_SETTINGS = {
  superadmin: { payType: 'fixed', baseSalary: 180000, hourlyRate: 500, minuteRate: 8, bonus: 30000, penalty: 0, status: 'paid' },
  admin: { payType: 'fixed', baseSalary: 110000, hourlyRate: 350, minuteRate: 6, bonus: 12000, penalty: 0, status: 'paid' },
  projectmanager: { payType: 'hourly', baseSalary: 120000, hourlyRate: 350, minuteRate: 6, bonus: 15000, penalty: 0, status: 'paid' },
  employee: { payType: 'fixed', baseSalary: 80000, hourlyRate: 300, minuteRate: 5, bonus: 5000, penalty: 0, status: 'paid' },
  intern: { payType: 'fixed', baseSalary: 40000, hourlyRate: 180, minuteRate: 3, bonus: 0, penalty: 0, status: 'pending' },
};

const readSettings = () => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
};

const saveSettings = (settings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

const depKey = (u) => String(u?.department_name || u?.department || '').trim().toLowerCase();

const timeToMin = (v) => {
  if (!v || typeof v !== 'string' || !v.includes(':')) return null;
  const [h, m] = v.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
};

const overlapMinutes = (aStart, aEnd, bStart, bEnd) => {
  const start = Math.max(aStart, bStart);
  const end = Math.min(aEnd, bEnd);
  return Math.max(0, end - start);
};

const getBreakDeductionForDate = (userId, dateKey, checkInIso, checkOutIso) => {
  const assigned = getAssignedScheduleForUser(userId);
  const schedule = assigned?.schedule;
  if (!schedule) return 0;

  const dayDate = new Date(`${dateKey}T00:00:00`);
  const dayOfWeek = dayDate.getDay() === 0 ? 7 : dayDate.getDay();
  const dayPlan = (schedule.daysPlan || []).find((d) => Number(d.dayOfWeek) === Number(dayOfWeek));
  if (!dayPlan || dayPlan.isOff) return 0;

  const workStart = new Date(checkInIso).getHours() * 60 + new Date(checkInIso).getMinutes();
  const workEnd = new Date(checkOutIso).getHours() * 60 + new Date(checkOutIso).getMinutes();
  if (workEnd <= workStart) return 0;

  let deduction = 0;

  const lunchStart = timeToMin(dayPlan.lunchStart);
  const lunchEnd = timeToMin(dayPlan.lunchEnd);
  if (lunchStart != null && lunchEnd != null && lunchEnd > lunchStart) {
    deduction += overlapMinutes(workStart, workEnd, lunchStart, lunchEnd);
  }

  if (Array.isArray(dayPlan.breaks)) {
    dayPlan.breaks.forEach((br) => {
      if (!br) return;
      if (typeof br === 'string' && br.includes('-')) {
        const [s, e] = br.split('-');
        const bStart = timeToMin((s || '').trim());
        const bEnd = timeToMin((e || '').trim());
        if (bStart != null && bEnd != null && bEnd > bStart) {
          deduction += overlapMinutes(workStart, workEnd, bStart, bEnd);
        }
        return;
      }
      const bStart = timeToMin(br.start);
      const bEnd = timeToMin(br.end);
      if (bStart != null && bEnd != null && bEnd > bStart) {
        deduction += overlapMinutes(workStart, workEnd, bStart, bEnd);
      }
    });
  }

  return Math.max(0, deduction);
};

const getWorkedTimeInMonth = (userId, year, month) => {
  const store = getAttendanceStore();
  const rows = store?.[String(userId)] || {};
  let minutes = 0;
  Object.entries(rows).forEach(([dateKey, rec]) => {
    const dt = new Date(`${dateKey}T00:00:00`);
    if (dt.getFullYear() !== year || dt.getMonth() !== month) return;
    if (!rec?.checkIn || !rec?.checkOut) return;
    const total = Math.max(0, Math.round((new Date(rec.checkOut).getTime() - new Date(rec.checkIn).getTime()) / 60000));
    const deduction = getBreakDeductionForDate(userId, dateKey, rec.checkIn, rec.checkOut);
    minutes += Math.max(0, total - deduction);
  });
  return {
    minutes,
    hours: Number((minutes / 60).toFixed(2)),
  };
};

const computeBase = (paySetting, workedMinutes, workedHours) => {
  if (!paySetting) return 0;
  if (paySetting.payType === 'hourly') return Math.round(workedHours * (Number(paySetting.hourlyRate) || 0));
  if (paySetting.payType === 'minute') return Math.round(workedMinutes * (Number(paySetting.minuteRate) || 0));
  return Number(paySetting.baseSalary) || 0;
};

const buildFallbackSalaryData = (u) => {
  if (!u) return null;
  return {
    name: u.name || u.username || 'Пользователь',
    role: u.roleLabel || u.role || 'Сотрудник',
    dept: u.department_name || u.department || 'Без отдела',
    history: [
      { month: 'Январь 2026', bonus: 0, status: 'pending' },
      { month: 'Декабрь 2025', bonus: 0, status: 'paid' },
    ],
  };
};

const getEffectiveSalarySettings = (userId, role, settings) =>
  settings[String(userId)] ||
  DEFAULT_SETTINGS[String(userId)] ||
  ROLE_FALLBACK_SETTINGS[role] ||
  ROLE_FALLBACK_SETTINGS.employee;

function MySalary({ user, settings }) {
  const userId = user?.id;
  const data = SALARY_DATA[userId] || buildFallbackSalaryData(user);
  const now = new Date();
  const worked = getWorkedTimeInMonth(userId, now.getFullYear(), now.getMonth());
  const userSettings = getEffectiveSalarySettings(userId, user?.role, settings);

  if (!data || !userSettings) {
    return (
      <div className="card">
        <div className="card-body" style={{ textAlign: 'center', padding: 60 }}>
          <DollarSign size={40} style={{ color: 'var(--gray-200)', marginBottom: 12 }} />
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--gray-500)' }}>Данные о зарплате не найдены</div>
        </div>
      </div>
    );
  }

  const base = computeBase(userSettings, worked.minutes, worked.hours);
  const bonus = Number(userSettings.bonus) || 0;
  const penalty = Number(userSettings.penalty) || 0;
  const total = base + bonus - penalty;
  const st = STATUS_COLORS[userSettings.status || 'paid'];

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 20 }}>
        <div className="card" style={{ borderTop: '3px solid #16A34A' }}>
          <div className="card-body">
            <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 6 }}>Итого за текущий месяц</div>
            <div style={{ fontSize: 26, fontWeight: 800 }}>{fmt(total)}</div>
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--gray-500)' }}>
              Тип: {PAY_TYPE_LABELS[userSettings.payType]}
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 6 }}>Начисление</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{fmt(base)}</div>
            <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 6 }}>
              {userSettings.payType === 'hourly' && `${userSettings.hourlyRate} KGS/час`}
              {userSettings.payType === 'minute' && `${userSettings.minuteRate} KGS/минута`}
              {userSettings.payType === 'fixed' && 'Фиксированный оклад'}
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 6 }}>Отработано / Премия</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{worked.hours} ч / {fmt(bonus)}</div>
            <div style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>Штраф: {fmt(penalty)}</div>
            <div style={{ fontSize: 12, color: st.color, marginTop: 6 }}>{st.label}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">История выплат</span></div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>МЕСЯЦ</th><th>ТИП</th><th>СТАВКА</th><th>ПРЕМИЯ</th><th>ШТРАФ</th><th>СТАТУС</th></tr>
            </thead>
            <tbody>
              {data.history.map((row, i) => (
                <tr key={i}>
                  <td>{row.month}</td>
                  <td>{PAY_TYPE_LABELS[userSettings.payType]}</td>
                  <td>
                    {userSettings.payType === 'hourly' && `${userSettings.hourlyRate} KGS/час`}
                    {userSettings.payType === 'minute' && `${userSettings.minuteRate} KGS/минута`}
                    {userSettings.payType === 'fixed' && fmt(userSettings.baseSalary)}
                  </td>
                  <td>{fmt(row.bonus || 0)}</td>
                  <td>{fmt(userSettings.penalty || 0)}</td>
                  <td><span className={`badge ${STATUS_COLORS[row.status || 'paid'].color === '#16A34A' ? 'badge-green' : 'badge-yellow'}`}>{STATUS_COLORS[row.status || 'paid'].label}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function AllSalaries({ rowsFilter = null, title = 'Настройка зарплаты сотрудников' }) {
  const [settings, setSettings] = useState(readSettings);
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ payType: 'fixed', baseSalary: '', hourlyRate: '', minuteRate: '', bonus: '', penalty: '', status: 'paid' });

  const now = new Date();
  const rows = useMemo(() => {
    const all = Object.entries(SALARY_DATA).map(([id, d]) => {
      const sid = String(id);
      const cfg = settings[sid] || DEFAULT_SETTINGS[sid] || DEFAULT_SETTINGS[2];
      const worked = getWorkedTimeInMonth(Number(id), now.getFullYear(), now.getMonth());
      const base = computeBase(cfg, worked.minutes, worked.hours);
      const bonus = Number(cfg.bonus) || 0;
      const penalty = Number(cfg.penalty) || 0;
      return {
        id: Number(id),
        name: d.name,
        role: d.role,
        dept: d.dept,
        payType: cfg.payType,
        hourlyRate: cfg.hourlyRate,
        minuteRate: cfg.minuteRate,
        baseSalary: cfg.baseSalary,
        workedHours: worked.hours,
        workedMinutes: worked.minutes,
        base,
        bonus,
        penalty,
        total: base + bonus - penalty,
        status: cfg.status || 'paid',
      };
    });
    return rowsFilter ? all.filter(rowsFilter) : all;
  }, [settings, now, rowsFilter]);

  const totalFund = rows.reduce((s, x) => s + x.total, 0);

  const openEdit = (row) => {
    setEditId(row.id);
    setForm({
      payType: row.payType,
      baseSalary: String(row.baseSalary || 0),
      hourlyRate: String(row.hourlyRate || 0),
      minuteRate: String(row.minuteRate || 0),
      bonus: String(row.bonus || 0),
      penalty: String(row.penalty || 0),
      status: row.status || 'paid',
    });
    setModal(true);
  };

  const handleSave = () => {
    if (!editId) return;
    const next = {
      ...settings,
      [String(editId)]: {
        payType: form.payType,
        baseSalary: Number(form.baseSalary) || 0,
        hourlyRate: Number(form.hourlyRate) || 0,
        minuteRate: Number(form.minuteRate) || 0,
        bonus: Number(form.bonus) || 0,
        penalty: Number(form.penalty) || 0,
        status: form.status,
      },
    };
    setSettings(next);
    saveSettings(next);
    setModal(false);
  };

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <div className="card"><div className="card-body"><div style={{ fontSize: 12, color: 'var(--gray-500)' }}>Фонд оплаты труда (авторасчёт)</div><div style={{ fontSize: 24, fontWeight: 800 }}>{fmt(totalFund)}</div></div></div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">{title}</span></div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>СОТРУДНИК</th><th>ОТДЕЛ / РОЛЬ</th><th>ТИП ОПЛАТЫ</th><th>СТАВКА</th><th>ОТРАБОТАНО</th><th>НАЧИСЛЕНО</th><th>ПРЕМИЯ</th><th>ШТРАФ</th><th>ИТОГО</th><th></th></tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.id}>
                  <td style={{ fontWeight: 600 }}>{row.name}</td>
                  <td><div style={{ fontSize: 13 }}>{row.dept}</div><div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{row.role}</div></td>
                  <td>{PAY_TYPE_LABELS[row.payType]}</td>
                  <td>
                    {row.payType === 'hourly' && `${row.hourlyRate} KGS/час`}
                    {row.payType === 'minute' && `${row.minuteRate} KGS/минута`}
                    {row.payType === 'fixed' && fmt(row.baseSalary)}
                  </td>
                  <td>{row.workedHours} ч</td>
                  <td>{fmt(row.base)}</td>
                  <td>{fmt(row.bonus)}</td>
                  <td style={{ color: '#EF4444' }}>{fmt(row.penalty)}</td>
                  <td style={{ fontWeight: 700 }}>{fmt(row.total)}</td>
                  <td><button className="btn-icon" onClick={() => openEdit(row)}><Pencil size={13} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <div className="modal-title">Настройка ставки</div>
              <button className="btn-icon" onClick={() => setModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">Тип оплаты</label>
                <select className="form-select" value={form.payType} onChange={e => setForm(f => ({ ...f, payType: e.target.value }))}>
                  <option value="fixed">Оклад</option>
                  <option value="hourly">Почасовая</option>
                  <option value="minute">Поминутная</option>
                </select>
              </div>
              {form.payType === 'fixed' && (
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label className="form-label">Оклад (KGS)</label>
                  <input className="form-input" type="number" value={form.baseSalary} onChange={e => setForm(f => ({ ...f, baseSalary: e.target.value }))} />
                </div>
              )}
              {form.payType === 'hourly' && (
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label className="form-label">Ставка за час (KGS)</label>
                  <input className="form-input" type="number" value={form.hourlyRate} onChange={e => setForm(f => ({ ...f, hourlyRate: e.target.value }))} placeholder="например, 300" />
                </div>
              )}
              {form.payType === 'minute' && (
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label className="form-label">Ставка за минуту (KGS)</label>
                  <input className="form-input" type="number" value={form.minuteRate} onChange={e => setForm(f => ({ ...f, minuteRate: e.target.value }))} placeholder="например, 5" />
                </div>
              )}
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">Премия (KGS)</label>
                <input className="form-input" type="number" value={form.bonus} onChange={e => setForm(f => ({ ...f, bonus: e.target.value }))} />
              </div>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">Штраф (KGS)</label>
                <input className="form-input" type="number" value={form.penalty} onChange={e => setForm(f => ({ ...f, penalty: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Статус</label>
                <select className="form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="paid">Выплачено</option>
                  <option value="pending">Ожидает</option>
                  <option value="delayed">Задержка</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(false)}>Отмена</button>
              <button className="btn btn-primary" onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Check size={14} /> Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function Salary() {
  const { user, mockUsers = [] } = useAuth();
  const isAdminOrSuper = user?.role === 'superadmin' || user?.role === 'admin';
  const isDepartmentHead = user?.role === 'projectmanager';
  const canManageSalary = isAdminOrSuper || isDepartmentHead;
  const settings = readSettings();
  const [view, setView] = useState('my');

  const managerDepartment = depKey(user);
  const departmentSalaryFilter = useMemo(() => {
    if (!isDepartmentHead) return null;
    return (row) => {
      const target = mockUsers.find(u => Number(u.id) === Number(row.id));
      return depKey(target) === managerDepartment;
    };
  }, [isDepartmentHead, managerDepartment, mockUsers]);

  return (
    <MainLayout title="Зарплата">
      <div className="page-header">
        <div>
          <div className="page-title">{canManageSalary && view === 'team' ? '💰 Зарплаты сотрудников' : '💳 Моя зарплата'}</div>
          <div className="page-subtitle">
            {canManageSalary && view === 'team'
              ? (isDepartmentHead ? 'Зарплаты и редактирование сотрудников вашего отдела.' : 'Оклад, почасовая и поминутная модель с авторасчётом по времени.')
              : 'Зарплата рассчитывается по вашей модели оплаты.'}
          </div>
        </div>
      </div>

      {canManageSalary && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <button
            type="button"
            className={`btn btn-sm ${view === 'my' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setView('my')}
          >
            Моя зарплата
          </button>
          <button
            type="button"
            className={`btn btn-sm ${view === 'team' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setView('team')}
          >
            {isDepartmentHead ? 'Зарплаты отдела' : 'Зарплаты сотрудников'}
          </button>
        </div>
      )}

      {canManageSalary
        ? (view === 'team'
            ? <AllSalaries rowsFilter={departmentSalaryFilter} title={isDepartmentHead ? 'Настройка зарплаты сотрудников отдела' : 'Настройка зарплаты сотрудников'} />
            : <MySalary user={user} settings={settings} />)
        : <MySalary user={user} settings={settings} />}
    </MainLayout>
  );
}
