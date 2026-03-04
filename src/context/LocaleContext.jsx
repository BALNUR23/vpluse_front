import { createContext, useContext, useMemo, useState } from 'react';

export const LOCALE_KEY = 'vpluse_locale_v1';
const DEFAULT_LOCALE = 'ru';
const SUPPORTED = ['ru', 'en', 'kg'];

const DICT = {
  ru: {
    'lang.ru': 'RU',
    'lang.en': 'EN',
    'lang.kg': 'KG',

    'common.loading': 'Загрузка...',
    'common.save': 'Сохранить',

    'header.welcome': 'Добро пожаловать',
    'header.notifications': 'Уведомления',
    'header.read': 'Прочитано',
    'header.noEvents': 'Новых событий нет.',
    'header.profile': 'Профиль',
    'header.logout': 'Выйти',

    'sidebar.section.my': 'МОИ РАЗДЕЛЫ',
    'sidebar.section.manage': 'УПРАВЛЕНИЕ',
    'sidebar.section.system': 'СИСТЕМА',
    'sidebar.home': 'Главная',
    'sidebar.tasks': 'Задачи',
    'sidebar.myTasks': 'Мои задачи',
    'sidebar.teamTasks': 'Задачи команды',
    'sidebar.salary': 'Зарплата',
    'sidebar.company': 'Компания',
    'sidebar.regulations': 'Регламенты',
    'sidebar.schedule': 'График работы',
    'sidebar.instructions': 'Инструкция',
    'sidebar.overview': 'Обзор',
    'sidebar.users': 'Пользователи',
    'sidebar.roles': 'Роли и права',
    'sidebar.interns': 'Стажеры',
    'sidebar.departmentsSubdivisions': 'Отделы и подотделы',
    'sidebar.content': 'Контент',
    'sidebar.onboarding': 'Онбординг / Отчеты',
    'sidebar.workSchedules': 'График работы сотрудников',
    'sidebar.feedback': 'Обратная связь',
    'sidebar.systemSecurity': 'Система / Безопасность',
    'sidebar.interface': 'Интерфейс',
    'sidebar.hideSection': 'СКРЫТИЕ РАЗДЕЛОВ',
    'sidebar.hideToggle': 'Скрыть разделы',
    'sidebar.collapse': 'Свернуть меню',

    'notifications.empty': 'Новых событий нет.',
    'notifications.markRead': 'Прочитано',
    'notifications.fallback.title': 'Уведомление',
    'notifications.fallback.message': 'Новое событие',
    'notifications.code.promotion_request.title': 'Заявка на перевод',
    'notifications.code.promotion_request.message': 'Сотрудник отправил заявку на перевод',
    'notifications.code.schedule_request.title': 'Заявка на график',
    'notifications.code.schedule_request.message': 'Поступила новая заявка на график',
    'notifications.code.feedback_ticket.title': 'Новое обращение',
    'notifications.code.feedback_ticket.message': 'Поступило новое обращение в обратную связь',

    'status.pending': 'Ожидает',
    'status.approved': 'Одобрено',
    'status.rejected': 'Отклонено',
  },
  en: {
    'lang.ru': 'RU',
    'lang.en': 'EN',
    'lang.kg': 'KG',

    'common.loading': 'Loading...',
    'common.save': 'Save',

    'header.welcome': 'Welcome',
    'header.notifications': 'Notifications',
    'header.read': 'Mark read',
    'header.noEvents': 'No new events.',
    'header.profile': 'Profile',
    'header.logout': 'Logout',

    'sidebar.section.my': 'MY SECTIONS',
    'sidebar.section.manage': 'MANAGEMENT',
    'sidebar.section.system': 'SYSTEM',
    'sidebar.home': 'Home',
    'sidebar.tasks': 'Tasks',
    'sidebar.myTasks': 'My tasks',
    'sidebar.teamTasks': 'Team tasks',
    'sidebar.salary': 'Salary',
    'sidebar.company': 'Company',
    'sidebar.regulations': 'Regulations',
    'sidebar.schedule': 'Work schedule',
    'sidebar.instructions': 'Instructions',
    'sidebar.overview': 'Overview',
    'sidebar.users': 'Users',
    'sidebar.roles': 'Roles & permissions',
    'sidebar.interns': 'Interns',
    'sidebar.departmentsSubdivisions': 'Departments & subdivisions',
    'sidebar.content': 'Content',
    'sidebar.onboarding': 'Onboarding / Reports',
    'sidebar.workSchedules': 'Work schedules',
    'sidebar.feedback': 'Feedback',
    'sidebar.systemSecurity': 'System / Security',
    'sidebar.interface': 'Interface',
    'sidebar.hideSection': 'HIDDEN SECTIONS',
    'sidebar.hideToggle': 'Hide sections',
    'sidebar.collapse': 'Collapse menu',

    'notifications.empty': 'No new events.',
    'notifications.markRead': 'Mark read',
    'notifications.fallback.title': 'Notification',
    'notifications.fallback.message': 'New event',
    'notifications.code.promotion_request.title': 'Promotion request',
    'notifications.code.promotion_request.message': 'An employee submitted a promotion request',
    'notifications.code.schedule_request.title': 'Schedule request',
    'notifications.code.schedule_request.message': 'A new schedule request was submitted',
    'notifications.code.feedback_ticket.title': 'New feedback',
    'notifications.code.feedback_ticket.message': 'A new feedback ticket was submitted',

    'status.pending': 'Pending',
    'status.approved': 'Approved',
    'status.rejected': 'Rejected',
  },
  kg: {
    'lang.ru': 'RU',
    'lang.en': 'EN',
    'lang.kg': 'KG',

    'common.loading': 'Жүктөлүүдө...',
    'common.save': 'Сактоо',

    'header.welcome': 'Кош келиңиз',
    'header.notifications': 'Билдирмелер',
    'header.read': 'Окулган',
    'header.noEvents': 'Жаңы окуялар жок.',
    'header.profile': 'Профиль',
    'header.logout': 'Чыгуу',

    'sidebar.section.my': 'МЕНИН БӨЛҮМДӨРҮМ',
    'sidebar.section.manage': 'БАШКАРУУ',
    'sidebar.section.system': 'СИСТЕМА',
    'sidebar.home': 'Башкы бет',
    'sidebar.tasks': 'Тапшырмалар',
    'sidebar.myTasks': 'Менин тапшырмаларым',
    'sidebar.teamTasks': 'Команданын тапшырмалары',
    'sidebar.salary': 'Айлык',
    'sidebar.company': 'Компания',
    'sidebar.regulations': 'Регламенттер',
    'sidebar.schedule': 'Иш графиги',
    'sidebar.instructions': 'Нускама',
    'sidebar.overview': 'Сереп',
    'sidebar.users': 'Колдонуучулар',
    'sidebar.roles': 'Ролдор жана укуктар',
    'sidebar.interns': 'Стажерлор',
    'sidebar.departmentsSubdivisions': 'Бөлүмдөр жана бөлүмчөлөр',
    'sidebar.content': 'Контент',
    'sidebar.onboarding': 'Онбординг / Отчеттор',
    'sidebar.workSchedules': 'Иш графиктери',
    'sidebar.feedback': 'Кайтарым байланыш',
    'sidebar.systemSecurity': 'Система / Коопсуздук',
    'sidebar.interface': 'Интерфейс',
    'sidebar.hideSection': 'ЖАШЫРУУ БӨЛҮМҮ',
    'sidebar.hideToggle': 'Бөлүмдөрдү жашыруу',
    'sidebar.collapse': 'Менюну жыйноо',

    'notifications.empty': 'Жаңы окуялар жок.',
    'notifications.markRead': 'Окулган',
    'notifications.fallback.title': 'Билдирүү',
    'notifications.fallback.message': 'Жаңы окуя',
    'notifications.code.promotion_request.title': 'Которуу арызы',
    'notifications.code.promotion_request.message': 'Кызматкер которуу арызын жөнөттү',
    'notifications.code.schedule_request.title': 'График арызы',
    'notifications.code.schedule_request.message': 'Жаңы график арызы келип түштү',
    'notifications.code.feedback_ticket.title': 'Жаңы кайрылуу',
    'notifications.code.feedback_ticket.message': 'Кайтарым байланыш боюнча жаңы кайрылуу келди',

    'status.pending': 'Күтүүдө',
    'status.approved': 'Бекитилди',
    'status.rejected': 'Четке кагылды',
  },
};

