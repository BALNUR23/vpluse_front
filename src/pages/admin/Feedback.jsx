import { useState, useEffect } from 'react';
import MainLayout from '../../layouts/MainLayout';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle, Clock, AlertCircle, X, Eye } from 'lucide-react';
import { feedbackAPI } from '../../api/content';

const STATUS_LABELS = { new: 'Новое', in_progress: 'В работе', resolved: 'Решено' };
const STATUS_COLORS = { new: 'badge-blue', in_progress: 'badge-yellow', resolved: 'badge-green' };
const STATUS_ICONS = { new: <AlertCircle size={14} />, in_progress: <Clock size={14} />, resolved: <CheckCircle size={14} /> };

function normalizeTicket(raw) {
  const isAnonymous = raw.is_anonymous ?? raw.isAnonymous ?? false;
  return {
    id: raw.id,
    type: raw.type || raw.ticket_type || '—',
    text: raw.text || raw.message || raw.body || '',
    user: isAnonymous ? 'Анонимно' : (raw.full_name || raw.user_name || raw.user || raw.author || 'Пользователь'),
    userRole: raw.user_role || raw.userRole || 'employee',
    isAnonymous,
    date: raw.created_at ? new Date(raw.created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' }) : (raw.date || ''),
    status: raw.status || 'new',
  };
}

export default function AdminFeedback() {
  const { isSuperAdmin } = useAuth();
  const [items, setItems] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    feedbackAPI.list()
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : res.data.results || [];
        setItems(data.map(normalizeTicket));
      })
      .catch(() => {});
  }, []);

  const baseItems = isSuperAdmin
    ? items.filter(i => i.type === 'Жалоба')
    : items.filter(i => i.type === 'Жалоба' && ['intern', 'employee', 'projectmanager'].includes(i.userRole));
  const filtered = filterStatus === 'all' ? baseItems : baseItems.filter(i => i.status === filterStatus);
  const counts = {
    all: baseItems.length,
    new: baseItems.filter(i => i.status === 'new').length,
    in_progress: baseItems.filter(i => i.status === 'in_progress').length,
    resolved: baseItems.filter(i => i.status === 'resolved').length,
  };

  const setStatus = async (id, status) => {
    try {
      await feedbackAPI.reply(id, { status });
    } catch {}
    setItems(prev => prev.map(i => i.id === id ? { ...i, status } : i));
    if (selected?.id === id) setSelected(s => ({ ...s, status }));
  };

  return (
    <MainLayout title="Админ-панель · Обратная связь">
      <div className="page-header">
        <div>
          <div className="page-title">Обратная связь</div>
          <div className="page-subtitle">
            {isSuperAdmin
              ? 'История жалоб сотрудников и стажёров (только просмотр).'
              : 'Жалобы сотрудников и стажёров, направленные администраторам.'}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { key: 'all', label: 'Всего', color: 'var(--gray-800)' },
          { key: 'new', label: 'Новые', color: 'var(--primary)' },
          { key: 'in_progress', label: 'В работе', color: 'var(--warning)' },
          { key: 'resolved', label: 'Решено', color: 'var(--success)' },
        ].map(s => (
          <div key={s.key} className="card" style={{ cursor: 'pointer', border: filterStatus === s.key ? `2px solid ${s.color}` : undefined }}
            onClick={() => setFilterStatus(s.key)}>
            <div className="card-body" style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{counts[s.key]}</div>
              <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* List */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Тип</th>
                <th>Сообщение</th>
                <th>Сотрудник</th>
                <th>Формат</th>
                <th>Дата</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id}>
                  <td><span className="badge badge-gray">{item.type}</span></td>
                  <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>{item.text}</td>
                  <td style={{ fontSize: 13 }}>{item.user}</td>
                  <td>
                    <span className={`badge ${item.isAnonymous ? 'badge-yellow' : 'badge-blue'}`}>
                      {item.isAnonymous ? 'Анонимно' : 'Неанонимно'}
                    </span>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--gray-500)' }}>{item.date}</td>
                  <td>
                    <span className={`badge ${STATUS_COLORS[item.status] || 'badge-gray'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {STATUS_ICONS[item.status]} {STATUS_LABELS[item.status] || item.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn-icon" title="Посмотреть" onClick={() => setSelected(item)}><Eye size={14} /></button>
                      {!isSuperAdmin && item.status !== 'in_progress' && <button className="btn btn-secondary btn-sm" onClick={() => setStatus(item.id, 'in_progress')}>В работу</button>}
                      {!isSuperAdmin && item.status !== 'resolved' && <button className="btn btn-sm" style={{ background: 'var(--success-light)', color: 'var(--success)', border: 'none' }} onClick={() => setStatus(item.id, 'resolved')}>Решено</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--gray-400)' }}>
              Нет обращений
            </div>
          )}
        </div>
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Обращение #{selected.id}</div>
              <button className="btn-icon" onClick={() => setSelected(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div><div style={{ fontSize: 11, color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: 4 }}>Тип</div><span className="badge badge-gray">{selected.type}</span></div>
                <div><div style={{ fontSize: 11, color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: 4 }}>Статус</div><span className={`badge ${STATUS_COLORS[selected.status] || 'badge-gray'}`}>{STATUS_LABELS[selected.status] || selected.status}</span></div>
                <div><div style={{ fontSize: 11, color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: 4 }}>Сотрудник</div><span style={{ fontSize: 13 }}>{selected.user}</span></div>
                <div><div style={{ fontSize: 11, color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: 4 }}>Формат</div><span style={{ fontSize: 13 }}>{selected.isAnonymous ? 'Анонимно' : 'Неанонимно'}</span></div>
                <div><div style={{ fontSize: 11, color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: 4 }}>Дата</div><span style={{ fontSize: 13 }}>{selected.date}</span></div>
              </div>
              <div><div style={{ fontSize: 11, color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: 8 }}>Сообщение</div>
                <div style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius)', padding: 12, fontSize: 14, lineHeight: 1.6 }}>{selected.text}</div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelected(null)}>Закрыть</button>
              {!isSuperAdmin && selected.status !== 'resolved' && (
                <button className="btn btn-primary" onClick={() => { setStatus(selected.id, 'resolved'); setSelected(null); }}>
                  <CheckCircle size={14} /> Отметить решённым
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
