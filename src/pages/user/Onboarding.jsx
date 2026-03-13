import { useState, useEffect } from 'react';
import MainLayout from '../../layouts/MainLayout';
import { onboardingV1API } from '../../api/v1';
import { useAuth } from '../../context/AuthContext';
import { Clock, Download, ExternalLink, CheckCircle, Send, AlertCircle, CheckSquare, Square } from 'lucide-react';

const STATUS_LABELS = { draft: 'Черновик', sent: 'Отправлен', accepted: 'Принят', rework: 'На доработке', rejected: 'Отклонён' };
const STATUS_COLORS = { draft: 'badge-gray', sent: 'badge-blue', accepted: 'badge-green', rework: 'badge-yellow', rejected: 'badge-red' };

function normalizeDay(raw) {
  return {
    id: raw.id,
    dayNumber: raw.day_number ?? raw.dayNumber ?? raw.number ?? raw.id,
    title: raw.title || '',
    stage: raw.stage || raw.stage_name || '',
    deadline: raw.deadline || raw.deadline_label || '',
    goals: Array.isArray(raw.goals) ? raw.goals : [],
    instructions: raw.instructions || raw.description || '',
    docs: Array.isArray(raw.documents) ? raw.documents : Array.isArray(raw.docs) ? raw.docs : [],
    tasks: Array.isArray(raw.tasks) ? raw.tasks : [],
  };
}

function normalizeReport(raw) {
  return {
    id: raw.id,
    dayId: raw.day || raw.day_id || raw.onboarding_day,
    dayNumber: raw.day_number ?? raw.day ?? '',
    status: raw.status || 'draft',
    did: raw.did || raw.what_did || raw.completed || '',
    willDo: raw.will_do || raw.what_will_do || raw.plans || '',
    blockers: raw.blockers || raw.problems || '',
    comment: raw.comment || raw.feedback || '',
    date: raw.created_at ? new Date(raw.created_at).toLocaleDateString('ru-RU') : (raw.date || ''),
  };
}

