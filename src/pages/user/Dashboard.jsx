import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import MainLayout from '../../layouts/MainLayout';
import { X, Users, ClipboardCheck, TrendingUp, CheckSquare } from 'lucide-react';
import { newsAPI, feedbackAPI } from '../../api/content';

// Role-specific banner config
const BANNERS = {
  intern: {
    title: 'Добро пожаловать в команду! 🎉',
    sub: 'Пройди онбординг, изучи регламенты и стань частью компании «В Плюсе».',
    action: 'Перейти к онбордингу',
    path: '/onboarding',
    bg: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
  },
  employee: {
    title: 'С возвращением! 👋',
    sub: 'Ваши задачи, регламенты и график работы — всё здесь.',
    action: 'Мой профиль',
    path: '/profile',
    bg: 'linear-gradient(135deg, #16A34A 0%, #2563EB 100%)',
  },
  projectmanager: {
    title: 'Панель проектов 📋',
    sub: 'Контролируйте прогресс проектов и статусы задач команды.',
    action: 'Открыть проекты',
    path: '/tasks',
    bg: 'linear-gradient(135deg, #7C3AED 0%, #EA580C 100%)',
  },
  admin: {
    title: 'Административная панель 🛡️',
    sub: 'Управление контентом, пользователями и онбордингом.',
    action: 'Перейти в панель',
    path: '/admin/overview',
    bg: 'linear-gradient(135deg, #EA580C 0%, #D97706 100%)',
  },
  superadmin: {
    title: 'Полный контроль системы 👑',
    sub: 'Роли, права, система и безопасность платформы.',
    action: 'Перейти в панель',
    path: '/admin/overview',
    bg: 'linear-gradient(135deg, #BE123C 0%, #EA580C 100%)',
  },
};

