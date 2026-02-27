import { useMemo, useState } from 'react';
import MainLayout from '../../layouts/MainLayout';
import { USERS, DEPARTMENTS } from '../../data/mockData';

const NODE_COLORS = ['#D9F99D', '#FDE68A', '#C4B5FD', '#F9A8D4', '#93C5FD', '#67E8F9', '#FCA5A5', '#FDBA74'];

export default function Company() {
  const [tab, setTab] = useState('structure');
  const employees = USERS.filter(u => u.role !== 'intern');
  const byParent = useMemo(() => {
    const map = new Map();
    DEPARTMENTS.forEach(d => {
      const key = d.parent || 0;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(d);
    });
    return map;
  }, []);

  const rootDepartments = byParent.get(0) || [];
  const secondLevel = rootDepartments.flatMap(d => byParent.get(d.id) || []);

  const getDeptStaff = (deptName) => employees.filter(e => (e.department || '').toLowerCase().includes(deptName.toLowerCase().slice(0, 5)));

  return (
    <MainLayout title="Компания">
      <div className="page-header">
        <div>
          <div className="page-title">Компания</div>
          <div className="page-subtitle">Структура компании и сотрудники</div>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: 14 }}>
        <button className={`tab-btn ${tab === 'structure' ? 'active' : ''}`} onClick={() => setTab('structure')}>Структура</button>
        <button className={`tab-btn ${tab === 'employees' ? 'active' : ''}`} onClick={() => setTab('employees')}>Сотрудники</button>
      </div>

      {tab === 'structure' && (
        <div className="card">
          <div className="card-body" style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: 980 }}>
              <div style={{ textAlign: 'center', fontSize: 36, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 12 }}>
                Структура компании "В ПЛЮСЕ"
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
                <div style={{ background: '#A3E635', border: '1px solid #84CC16', borderRadius: 10, padding: '10px 14px', minWidth: 240, textAlign: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>Генеральный директор</div>
                  <div style={{ fontSize: 12 }}>{rootDepartments[0]?.headName || '—'}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(1, secondLevel.length)}, minmax(170px, 1fr))`, gap: 10 }}>
                {secondLevel.map((dep, i) => {
                  const staff = getDeptStaff(dep.name);
                  return (
                    <div key={dep.id} style={{ background: NODE_COLORS[i % NODE_COLORS.length], border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, padding: 10, minHeight: 220 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{dep.name}</div>
                      <div style={{ fontSize: 12, marginBottom: 8 }}>{dep.headName || '—'} · {dep.headRole || '—'}</div>
                      <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 6 }}>Сотрудники</div>
                      <div style={{ display: 'grid', gap: 6 }}>
                        {staff.length === 0 && <div style={{ fontSize: 12, opacity: 0.7 }}>Нет сотрудников</div>}
                        {staff.slice(0, 5).map(s => (
                          <div key={s.id} style={{ background: 'rgba(255,255,255,0.65)', borderRadius: 8, padding: '5px 7px' }}>
                            <div style={{ fontSize: 12, fontWeight: 600 }}>{s.name}</div>
                            <div style={{ fontSize: 11 }}>{s.position || '—'}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'employees' && (
        <div className="card">
          <div className="card-header"><span className="card-title">Сотрудники компании</span></div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>СОТРУДНИК</th>
                  <th>ОТДЕЛ</th>
                  <th>ДОЛЖНОСТЬ</th>
                  <th>РОЛЬ</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(u => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td>{u.department || '—'}</td>
                    <td>{u.position || '—'}</td>
                    <td>{u.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