const PHRASES = {
  en: {
    'Главная': 'Home',
    'Онбординг': 'Onboarding',
    'Инструкция': 'Instructions',
    'Регламенты': 'Regulations',
    'Компания': 'Company',
    'График работы': 'Work schedule',
    'Мои задачи': 'My tasks',
    'Зарплата': 'Salary',
    'Обратная связь': 'Feedback',
  },
  kg: {
    'Главная': 'Башкы бет',
    'Онбординг': 'Онбординг',
    'Инструкция': 'Нускама',
    'Регламенты': 'Регламенттер',
    'Компания': 'Компания',
    'График работы': 'Иш графиги',
    'Мои задачи': 'Менин тапшырмаларым',
    'Зарплата': 'Айлык',
    'Обратная связь': 'Кайтарым байланыш',
  },
};

const LocaleContext = createContext(null);

function getInitialLocale() {
  try {
    const raw = localStorage.getItem(LOCALE_KEY) || DEFAULT_LOCALE;
    return SUPPORTED.includes(raw) ? raw : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

export function getStoredLocale() {
  try {
    const raw = localStorage.getItem(LOCALE_KEY) || DEFAULT_LOCALE;
    return SUPPORTED.includes(raw) ? raw : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

export function LocaleProvider({ children }) {
  const [locale, setLocaleState] = useState(getInitialLocale);

  const setLocale = (next) => {
    const normalized = SUPPORTED.includes(next) ? next : DEFAULT_LOCALE;
    setLocaleState(normalized);
    try {
      localStorage.setItem(LOCALE_KEY, normalized);
    } catch {
      // ignore storage errors
    }
  };

  const t = (key, fallback = '') => {
    const localHit = DICT[locale]?.[key];
    if (localHit) return localHit;
    const ruHit = DICT[DEFAULT_LOCALE]?.[key];
    if (ruHit) return ruHit;
    return fallback || key;
  };

  const tr = (text) => {
    if (!text || locale === DEFAULT_LOCALE) return text;
    return PHRASES[locale]?.[text] || text;
  };

  const value = useMemo(() => ({ locale, setLocale, t, tr, supported: SUPPORTED }), [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}