const QUICK_STATS = {
  intern:        [{ icon: '📋', label: 'День онбординга', value: '—', color: '#EFF6FF' }, { icon: '📄', label: 'Регламентов', value: '—', color: '#F0FDF4' }, { icon: '📊', label: 'Отчётов отправлено', value: '—', color: '#FAF5FF' }],
  employee:      [{ icon: '✅', label: 'Задач выполнено', value: '—', color: '#F0FDF4' }, { icon: '📅', label: 'Рабочих дней в месяце', value: '—', color: '#EFF6FF' }, { icon: '📄', label: 'Регламентов', value: '—', color: '#FFF7ED' }],
  projectmanager:[{ icon: '👥', label: 'Подчинённых', value: '—', color: '#FAF5FF' }, { icon: '✅', label: 'Задач команды', value: '—', color: '#F0FDF4' }, { icon: '⚠️', label: 'Просрочено', value: '—', color: '#FFF1F2' }],
  admin:         [{ icon: '👤', label: 'Пользователей', value: '—', color: '#EFF6FF' }, { icon: '🎓', label: 'Стажёров', value: '—', color: '#F0FDF4' }, { icon: '📬', label: 'Обращений', value: '—', color: '#FFF7ED' }],
  superadmin:    [{ icon: '👤', label: 'Пользователей', value: '—', color: '#EFF6FF' }, { icon: '🛡️', label: 'Администраторов', value: '—', color: '#FFF7ED' }, { icon: '🔒', label: 'Заблокировано', value: '—', color: '#FFF1F2' }],
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedNews, setSelectedNews] = useState(null);
  const [news, setNews] = useState([]);
  const [fbType, setFbType] = useState('Предложение');
  const [fbText, setFbText] = useState('');
  const [fbMode, setFbMode] = useState('named');
  const [fbMsg, setFbMsg] = useState('');
  const [fbSending, setFbSending] = useState(false);

  const fallbackRole = user?.role === 'intern' ? 'intern' : 'employee';
  const banner = BANNERS[user?.role] || BANNERS[fallbackRole];
  const stats = QUICK_STATS[user?.role] || QUICK_STATS[fallbackRole];

  useEffect(() => {
    newsAPI.list().then(res => setNews(Array.isArray(res.data) ? res.data : res.data.results || [])).catch(() => {});
  }, []);

  const sendFeedback = async () => {
    if (!fbText.trim()) return;
    setFbSending(true);
    try {
      await feedbackAPI.create({
        type: fbType,
        text: fbText.trim(),
        is_anonymous: fbMode === 'anonymous',
      });
      setFbText('');
      setFbType('Предложение');
      setFbMode('named');
      setFbMsg('Обращение отправлено.');
      setTimeout(() => setFbMsg(''), 2500);
    } catch {
      setFbMsg('Ошибка отправки. Попробуйте снова.');
      setTimeout(() => setFbMsg(''), 2500);
    } finally {
      setFbSending(false);
    }
  };

  return (
    <MainLayout title="Главная">
      {/* Role banner */}
      <div className="announcement-banner" style={{ background: banner.bg, position: 'relative', overflow: 'hidden' }}>
        <div>
          <div className="announcement-title">{banner.title}</div>
          <div className="announcement-sub">{banner.sub}</div>
          <button className="btn" style={{ background: 'white', color: 'var(--primary)', fontWeight: 600, marginTop: 12 }}
            onClick={() => navigate(banner.path)}>
            {banner.action}
          </button>
        </div>
        <div style={{ flexShrink: 0 }}>
        </div>
      </div>

      {/* Quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {stats.map((s, i) => (
          <div key={i} className="card" style={{ background: s.color }}>
            <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px' }}>
              <span style={{ fontSize: 28 }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gray-900)' }}>{s.value}</div>
                <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* News */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 16 }}>Актуальные новости</h2>
        <div className="news-grid">
          {news.map(n => (
            <div key={n.id} className="news-card" onClick={() => setSelectedNews(n)}>
              {(n.img || n.image) && (
                <img src={n.img || n.image} alt={n.title} className="news-card-img" onError={e => { e.target.style.display = 'none'; }} />
              )}
              <div className="news-card-body">
                <div className="news-card-title">{n.title}</div>
                <div className="news-card-text">{n.text || n.content || n.description || ''}</div>
              </div>
            </div>
          ))}
          {news.length === 0 && (
            <div style={{ color: 'var(--gray-400)', fontSize: 13 }}>Нет новостей</div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid-2" style={{ gap: 20 }}>
        {/* Feedback */}
        <div className="card">
          <div className="card-body">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Обратная связь</h3>
            <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 16, lineHeight: 1.5 }}>
              Оставьте обращение, указав тип и контакты для связи.
            </p>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Тип обращения</label>
              <select className="form-select" value={fbType} onChange={e => setFbType(e.target.value)}>
                <option>Предложение</option><option>Жалоба</option><option>Вопрос</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Сообщение</label>
              <textarea
                className="form-textarea"
                placeholder="Опишите ваше обращение..."
                style={{ minHeight: 80 }}
                value={fbText}
                onChange={e => setFbText(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Формат отправки</label>
              <select className="form-select" value={fbMode} onChange={e => setFbMode(e.target.value)}>
                <option value="named">Неанонимно</option>
                <option value="anonymous">Анонимно</option>
              </select>
            </div>
            <button className="btn btn-primary" onClick={sendFeedback} disabled={fbSending}>
              {fbSending ? 'Отправка...' : 'Отправить'}
            </button>
            {fbMsg && <div style={{ marginTop: 8, fontSize: 12, color: 'var(--success)' }}>{fbMsg}</div>}
          </div>
        </div>

        {/* Team / role-specific right block */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Наша команда</span>
          </div>
          <div className="card-body">
            <div style={{ color: 'var(--gray-400)', fontSize: 13, padding: '12px 0' }}>
              Данные загружаются из API
            </div>
          </div>
        </div>
      </div>

      {/* News modal */}
      {selectedNews && (
        <div className="modal-overlay" onClick={() => setSelectedNews(null)}>
          <div style={{ background: '#2D3748', borderRadius: 16, width: 760, maxWidth: 'calc(100vw - 32px)', maxHeight: 'calc(100vh - 64px)', overflow: 'hidden', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <img src={selectedNews.img} alt={selectedNews.title} style={{ width: '100%', height: 300, objectFit: 'cover' }} />
            <button onClick={() => setSelectedNews(null)} style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X size={16} />
            </button>
            <div style={{ background: 'white', padding: '24px 28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                {(selectedNews.category || selectedNews.tag) && (
                  <span className="badge badge-blue">{selectedNews.category || selectedNews.tag}</span>
                )}
                <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>📅 {selectedNews.date || selectedNews.published_at || selectedNews.created_at || ''}</span>
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>{selectedNews.title}</h2>
              <p style={{ fontSize: 14, color: 'var(--gray-600)', lineHeight: 1.7 }}>
                {selectedNews.content || selectedNews.text || selectedNews.description || ''}
              </p>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
