import { useEffect, useMemo, useState } from 'react';
import { Check, DollarSign, Pencil, Plus, RefreshCw, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usersAPI } from '../../api/auth';
import { payrollAPI } from '../../api/content';
import MainLayout from '../../layouts/MainLayout';

const MONTHS_RU = [
  'январь',
  'февраль',
  'март',
  'апрель',
  'май',
  'июнь',
  'июль',
  'август',
  'сентябрь',
  'октябрь',
  'ноябрь',
  'декабрь',
];

const EMPLOYMENT_OPTIONS = [
  { value: 'fixed', label: 'Оклад' },
  { value: 'daily', label: 'Дневная' },
  { value: 'hourly', label: 'Почасовая' },
];

const PERIOD_STATUS_META = {
  draft: { label: 'Рассчитано', className: 'badge-yellow' },
  locked: { label: 'Закрыто', className: 'badge-blue' },
  paid: { label: 'Выплачено', className: 'badge-green' },
};

const amountFmt = (value) => `${Number(value || 0).toLocaleString('ru-RU')} KGS`;
const todayMeta = () => ({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 });

function monthLabel(year, month, withYearWord = false) {
  const name = MONTHS_RU[Math.max(1, Math.min(12, Number(month))) - 1] || '';
  return withYearWord ? `${name} ${year} г.` : `${name} ${year}`;
}

function monthSelectOptions(count = 24) {
  const now = new Date();
  const items = [];
  for (let i = 0; i < count; i += 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    items.push({ key: `${year}-${String(month).padStart(2, '0')}`, year, month });
  }
  return items;
}

function statusBadge(status) {
  const meta = PERIOD_STATUS_META[status] || { label: status || '-', className: 'badge-gray' };
  return <span className={`badge ${meta.className}`}>{meta.label}</span>;
}

function isAdminRole(role) {
  return role === 'department_head' || role === 'admin' || role === 'superadmin';
}

function MetricCard({ title, value, hint, borderColor = 'var(--gray-200)' }) {
  return (
    <div className="card" style={{ borderTop: `3px solid ${borderColor}` }}>
      <div className="card-body">
        <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 6 }}>{title}</div>
        <div style={{ fontSize: 40, fontWeight: 800, lineHeight: 1 }}>{value}</div>
        {hint ? <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 8 }}>{hint}</div> : null}
      </div>
    </div>
  );
}

function MySalaryView({ entry, loading, error, selectedYear, selectedMonth }) {
  if (loading) {
    return <div className="card"><div className="card-body">Загрузка...</div></div>;
  }

  if (error) {
    return <div className="card"><div className="card-body" style={{ color: 'var(--danger)' }}>{error}</div></div>;
  }

  if (!entry) {
    return (
      <div className="card">
        <div className="card-body" style={{ textAlign: 'center', padding: 56 }}>
          <DollarSign size={42} style={{ color: 'var(--gray-300)', marginBottom: 8 }} />
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--gray-600)' }}>За выбранный период данных по зарплате пока нет.</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="stats-grid" style={{ marginBottom: 14 }}>
        <MetricCard
          title="К выплате"
          value={amountFmt(entry.total_amount)}
          hint={`Период: ${monthLabel(selectedYear, selectedMonth, true)}`}
          borderColor="#16A34A"
        />
        <MetricCard
          title="Начисление"
          value={amountFmt(entry.salary_amount)}
          hint="Базовая сумма без вычета авансов"
          borderColor="#2563EB"
        />
        <MetricCard
          title="Авансы"
          value={amountFmt(entry.advances)}
          hint="Учитываются при итоговой выплате"
          borderColor="#D97706"
        />
        <MetricCard
          title="Норма / Отработано"
          value={`${entry.worked_days}/${entry.planned_days} дн`}
          hint={`Статус периода: ${(PERIOD_STATUS_META[entry.period?.status]?.label || entry.period?.status || '-')}`}
          borderColor="#7C3AED"
        />
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Информация о расчете</span></div>
        <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div style={{ marginBottom: 6 }}>Сотрудник: <b>{entry.username}</b></div>
            <div style={{ marginBottom: 6 }}>Начисление: <b>{amountFmt(entry.salary_amount)}</b></div>
            <div style={{ marginBottom: 6 }}>К выплате: <b>{amountFmt(entry.total_amount)}</b></div>
            <div style={{ marginBottom: 6 }}>Статус записи: <b>{PERIOD_STATUS_META[entry.period?.status]?.label || '-'}</b></div>
          </div>
          <div>
            <div style={{ marginBottom: 6 }}>Период: <b>{monthLabel(selectedYear, selectedMonth, true)}</b></div>
            <div style={{ marginBottom: 6 }}>Авансы: <b>{amountFmt(entry.advances)}</b></div>
            <div style={{ marginBottom: 6 }}>Отработано дней: <b>{entry.worked_days}</b></div>
            <div style={{ marginBottom: 6 }}>Норма дней: <b>{entry.planned_days}</b></div>
          </div>
        </div>
      </div>
    </>
  );
}

