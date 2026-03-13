import { useState, useEffect } from 'react';
import MainLayout from '../../layouts/MainLayout';
import { reportsAPI } from '../../api/v1';
import { CheckCircle, XCircle, RotateCcw, Eye, X } from 'lucide-react';

const STATUS = {
  draft:    { label: 'Черновик',       cls: 'badge-gray'   },
  sent:     { label: 'Отправлен',      cls: 'badge-blue'   },
  accepted: { label: 'Принят',         cls: 'badge-green'  },
  rework:   { label: 'На доработке',   cls: 'badge-yellow' },
  rejected: { label: 'Отклонён',       cls: 'badge-red'    },
};

function normalizeReport(raw) {
  return {
    id: raw.id,
    userName: raw.user_name || raw.full_name || raw.user?.full_name || raw.user?.username || 'Стажёр',
    userDept: raw.department_name || raw.user?.department_name || '',
    userId: raw.user_id || raw.user?.id || raw.user,
    day: raw.day_number ?? raw.day ?? '',
    dayId: raw.day || raw.day_id || raw.onboarding_day,
    date: raw.created_at ? new Date(raw.created_at).toLocaleDateString('ru-RU') : (raw.date || ''),
    status: raw.status || 'draft',
    did: raw.did || raw.what_did || raw.completed || '',
    willDo: raw.will_do || raw.what_will_do || raw.plans || '',
    blockers: raw.blockers || raw.problems || '',
    comment: raw.comment || raw.feedback || '',
  };
}

