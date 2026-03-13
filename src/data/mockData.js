// Mock data removed — replaced with real API

export const USERS = [];
export const CURRENT_USER_INTERN = null;
export const CURRENT_USER_ADMIN = null;
export const CURRENT_USER_SUPERADMIN = null;

export const NEWS = [];
export const REGULATIONS = [];
export const ONBOARDING_DAYS = [];
export const TASKS = [];
export const KANBAN_COLUMNS = [
  { id: 'new',       title: 'Новые',           color: '#22C55E', bg: '#DCFCE7' },
  { id: 'inprogress', title: 'В работе',       color: '#0EA5E9', bg: '#E0F2FE' },
  { id: 'review',    title: 'Ждут проверки',   color: '#EAB308', bg: '#FEF9C3' },
  { id: 'done',      title: 'Завершённые',     color: '#8B5CF6', bg: '#EDE9FE' },
  { id: 'postponed', title: 'Отложенные',      color: '#9CA3AF', bg: '#F3F4F6' },
];

export const ATTENDANCE_USERS = [];
export const ATTENDANCE_DATA = {};

export const DEPARTMENTS = [];

export const KB_ARTICLES = [];

export const EFFICIENCY_METRICS = {
  tasks: { created: 0, comments: 0, open: 0, overdue: 0 },
  bpm: { launched: 0, actions: 0 },
  metrics: { growing: 0, declining: 0, subordinatesGrowing: 0, subordinatesDeclining: 0 },
  other: { finplanPending: 0, lostEquipment: 0, chatgptRequests: 0 },
};

export const WORK_SCHEDULE = {
  workDays: '—',
  hours: '—',
  lunch: '—',
  breaks: '—',
};

export const ROLES = [];

export const CONTENT_MODULES = [
  { id: 'news',        icon: '📰', color: '#FEF3C7', title: 'Новости компании',        desc: 'Публикация новостей, событий и объявлений для сотрудников.',            stat: '', link: 'Перейти →' },
  { id: 'welcome',     icon: '📣', color: '#D1FAE5', title: 'Приветственный блок',      desc: 'Настройка приветственного сообщения для новых пользователей.',          stat: '', link: 'Редактировать →' },
  { id: 'instruction', icon: '📚', color: '#EDE9FE', title: 'Инструкция по платформе', desc: 'Управление разделом "Инструкция". Загрузка PDF файлов.',                stat: '', link: 'Перейти →' },
  { id: 'team',        icon: '👥', color: '#FEE2E2', title: 'Сотрудники и Команда',    desc: 'Добавление и редактирование карточек сотрудников.',                     stat: '', link: 'Управление →' },
  { id: 'regs',        icon: '📄', color: '#FEF9C3', title: 'Регламенты',               desc: 'База знаний компании. Загрузка документов и внешних ссылок.',           stat: '', link: 'Перейти →' },
];