function SalaryProfileModal({
  opened,
  mode,
  users,
  profile,
  selectedUserId,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState({
    user: '',
    base_salary: '',
    employment_type: 'fixed',
    currency: 'KGS',
    is_active: true,
  });

  useEffect(() => {
    if (!opened) return;
    if (mode === 'edit' && profile) {
      setForm({
        user: String(profile.user),
        base_salary: String(profile.base_salary || ''),
        employment_type: profile.employment_type || 'fixed',
        currency: profile.currency || 'KGS',
        is_active: profile.is_active !== false,
      });
      return;
    }
    setForm({
      user: selectedUserId ? String(selectedUserId) : '',
      base_salary: '',
      employment_type: 'fixed',
      currency: 'KGS',
      is_active: true,
    });
  }, [opened, mode, profile, selectedUserId]);

  if (!opened) return null;

  const submit = () => {
    const payload = {
      user: Number(form.user),
      base_salary: Number(form.base_salary) || 0,
      employment_type: form.employment_type,
      currency: form.currency || 'KGS',
      is_active: !!form.is_active,
    };
    onSubmit(payload);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <div className="modal-title">{mode === 'create' ? 'Добавить ставку' : 'Изменить ставку'}</div>
          <button className="btn-icon" type="button" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label">Сотрудник</label>
            <select
              className="form-select"
              disabled={mode === 'edit'}
              value={form.user}
              onChange={(e) => setForm((prev) => ({ ...prev, user: e.target.value }))}
            >
              <option value="">Выберите сотрудника</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.full_name || u.username || `#${u.id}`}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label">Модель оплаты</label>
            <select
              className="form-select"
              value={form.employment_type}
              onChange={(e) => setForm((prev) => ({ ...prev, employment_type: e.target.value }))}
            >
              {EMPLOYMENT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label">Ставка</label>
            <input
              className="form-input"
              type="number"
              min="0"
              value={form.base_salary}
              onChange={(e) => setForm((prev) => ({ ...prev, base_salary: e.target.value }))}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label">Валюта</label>
            <input
              className="form-input"
              value={form.currency}
              onChange={(e) => setForm((prev) => ({ ...prev, currency: e.target.value }))}
            />
          </div>

          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
            />
            Активный профиль
          </label>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" type="button" onClick={onClose}>Отмена</button>
          <button className="btn btn-primary" type="button" onClick={submit} disabled={!form.user}>
            <Check size={14} /> Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}

function TeamSalaryView({
  year,
  month,
  rows,
  profiles,
  users,
  loading,
  error,
  onGenerate,
  onCreateProfile,
  onUpdateProfile,
  onSetPeriodStatus,
  canChangeStatus,
}) {
  const [modalOpened, setModalOpened] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [profileForEdit, setProfileForEdit] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);

  const profileMap = useMemo(() => {
    const map = new Map();
    profiles.forEach((item) => map.set(Number(item.user), item));
    return map;
  }, [profiles]);

  const rowMap = useMemo(() => {
    const map = new Map();
    rows.forEach((item) => map.set(Number(item.user), item));
    return map;
  }, [rows]);

  const usersMap = useMemo(() => {
    const map = new Map();
    users.forEach((item) => map.set(Number(item.id), item));
    rows.forEach((item) => {
      const id = Number(item.user);
      if (!map.has(id)) map.set(id, { id, full_name: item.username, username: item.username });
    });
    profiles.forEach((item) => {
      const id = Number(item.user);
      if (!map.has(id)) map.set(id, { id, full_name: item.username, username: item.username });
    });
    return map;
  }, [users, rows, profiles]);

  const salaryRows = useMemo(() => {
    const ids = new Set([...rowMap.keys(), ...profileMap.keys()]);
    return [...ids]
      .map((id) => {
        const payroll = rowMap.get(id) || null;
        const profile = profileMap.get(id) || null;
        const user = usersMap.get(id) || { id, full_name: `#${id}` };
        return { id, payroll, profile, user };
      })
      .sort((a, b) => {
        const an = (a.user.full_name || a.user.username || '').toLowerCase();
        const bn = (b.user.full_name || b.user.username || '').toLowerCase();
        return an.localeCompare(bn, 'ru');
      });
  }, [rowMap, profileMap, usersMap]);

  const period = rows[0]?.period || null;
  const totalFund = rows.reduce((sum, row) => sum + Number(row.total_amount || 0), 0);
  const paidCount = rows.filter((row) => row.period?.status === 'paid').length;
  const pendingCount = rows.length - paidCount;

  const usersWithoutProfile = useMemo(() => {
    return [...usersMap.values()].filter((u) => !profileMap.has(Number(u.id)));
  }, [usersMap, profileMap]);

  const openCreateModal = () => {
    setModalMode('create');
    setProfileForEdit(null);
    setSelectedUserId(usersWithoutProfile[0]?.id || null);
    setModalOpened(true);
  };

  const openEditModal = (profile) => {
    setModalMode('edit');
    setProfileForEdit(profile);
    setSelectedUserId(profile.user);
    setModalOpened(true);
  };

  const submitModal = async (payload) => {
    if (modalMode === 'edit' && profileForEdit) {
      await onUpdateProfile(profileForEdit.id, payload);
    } else {
      await onCreateProfile(payload);
    }
    setModalOpened(false);
  };

  const setPeriodStatus = async (status) => {
    if (!period?.id) return;
    await onSetPeriodStatus(period.id, status);
  };

  return (
    <>
      {error ? (
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="card-body" style={{ color: 'var(--danger)' }}>{error}</div>
        </div>
      ) : null}

      <div className="stats-grid" style={{ marginBottom: 14 }}>
        <MetricCard
          title="Фонд оплаты"
          value={amountFmt(totalFund)}
          hint={`Период: ${monthLabel(year, month, true)}`}
          borderColor="#16A34A"
        />
        <MetricCard
          title="Записей"
          value={String(rows.length)}
          hint="Сотрудников в расчете"
          borderColor="#2563EB"
        />
        <MetricCard
          title="Выплачено"
          value={String(paidCount)}
          hint="Статус paid"
          borderColor="#16A34A"
        />
        <MetricCard
          title="Ожидает выплаты"
          value={String(pendingCount)}
          hint={`Статус периода: ${PERIOD_STATUS_META[period?.status]?.label || '-'}`}
          borderColor="#DC2626"
        />
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 4 }}>Управление периодом</div>
            <div style={{ fontSize: 42, fontWeight: 800, lineHeight: 1 }}>{monthLabel(year, month, true)}</div>
            <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="badge badge-blue">Всего: {rows.length}</span>
              <span className="badge badge-yellow">Рассчитано: {rows.length}</span>
              <span className="badge badge-green">Выплачено: {paidCount}</span>
              <span className="badge badge-red">Ожидает: {pendingCount}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {canChangeStatus && period?.id ? (
              <>
                <button className="btn btn-secondary" type="button" onClick={() => setPeriodStatus('draft')}>В статус Рассчитано</button>
                <button className="btn btn-secondary" type="button" onClick={() => setPeriodStatus('paid')}>Отметить выплаченным</button>
              </>
            ) : null}
            <button className="btn btn-primary" type="button" onClick={onGenerate}>
              <RefreshCw size={14} /> Пересчитать месяц
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Единая таблица зарплат и ставок</span>
          <button
            className="btn btn-primary"
            type="button"
            onClick={openCreateModal}
            disabled={usersWithoutProfile.length === 0}
            title={usersWithoutProfile.length === 0 ? 'У всех сотрудников уже есть ставка' : 'Добавить ставку'}
          >
            <Plus size={14} /> Добавить ставку
          </button>
        </div>

        <div className="table-wrap">
          <table className="table payroll-table">
            <thead>
              <tr>
                <th>Сотрудник</th>
                <th>Месяц</th>
                <th>Дни</th>
                <th>Начисление</th>
                <th>Авансы</th>
                <th>К выплате</th>
                <th>Статус</th>
                <th>Модель</th>
                <th>Ставка</th>
                <th>Управление</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10}>Загрузка...</td></tr>
              ) : null}

              {!loading && salaryRows.map(({ id, user, payroll, profile }) => (
                <tr key={id}>
                  <td style={{ fontWeight: 600 }}>{user.full_name || user.username || `#${id}`}</td>
                  <td>{monthLabel(year, month, true)}</td>
                  <td>{payroll ? `${payroll.worked_days}/${payroll.planned_days} дн` : '-'}</td>
                  <td>{payroll ? amountFmt(payroll.salary_amount) : '-'}</td>
                  <td>{payroll ? amountFmt(payroll.advances) : '-'}</td>
                  <td style={{ fontWeight: 700 }}>{payroll ? amountFmt(payroll.total_amount) : '-'}</td>
                  <td>{statusBadge(payroll?.period?.status || period?.status)}</td>
                  <td>{EMPLOYMENT_OPTIONS.find((x) => x.value === profile?.employment_type)?.label || '-'}</td>
                  <td>{profile ? `${amountFmt(profile.base_salary)} (${profile.currency || 'KGS'})` : '-'}</td>
                  <td>
                    {profile ? (
                      <button className="btn btn-secondary btn-sm" type="button" onClick={() => openEditModal(profile)}>
                        <Pencil size={13} /> Изменить
                      </button>
                    ) : (
                      <button
                        className="btn btn-secondary btn-sm"
                        type="button"
                        onClick={() => {
                          setModalMode('create');
                          setProfileForEdit(null);
                          setSelectedUserId(id);
                          setModalOpened(true);
                        }}
                      >
                        <Plus size={13} /> Добавить
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {!loading && salaryRows.length === 0 ? (
                <tr><td colSpan={10}>Данные по зарплатам за этот период отсутствуют.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <SalaryProfileModal
        opened={modalOpened}
        mode={modalMode}
        users={modalMode === 'create' ? usersWithoutProfile : [...usersMap.values()]}
        profile={profileForEdit}
        selectedUserId={selectedUserId}
        onClose={() => setModalOpened(false)}
        onSubmit={submitModal}
      />
    </>
  );
}

export default function Salary() {
  const { user } = useAuth();
  const isAdmin = isAdminRole(user?.role);
  const canChangeStatus = isAdmin;

  const [view, setView] = useState('my');
  const [selected, setSelected] = useState(todayMeta());

  const [myEntry, setMyEntry] = useState(null);
  const [myLoading, setMyLoading] = useState(true);
  const [myError, setMyError] = useState('');

  const [teamRows, setTeamRows] = useState([]);
  const [teamProfiles, setTeamProfiles] = useState([]);
  const [teamUsers, setTeamUsers] = useState([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamError, setTeamError] = useState('');

  const monthOptions = useMemo(() => monthSelectOptions(24), []);

  const loadMy = async (year, month) => {
    setMyLoading(true);
    setMyError('');
    try {
      const res = await payrollAPI.my({ year, month });
      setMyEntry(res.data || null);
    } catch (error) {
      if (error.response?.status === 404) {
        setMyEntry(null);
      } else {
        setMyError(error.response?.data?.detail || 'Не удалось загрузить мою зарплату.');
      }
    } finally {
      setMyLoading(false);
    }
  };

  const loadTeam = async (year, month) => {
    if (!isAdmin) return;
    setTeamLoading(true);
    setTeamError('');
    try {
      const [profilesRes, rowsRes, usersRes] = await Promise.all([
        payrollAPI.salaryProfiles(),
        payrollAPI.adminList({ year, month }),
        usersAPI.list().catch(() => ({ data: [] })),
      ]);

      setTeamProfiles(Array.isArray(profilesRes.data) ? profilesRes.data : []);
      setTeamRows(Array.isArray(rowsRes.data) ? rowsRes.data : []);
      const users = Array.isArray(usersRes.data) ? usersRes.data : [];
      setTeamUsers(
        users.map((u) => ({
          id: u.id,
          username: u.username,
          full_name: u.full_name || u.username,
        }))
      );
    } catch (error) {
      setTeamError(error.response?.data?.detail || 'Не удалось загрузить зарплаты сотрудников.');
    } finally {
      setTeamLoading(false);
    }
  };

  useEffect(() => {
    loadMy(selected.year, selected.month);
    loadTeam(selected.year, selected.month);
  }, [selected.year, selected.month, isAdmin]);

  const refreshBoth = async () => {
    await Promise.all([
      loadMy(selected.year, selected.month),
      loadTeam(selected.year, selected.month),
    ]);
  };

  const handleGenerate = async () => {
    setTeamError('');
    try {
      await payrollAPI.generate({ year: selected.year, month: selected.month });
      await refreshBoth();
    } catch (error) {
      setTeamError(error.response?.data?.detail || 'Не удалось пересчитать выбранный месяц.');
    }
  };

  const handleCreateProfile = async (payload) => {
    setTeamError('');
    try {
      await payrollAPI.createSalaryProfile(payload);
      await loadTeam(selected.year, selected.month);
    } catch (error) {
      setTeamError(error.response?.data?.detail || 'Не удалось создать ставку.');
    }
  };

  const handleUpdateProfile = async (profileId, payload) => {
    setTeamError('');
    try {
      await payrollAPI.updateSalaryProfile(profileId, payload);
      await loadTeam(selected.year, selected.month);
    } catch (error) {
      setTeamError(error.response?.data?.detail || 'Не удалось обновить ставку.');
    }
  };

  const handleSetPeriodStatus = async (periodId, status) => {
    setTeamError('');
    try {
      await payrollAPI.setPeriodStatus(periodId, { status });
      await loadTeam(selected.year, selected.month);
    } catch (error) {
      setTeamError(error.response?.data?.detail || 'Не удалось изменить статус периода.');
    }
  };

  return (
    <MainLayout title="Зарплата">
      <div className="page-header">
        <div>
          <div className="page-title">Зарплата</div>
          <div className="page-subtitle">Начисления и статус выплат за выбранный период</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <select
          className="form-select"
          style={{ width: 220 }}
          value={`${selected.year}-${String(selected.month).padStart(2, '0')}`}
          onChange={(e) => {
            const [year, month] = e.target.value.split('-').map(Number);
            setSelected({ year, month });
          }}
        >
          {monthOptions.map((opt) => (
            <option key={opt.key} value={opt.key}>{monthLabel(opt.year, opt.month, true)}</option>
          ))}
        </select>

        {isAdmin ? (
          <>
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
              Зарплаты сотрудников
            </button>
          </>
        ) : null}
      </div>

      {isAdmin && view === 'team' ? (
        <TeamSalaryView
          year={selected.year}
          month={selected.month}
          rows={teamRows}
          profiles={teamProfiles}
          users={teamUsers}
          loading={teamLoading}
          error={teamError}
          onGenerate={handleGenerate}
          onCreateProfile={handleCreateProfile}
          onUpdateProfile={handleUpdateProfile}
          onSetPeriodStatus={handleSetPeriodStatus}
          canChangeStatus={canChangeStatus}
        />
      ) : (
        <MySalaryView
          entry={myEntry}
          loading={myLoading}
          error={myError}
          selectedYear={selected.year}
          selectedMonth={selected.month}
        />
      )}
    </MainLayout>
  );
}
