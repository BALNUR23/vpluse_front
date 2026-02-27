import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import MainLayout from '../../layouts/MainLayout';
import { NEWS } from '../../data/mockData';
import { X, Users, ClipboardCheck, TrendingUp, CheckSquare } from 'lucide-react';
import { createFeedbackTicket } from '../../utils/feedbackStore';

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

// Role-specific quick stats
const QUICK_STATS = {
  intern: [
    { icon: '📋', label: 'День онбординга', value: '1 / 5', color: '#EFF6FF' },
    { icon: '📄', label: 'Регламентов', value: '6', color: '#F0FDF4' },
    { icon: '📊', label: 'Отчётов отправлено', value: '0', color: '#FAF5FF' },
  ],
  employee: [
    { icon: '✅', label: 'Задач выполнено', value: '12', color: '#F0FDF4' },
    { icon: '📅', label: 'Рабочих дней в месяце', value: '20', color: '#EFF6FF' },
    { icon: '📄', label: 'Регламентов', value: '6', color: '#FFF7ED' },
  ],
  projectmanager: [
    { icon: '👥', label: 'Подчинённых', value: '2', color: '#FAF5FF' },
    { icon: '✅', label: 'Задач команды', value: '9', color: '#F0FDF4' },
    { icon: '⚠️', label: 'Просрочено', value: '2', color: '#FFF1F2' },
  ],
  admin: [
    { icon: '👤', label: 'Пользователей', value: '42', color: '#EFF6FF' },
    { icon: '🎓', label: 'Стажёров', value: '28', color: '#F0FDF4' },
    { icon: '📬', label: 'Обращений', value: '3', color: '#FFF7ED' },
  ],
  superadmin: [
    { icon: '👤', label: 'Пользователей', value: '42', color: '#EFF6FF' },
    { icon: '🛡️', label: 'Администраторов', value: '5', color: '#FFF7ED' },
    { icon: '🔒', label: 'Заблокировано', value: '1', color: '#FFF1F2' },
  ],
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedNews, setSelectedNews] = useState(null);
  const [fbType, setFbType] = useState('Предложение');
  const [fbText, setFbText] = useState('');
  const [fbMode, setFbMode] = useState('named');
  const [fbMsg, setFbMsg] = useState('');

  const fallbackRole = user?.role === 'intern' ? 'intern' : 'employee';
  const banner = BANNERS[user?.role] || BANNERS[fallbackRole];
  const stats = QUICK_STATS[user?.role] || QUICK_STATS[fallbackRole];

  const sendFeedback = () => {
    if (!fbText.trim()) return;
    createFeedbackTicket({
      type: fbType,
      text: fbText.trim(),
      user: user?.name || 'Пользователь',
      userRole: user?.role || 'employee',
      isAnonymous: fbMode === 'anonymous',
    });
    setFbText('');
    setFbType('Предложение');
    setFbMode('named');
    setFbMsg('Обращение отправлено.');
    setTimeout(() => setFbMsg(''), 2500);
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
          {NEWS.map(n => (
            <div key={n.id} className="news-card" onClick={() => setSelectedNews(n)}>
              <img src={n.img} alt={n.title} className="news-card-img" onError={e => { e.target.style.display = 'none'; }} />
              <div className="news-card-body">
                <div className="news-card-title">{n.title}</div>
                <div className="news-card-text">{n.text}</div>
              </div>
            </div>
          ))}
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
            <button className="btn btn-primary" onClick={sendFeedback}>Отправить</button>
            {fbMsg && <div style={{ marginTop: 8, fontSize: 12, color: 'var(--success)' }}>{fbMsg}</div>}
          </div>
        </div>

        {/* Team / role-specific right block */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Наша команда</span>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { name: 'Елена М.',  role: 'HR-менеджер',        color: '#F3D0D7' },
                { name: 'Иван С.',   role: 'Рук. продаж',        color: '#D0E8F3' },
                { name: 'Мария К.',  role: 'Суперадмин',         color: '#D0F3D7' },
                { name: 'Султан М.', role: 'Тимлид маркетинга',  color: '#F3F0D0' },
              ].map(p => (
                <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--gray-50)', borderRadius: 'var(--radius)' }}>
                  <div className="avatar" style={{ width: 36, height: 36, background: p.color, fontSize: 13 }}>
                    {p.name.split(' ').map(x => x[0]).join('')}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>{p.role}</div>
                  </div>
                </div>
              ))}
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
                <span className="badge badge-blue">{selectedNews.category}</span>
                <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>📅 {selectedNews.date}</span>
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>{selectedNews.title}</h2>
              <p style={{ fontSize: 14, color: 'var(--gray-600)', lineHeight: 1.7 }}>
                В прошедшие выходные в главном офисе компании «В Плюсе» состоялась ежегодная стратегическая сессия топ-менеджмента. Основной повесткой дня стало обсуждение векторов развития на 2025–2027 годы.
                <br/><br/>
                Мы утвердили амбициозные цели по масштабированию бизнеса и внедрению передовых технологий.
              </p>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