export default function AdminOnboarding() {
  const [reports, setReports] = useState([]);
  const [selected, setSelected] = useState(null);
  const [comment, setComment] = useState('');
  const [tab, setTab] = useState('reports');
  const [toast, setToast] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  useEffect(() => {
    reportsAPI.admin.onboarding.reports.list()
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : res.data.results || [];
        setReports(data.map(normalizeReport));
      })
      .catch(() => {});
  }, []);

  const setStatus = async (id, status) => {
    try {
      await reportsAPI.admin.onboarding.reports.patch(id, { status, comment: status === 'rework' ? comment : undefined });
    } catch {}
    setReports(rs => rs.map(r => r.id === id ? { ...r, status, comment: status === 'rework' ? comment : r.comment } : r));
    setSelected(null);
    setComment('');
    showToast(status === 'accepted' ? 'Отчёт принят' : status === 'rework' ? 'Отправлен на доработку' : 'Отчёт отклонён');
  };

  // Group reports by intern for progress section
  const internMap = {};
  reports.forEach(r => {
    if (!internMap[r.userId]) internMap[r.userId] = { name: r.userName, dept: r.userDept, reports: [] };
    internMap[r.userId].reports.push(r);
  });
  const interns = Object.values(internMap);

  const sentReports = reports.filter(r => r.status === 'sent');

  return (
    <MainLayout title="Админ-панель · Онбординг / Отчёты">
      <div className="page-header">
        <div className="page-title">Онбординг / Отчёты</div>
        <div className="page-subtitle">Управление программами онбординга и проверка отчётов стажёров</div>
      </div>

      <div className="tabs">
        <button className={`tab-btn ${tab === 'reports' ? 'active' : ''}`} onClick={() => setTab('reports')}>
          Отчёты стажёров {sentReports.length > 0 && <span className="badge badge-blue" style={{ marginLeft: 6 }}>{sentReports.length}</span>}
        </button>
        <button className={`tab-btn ${tab === 'programs' ? 'active' : ''}`} onClick={() => setTab('programs')}>Программы</button>
      </div>

      {tab === 'reports' && (
        <div style={{ display: 'grid', gap: 14 }}>
          {/* Progress by intern */}
          {interns.length > 0 && (
            <div className="card">
              <div className="card-header">
                <span className="card-title">Прогресс по стажёрам</span>
              </div>
              <div className="card-body" style={{ display: 'grid', gap: 12 }}>
                {interns.map((intern, idx) => {
                  const accepted = intern.reports.filter(r => r.status === 'accepted').length;
                  const total = intern.reports.length;
                  const percent = total > 0 ? Math.round((accepted / total) * 100) : 0;
                  return (
                    <div key={idx} style={{ border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', padding: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600 }}>{intern.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{intern.dept}</div>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: percent === 100 ? 'var(--success)' : 'var(--primary)' }}>
                          {accepted}/{total} принято
                        </div>
                      </div>
                      <div style={{ height: 6, background: 'var(--gray-200)', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${percent}%`, background: percent === 100 ? '#16A34A' : '#2563EB' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reports table */}
          <div className="card">
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>СТАЖЁР</th>
                    <th>ДЕНЬ</th>
                    <th>ДАТА</th>
                    <th>СТАТУС</th>
                    <th>ДЕЙСТВИЯ</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--gray-400)' }}>Отчётов нет</td></tr>
                  ) : reports.map(r => (
                    <tr key={r.id}>
                      <td>
                        <div className="user-cell">
                          <div className="avatar" style={{ width: 30, height: 30, fontSize: 11 }}>
                            {r.userName.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 500, fontSize: 13 }}>{r.userName}</div>
                            <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{r.userDept}</div>
                          </div>
                        </div>
                      </td>
                      <td>День {r.day}</td>
                      <td style={{ fontSize: 13, color: 'var(--gray-500)' }}>{r.date}</td>
                      <td><span className={`badge ${STATUS[r.status]?.cls || 'badge-gray'}`}>{STATUS[r.status]?.label || r.status}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn-icon" onClick={() => { setSelected(r); setComment(''); }} title="Просмотр"><Eye size={14} /></button>
                          {r.status === 'sent' && (
                            <>
                              <button className="btn-icon" style={{ color: 'var(--success)' }} onClick={() => setStatus(r.id, 'accepted')} title="Принять"><CheckCircle size={14} /></button>
                              <button className="btn-icon" style={{ color: 'var(--warning)' }} onClick={() => { setSelected(r); setComment(''); }} title="На доработку"><RotateCcw size={14} /></button>
                              <button className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => setStatus(r.id, 'rejected')} title="Отклонить"><XCircle size={14} /></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'programs' && (
        <div className="card">
          <div className="card-body">
            <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>Программы онбординга по отделам будут здесь.</p>
          </div>
        </div>
      )}

      {/* Report detail modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" style={{ width: 620 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Отчёт — {selected.userName}, День {selected.day}</div>
              <button className="btn-icon" onClick={() => setSelected(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, background: 'var(--gray-50)', borderRadius: 'var(--radius)', padding: '12px 14px', marginBottom: 16 }}>
                {[['ДЕНЬ', `День ${selected.day}`], ['ДАТА', selected.date], ['АВТОР', selected.userName.split(' ')[0]], ['СТАТУС', selected.status]].map(([l, v]) => (
                  <div key={l}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: 2 }}>{l}</div>
                    {l === 'СТАТУС'
                      ? <span className={`badge ${STATUS[v]?.cls || 'badge-gray'}`}>{STATUS[v]?.label || v}</span>
                      : <div style={{ fontSize: 13, fontWeight: 600 }}>{v}</div>
                    }
                  </div>
                ))}
              </div>
              {[['Что сделал', selected.did || '—'], ['Что буду делать', selected.willDo || '—'], ['Какие проблемы возникли', selected.blockers || '—']].map(([label, val]) => (
                <div key={label} style={{ marginBottom: 14 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>{label}</div>
                  <div style={{ fontSize: 13, color: 'var(--gray-700)', background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', padding: '10px 14px', lineHeight: 1.6 }}>{val}</div>
                </div>
              ))}
              {selected.status === 'sent' && (
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Комментарий (для доработки)</div>
                  <textarea className="form-textarea" value={comment} onChange={e => setComment(e.target.value)} placeholder="Напишите комментарий для стажёра..." style={{ minHeight: 80 }} />
                </div>
              )}
            </div>
            {selected.status === 'sent' && (
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setSelected(null)}>Закрыть</button>
                <button className="btn btn-sm" style={{ background: '#FEF9C3', color: '#854D0E', border: '1px solid #FDE047' }} onClick={() => setStatus(selected.id, 'rework')}>
                  <RotateCcw size={13} /> На доработку
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => setStatus(selected.id, 'rejected')}>Отклонить</button>
                <button className="btn btn-primary btn-sm" onClick={() => setStatus(selected.id, 'accepted')}>
                  <CheckCircle size={13} /> Принять
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {toast && (
        <div className="toast toast-success">
          <div><div className="toast-title">Готово</div><div className="toast-msg">{toast}</div></div>
        </div>
      )}
    </MainLayout>
  );
}