export default function Onboarding() {
  const { user } = useAuth();
  const [tab, setTab] = useState('onboarding');
  const [days, setDays] = useState([]);
  const [activeDay, setActiveDay] = useState(null);
  const [reports, setReports] = useState([]);
  const [tasks, setTasks] = useState({});
  const [reportData, setReportData] = useState({ did: '', willDo: '', blockers: '' });
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (title, msg) => { setToast({ title, msg }); setTimeout(() => setToast(null), 3500); };

  useEffect(() => {
    let currentDayId = null;

    onboardingV1API.overview()
      .then(res => {
        const d = res.data;
        currentDayId = d.current_day?.id ?? d.current_day ?? null;
      })
      .catch(() => {});

    onboardingV1API.days.list()
      .then(res => {
        const rawDays = Array.isArray(res.data) ? res.data : res.data.results || [];
        const normalized = rawDays.map(normalizeDay);
        setDays(normalized);
        if (normalized.length > 0) {
          const current = (currentDayId && normalized.find(x => x.id === currentDayId)) || normalized[0];
          setActiveDay(current);
          const initTasks = {};
          normalized.forEach(day => {
            initTasks[day.id] = day.tasks.map((t, i) => ({
              id: t.id ?? i,
              title: t.title || t.name || String(t),
              done: t.done ?? t.is_completed ?? false,
            }));
          });
          setTasks(initTasks);
          // Populate reports from day completion data if available
          const completedReports = normalized
            .filter(d => d.completion || d.is_completed)
            .map(d => normalizeReport({
              id: d.id,
              day: d.id,
              day_number: d.dayNumber,
              status: d.completion?.status || 'sent',
              did: d.completion?.did || d.completion?.what_did || '',
              will_do: d.completion?.will_do || '',
              blockers: d.completion?.blockers || '',
              comment: d.completion?.comment || '',
              created_at: d.completion?.created_at || '',
            }));
          if (completedReports.length > 0) setReports(completedReports);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!activeDay) return;
    const existing = reports.find(r => r.dayId === activeDay.id || r.dayNumber === activeDay.dayNumber);
    if (existing) {
      setReportData({ did: existing.did, willDo: existing.willDo, blockers: existing.blockers, id: existing.id, status: existing.status });
    } else {
      setReportData({ did: '', willDo: '', blockers: '' });
    }
  }, [activeDay?.id, reports.length]);

  const toggleTask = (dayId, taskId) => {
    setTasks(t => ({
      ...t,
      [dayId]: (t[dayId] || []).map(x => x.id === taskId ? { ...x, done: !x.done } : x),
    }));
  };

  const handleSend = async () => {
    if (!reportData.did?.trim()) { showToast('Ошибка', 'Заполните поле «Что сделал»'); return; }
    setSending(true);
    try {
      const payload = {
        day: activeDay.id,
        did: reportData.did.trim(),
        will_do: reportData.willDo?.trim() || '',
        blockers: reportData.blockers?.trim() || '',
      };
      const res = await onboardingV1API.days.complete(activeDay.id, payload);
      const saved = normalizeReport(res.data);
      setReports(prev => {
        const idx = prev.findIndex(r => r.id === saved.id);
        return idx >= 0 ? prev.map(r => r.id === saved.id ? saved : r) : [saved, ...prev];
      });
      setReportData(d => ({ ...d, id: saved.id, status: saved.status }));
      showToast('Успешно', `Отчёт за День ${activeDay.dayNumber} отправлен.`);
    } catch (e) {
      const msg = e.response?.data?.detail || e.response?.data?.day?.[0] || 'Ошибка отправки';
      showToast('Ошибка', msg);
    } finally {
      setSending(false);
    }
  };

  const dayTasks = activeDay ? (tasks[activeDay.id] || []) : [];
  const doneTasks = dayTasks.filter(t => t.done).length;
  const totalTasks = dayTasks.length;
  const progress = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const currentReport = activeDay ? reports.find(r => r.dayId === activeDay.id || r.dayNumber === activeDay.dayNumber) : null;
  const submitted = currentReport?.status === 'sent' || currentReport?.status === 'accepted';

  if (days.length === 0) {
    return (
      <MainLayout title="Программа адаптации">
        <div className="page-header">
          <div className="page-title">Программа адаптации</div>
          <div className="page-subtitle">Изучай материалы, выполняй задания и отправляй ежедневные отчёты</div>
        </div>
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--gray-400)', fontSize: 14 }}>
            Программа онбординга ещё не назначена. Обратитесь к руководителю.
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Программа адаптации">
      <div className="page-header">
        <div>
          <div className="page-title">Программа адаптации</div>
          <div className="page-subtitle">Изучай материалы, выполняй задания и отправляй ежедневные отчёты</div>
        </div>
      </div>

      {/* Day selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {days.map(day => {
          const dt = tasks[day.id] || [];
          const dp = dt.length ? Math.round((dt.filter(t => t.done).length / dt.length) * 100) : 0;
          return (
            <button key={day.id} onClick={() => setActiveDay(day)}
              style={{
                padding: '8px 18px', borderRadius: 'var(--radius)', border: '1px solid',
                borderColor: activeDay?.id === day.id ? 'var(--primary)' : 'var(--gray-200)',
                background: activeDay?.id === day.id ? 'var(--primary-light)' : 'white',
                color: activeDay?.id === day.id ? 'var(--primary)' : 'var(--gray-700)',
                fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              }}>
              День {day.dayNumber}
              {dp === 100 && <CheckCircle size={13} color="#16A34A" />}
            </button>
          );
        })}
      </div>

      <div className="tabs">
        <button className={`tab-btn ${tab === 'onboarding' ? 'active' : ''}`} onClick={() => setTab('onboarding')}>Онбординг</button>
        <button className={`tab-btn ${tab === 'tasks' ? 'active' : ''}`} onClick={() => setTab('tasks')}>
          Задачи {doneTasks}/{totalTasks}
        </button>
        <button className={`tab-btn ${tab === 'report' ? 'active' : ''}`} onClick={() => setTab('report')}>Отчёт</button>
      </div>

      {/* ── TAB: Онбординг ── */}
      {tab === 'onboarding' && activeDay && (
        <div className="onboarding-day-card">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 4 }}>
                День {activeDay.dayNumber}. {activeDay.title}
              </h2>
              <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>Этап: {activeDay.stage}</div>
            </div>
            {activeDay.deadline && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '6px 12px', fontSize: 13, color: 'var(--danger)', fontWeight: 500 }}>
                <Clock size={14} /> Дедлайн: {activeDay.deadline}
              </div>
            )}
          </div>

          {activeDay.goals.length > 0 && (
            <>
              <div className="section-label">ЦЕЛИ ДНЯ</div>
              <ul style={{ paddingLeft: 20, marginBottom: 20 }}>
                {activeDay.goals.map((g, i) => (
                  <li key={i} style={{ fontSize: 14, color: 'var(--gray-700)', marginBottom: 6, lineHeight: 1.5 }}>{g}</li>
                ))}
              </ul>
            </>
          )}

          {activeDay.instructions && (
            <>
              <div className="section-label">ИНСТРУКЦИИ</div>
              <p style={{ fontSize: 14, color: 'var(--gray-700)', lineHeight: 1.7, marginBottom: 20 }}>{activeDay.instructions}</p>
            </>
          )}

          {activeDay.docs.length > 0 && (
            <>
              <div className="section-label">РЕГЛАМЕНТЫ И ДОКУМЕНТЫ</div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                {activeDay.docs.map((doc, i) => {
                  const href = doc.url || doc.file || doc.link || '#';
                  const type = doc.type || doc.file_type || 'link';
                  const isLink = type === 'link';
                  return (
                    <a key={i} className="doc-card" href={href} target="_blank" rel="noreferrer"
                      style={{ flex: '1', minWidth: 180, textDecoration: 'none', color: 'inherit' }}>
                      <div className="doc-icon" style={{ background: type === 'pdf' ? '#FEE2E2' : type === 'docx' ? '#DBEAFE' : '#EDE9FE' }}>
                        {type === 'pdf' ? '📄' : type === 'docx' ? '📝' : '🔗'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--gray-800)' }}>{doc.title || doc.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{doc.size || 'Внешняя ссылка'}</div>
                      </div>
                      {isLink ? <ExternalLink size={14} color="var(--gray-400)" /> : <Download size={14} color="var(--gray-400)" />}
                    </a>
                  );
                })}
              </div>
            </>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ borderRadius: 'var(--radius)', background: 'var(--gray-100)', height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-400)', fontSize: 13 }}>🎥 Видео-приветствие</div>
            <div style={{ borderRadius: 'var(--radius)', background: 'var(--gray-100)', height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-400)', fontSize: 13 }}>📊 Презентация</div>
          </div>
        </div>
      )}

      {/* ── TAB: Задачи ── */}
      {tab === 'tasks' && activeDay && (
        <div className="onboarding-day-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700 }}>Задачи · День {activeDay.dayNumber}</div>
              <div style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 2 }}>{activeDay.title}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: progress === 100 ? '#16A34A' : 'var(--primary)' }}>
                {doneTasks}/{totalTasks}
              </div>
              <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>выполнено</div>
            </div>
          </div>

          <div style={{ height: 8, background: 'var(--gray-100)', borderRadius: 4, marginBottom: 24, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: progress + '%', background: progress === 100 ? '#16A34A' : 'var(--primary)', borderRadius: 4, transition: 'width 0.4s ease' }} />
          </div>

          {dayTasks.length === 0 ? (
            <div style={{ color: 'var(--gray-400)', fontSize: 13, textAlign: 'center', padding: 20 }}>Задачи не назначены</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {dayTasks.map(task => (
                <div key={task.id} onClick={() => toggleTask(activeDay.id, task.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                    borderRadius: 'var(--radius)', border: '1px solid',
                    borderColor: task.done ? '#A7F3D0' : 'var(--gray-200)',
                    background: task.done ? '#F0FDF4' : 'white', cursor: 'pointer', transition: 'all 0.15s',
                  }}>
                  <div style={{ flexShrink: 0, color: task.done ? '#16A34A' : 'var(--gray-300)' }}>
                    {task.done ? <CheckSquare size={20} /> : <Square size={20} />}
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 500, color: task.done ? 'var(--gray-400)' : 'var(--gray-800)', textDecoration: task.done ? 'line-through' : 'none', flex: 1 }}>
                    {task.title}
                  </span>
                  {task.done && <span style={{ fontSize: 11, color: '#16A34A', fontWeight: 600 }}>✓ Готово</span>}
                </div>
              ))}
            </div>
          )}

          {progress === 100 && (
            <div style={{ marginTop: 20, padding: '14px 16px', background: '#F0FDF4', border: '1px solid #A7F3D0', borderRadius: 'var(--radius)', color: '#065F46', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle size={16} /> Все задачи выполнены! Не забудь заполнить и отправить отчёт.
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Отчёт ── */}
      {tab === 'report' && activeDay && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>
          <div className="onboarding-day-card">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20, padding: '12px 16px', background: 'var(--gray-50)', borderRadius: 'var(--radius)' }}>
              {[['ДЕНЬ', `День ${activeDay.dayNumber}`], ['ДАТА', new Date().toLocaleDateString('ru-RU')], ['АВТОР', user?.name || user?.username || '—'], ['СТАТУС', reportData.status || 'draft']].map(([label, val]) => (
                <div key={label}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 4 }}>{label}</div>
                  {label === 'СТАТУС'
                    ? <span className={`badge ${STATUS_COLORS[val] || 'badge-gray'}`}>{STATUS_LABELS[val] || val}</span>
                    : <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-800)' }}>{val}</div>
                  }
                </div>
              ))}
            </div>

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label" style={{ fontSize: 14, fontWeight: 600 }}>Что сделал</label>
              <textarea className="form-textarea" placeholder="Опишите выполненные задачи за сегодня..."
                value={reportData.did} onChange={e => setReportData(r => ({ ...r, did: e.target.value }))}
                disabled={submitted} style={{ minHeight: 120 }} />
            </div>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label" style={{ fontSize: 14, fontWeight: 600 }}>Что буду делать</label>
              <textarea className="form-textarea" placeholder="Планы на завтрашний день..."
                value={reportData.willDo} onChange={e => setReportData(r => ({ ...r, willDo: e.target.value }))}
                disabled={submitted} style={{ minHeight: 120 }} />
            </div>
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label" style={{ fontSize: 14, fontWeight: 600 }}>Какие проблемы возникли</label>
              <textarea className="form-textarea" placeholder="Возникли ли трудности? Если нет — оставьте пустым."
                value={reportData.blockers} onChange={e => setReportData(r => ({ ...r, blockers: e.target.value }))}
                disabled={submitted} style={{ minHeight: 100 }} />
            </div>

            {currentReport?.comment && (
              <div style={{ marginBottom: 16, padding: '12px 14px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 'var(--radius)', fontSize: 13, color: '#92400E' }}>
                <b>Комментарий проверяющего:</b> {currentReport.comment}
              </div>
            )}

            {!submitted && (
              <button className="btn btn-primary" onClick={handleSend} disabled={sending} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Send size={14} /> {sending ? 'Отправка...' : 'Отправить отчёт'}
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="report-history">
              <div className="report-history-title">История отчётов</div>
              {reports.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--gray-400)', paddingTop: 8, textAlign: 'center' }}>Отчётов нет</div>
              ) : (
                reports.map(r => (
                  <div key={r.id} className="report-history-item">
                    <span className={`status-dot ${r.status === 'accepted' ? 'green' : r.status === 'sent' ? 'blue' : r.status === 'rework' ? 'yellow' : 'gray'}`} />
                    <div>
                      <div style={{ fontWeight: 500 }}>День {r.dayNumber}</div>
                      <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{STATUS_LABELS[r.status] || r.status} · {r.date}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={submitted ? { background: '#F0FDF4', border: '1px solid #A7F3D0', borderRadius: 'var(--radius)', padding: '12px 14px', color: '#065F46' } : { background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 'var(--radius)', padding: '12px 14px' }}>
              {submitted ? (
                <>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle size={14} /> Ожидание проверки</div>
                  <div style={{ fontSize: 12 }}>Отчёт отправлен. Вы получите уведомление когда статус изменится.</div>
                </>
              ) : (
                <>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}><AlertCircle size={14} /> Важно</div>
                  <div style={{ fontSize: 12 }}>Заполните все поля и нажмите «Отправить».</div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast ${toast.title === 'Успешно' ? 'toast-success' : 'toast-error'}`}>
          <div>
            <div className="toast-title">{toast.title}</div>
            <div className="toast-msg">{toast.msg}</div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
