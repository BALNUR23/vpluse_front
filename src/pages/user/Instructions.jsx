import { useState, useEffect } from 'react';
import MainLayout from '../../layouts/MainLayout';
import { BookOpen } from 'lucide-react';
import { instructionsAPI } from '../../api/content';

const FALLBACK_ITEMS = [
  { title: 'Как пройти онбординг', description: 'Зайдите в раздел "Онбординг / Отчёт". Изучайте материалы по дням. Ежедневно заполняйте отчёт во вкладке "Отчёт" и нажимайте "Отправить".' },
  { title: 'Как изменить профиль', description: 'Перейдите в "Профиль" в меню слева. Заполните данные и нажмите "Сохранить изменения".' },
  { title: 'Как найти регламенты', description: 'Все документы компании доступны в разделе "Регламенты". Вы можете скачать PDF/DOCX или перейти по внешней ссылке.' },
  { title: 'График работы', description: 'В разделе "График работы" отображается ваше рабочее расписание и производственный календарь.' },
  { title: 'Обратная связь', description: 'На главной странице есть форма обратной связи. Выберите тип обращения, опишите вопрос и отправьте.' },
];

export default function Instructions() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    instructionsAPI.list()
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : res.data.results || [];
        setItems(data.length > 0 ? data : FALLBACK_ITEMS);
      })
      .catch(() => setItems(FALLBACK_ITEMS));
  }, []);

  const displayItems = items.length > 0 ? items : FALLBACK_ITEMS;

  return (
    <MainLayout title="Инструкция по платформе">
      <div style={{ maxWidth: 760 }}>
        <div className="page-header">
          <div>
            <div className="page-title">Инструкция по платформе</div>
            <div className="page-subtitle">Ответы на частые вопросы и руководство по работе</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {displayItems.map((item, i) => (
                <div key={item.id || i} style={{ display: 'flex', gap: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 'var(--radius)', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <BookOpen size={16} color="var(--primary)" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{item.title}</div>
                    <div style={{ fontSize: 13, color: 'var(--gray-500)', lineHeight: 1.6 }}>{item.description || item.content || item.text || ''}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
