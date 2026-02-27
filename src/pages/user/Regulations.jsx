import MainLayout from '../../layouts/MainLayout';
import { REGULATIONS } from '../../data/mockData';
import { useEffect, useMemo, useState } from 'react';
import { Download, ExternalLink, Globe } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const typeIcon = (type) => {
  if (type === 'pdf') return { icon: '📄', color: '#FEE2E2', iconColor: '#DC2626' };
  if (type === 'docx') return { icon: '📝', color: '#DBEAFE', iconColor: '#2563EB' };
  return { icon: '🔗', color: '#EDE9FE', iconColor: '#7C3AED' };
};

const TESTS_KEY = 'vpluse_regulations_tests_v1';
const READ_KEY = 'vpluse_regulations_read_v1';

const TEST_QUESTIONS = {
  default: [
    {
      id: 'q1',
      text: 'Как нужно действовать при нарушении требований регламента?',
      options: ['Игнорировать', 'Сообщить руководителю и следовать регламенту', 'Дождаться замечания'],
      correct: 1,
    },
    {
      id: 'q2',
      text: 'Обязательно ли соблюдать регламенты компании?',
      options: ['Да, для всех сотрудников', 'Только для стажёров', 'Нет, по желанию'],
      correct: 0,
    },
    {
      id: 'q3',
      text: 'Что подтверждает прохождение регламента?',
      options: ['Только открытие файла', 'Успешный результат теста', 'Устный ответ'],
      correct: 1,
    },
  ],
};

const readTests = () => {
  try {
    const raw = localStorage.getItem(TESTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const writeTests = (store) => localStorage.setItem(TESTS_KEY, JSON.stringify(store));

const getUserTests = (userId) => {
  const store = readTests();
  return store[String(userId)] || {};
};

const setUserTestResult = (userId, regId, result) => {
  const store = readTests();
  const uid = String(userId);
  store[uid] = store[uid] || {};
  store[uid][String(regId)] = result;
  writeTests(store);
};

const readReadStore = () => {
  try {
    const raw = localStorage.getItem(READ_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const getUserRead = (userId) => {
  const store = readReadStore();
  return store[String(userId)] || {};
};

const setUserRead = (userId, regId) => {
  const store = readReadStore();
  const uid = String(userId);
  store[uid] = store[uid] || {};
  store[uid][String(regId)] = { done: true, at: new Date().toLocaleString('ru-RU') };
  localStorage.setItem(READ_KEY, JSON.stringify(store));
};

const formatDeadline = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('ru-RU');
};

const isDeadlinePassed = (iso) => {
  if (!iso) return false;
  const now = new Date();
  const d = new Date(iso);
  d.setHours(23, 59, 59, 999);
  return now > d;
};

export default function Regulations() {
  const { user } = useAuth();
  const isIntern = user?.role === 'intern';

  const [previewDoc, setPreviewDoc] = useState(null);
  const [testDoc, setTestDoc] = useState(null);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState({});
  const [readDone, setReadDone] = useState({});
  const [testMsg, setTestMsg] = useState('');

  useEffect(() => {
    if (!user?.id) return;
    setResults(getUserTests(user.id));
    setReadDone(getUserRead(user.id));
  }, [user?.id]);

  const questions = useMemo(() => TEST_QUESTIONS.default, []);

  const openTestForDoc = (doc) => {
    if (isIntern && !readDone[String(doc.id)]?.done) return;
    setTestDoc(doc);
    setAnswers({});
    setTestMsg('');
  };

  const completeReading = () => {
    if (!user?.id || !previewDoc) return;
    setUserRead(user.id, previewDoc.id);
    setReadDone(getUserRead(user.id));
  };

  const submitTest = () => {
    if (!user?.id || !testDoc) return;
    const total = questions.length;
    const correct = questions.reduce((sum, q) => sum + (Number(answers[q.id]) === q.correct ? 1 : 0), 0);
    const score = Math.round((correct / total) * 100);
    const passed = score >= 70;
    const result = { passed, score, at: new Date().toLocaleString('ru-RU') };
    setUserTestResult(user.id, testDoc.id, result);
    setResults(r => ({ ...r, [String(testDoc.id)]: result }));
    setTestMsg(passed ? `Тест пройден: ${score}%` : `Тест не пройден: ${score}%. Нужно минимум 70%.`);
  };

  return (
    <MainLayout title="Регламенты компании">
      <div className="page-header">
        <div>
          <div className="page-title">Внутренние регламенты и инструкции</div>
          <div className="page-subtitle">Изучайте документы, правила и стандарты компании</div>
        </div>
      </div>

      <div className="reg-grid">
        {REGULATIONS.map(reg => {
          const { icon, color } = typeIcon(reg.type);
          const testResult = results[String(reg.id)];
          const readMarked = Boolean(readDone[String(reg.id)]?.done);
          const overdue = isIntern && !readMarked && isDeadlinePassed(reg.deadline);
          return (
            <div key={reg.id} className="reg-card">
              <div className="reg-icon" style={{ background: color }}>
                <span style={{ fontSize: 20 }}>{icon}</span>
              </div>
              <div className="reg-title">{reg.title}</div>
              <div className="reg-desc">{reg.desc}</div>
              <div style={{ marginBottom: 8, fontSize: 12, color: overdue ? 'var(--danger)' : 'var(--gray-500)' }}>
                Дедлайн прочтения: {formatDeadline(reg.deadline)}
                {overdue ? ' (просрочено)' : ''}
              </div>

              {isIntern && reg.type === 'pdf' && (
                <div style={{ marginBottom: 8, fontSize: 12 }}>
                  {testResult?.passed
                    ? <span style={{ color: 'var(--success)' }}>Тест пройден ({testResult.score}%)</span>
                    : !readMarked
                      ? <span style={{ color: 'var(--gray-500)' }}>Сначала нажмите «Закончил чтение»</span>
                      : <span style={{ color: 'var(--gray-500)' }}>Можно пройти тест</span>}
                </div>
              )}

              <div className="reg-action">
                {reg.type === 'link'
                  ? <a
                      className="btn btn-outline btn-sm"
                      style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}
                      href={encodeURI(reg.url || '#')}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ExternalLink size={13} /> {reg.url ? 'Открыть в Notion' : 'Перейти к инструкции'}
                    </a>
                  : (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button
                        className="btn btn-outline btn-sm"
                        style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}
                        onClick={() => setPreviewDoc(reg)}
                      >
                        <Globe size={13} /> Читать на сайте
                      </button>
                      {isIntern && reg.type === 'pdf' && readMarked && (
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}
                          onClick={() => openTestForDoc(reg)}
                        >
                          Пройти тест
                        </button>
                      )}
                      <a
                        className="btn btn-primary btn-sm"
                        style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}
                        href={encodeURI(reg.url || '#')}
                        target="_blank"
                        rel="noreferrer"
                        download
                      >
                        <Download size={13} /> Скачать {reg.type?.toUpperCase()} ({reg.size})
                      </a>
                    </div>
                  )
                }
              </div>
            </div>
          );
        })}
      </div>

      {previewDoc && (
        <div className="modal-overlay" onClick={() => setPreviewDoc(null)}>
          <div
            className="modal"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: 980, width: 'calc(100vw - 40px)', height: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column' }}
          >
            <div className="modal-header">
              <div className="modal-title">{previewDoc.title}</div>
              <button className="btn btn-secondary btn-sm" onClick={() => setPreviewDoc(null)}>Закрыть</button>
            </div>
            <div className="modal-body" style={{ flex: 1, minHeight: 0 }}>
              <iframe
                src={encodeURI(previewDoc.url || '')}
                title={previewDoc.title}
                style={{ width: '100%', height: '100%', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)' }}
              />
            </div>
            <div className="modal-footer">
              {isIntern && previewDoc.type === 'pdf' && (
                <>
                  <button className="btn btn-secondary btn-sm" onClick={completeReading}>
                    Закончил чтение
                  </button>
                  {readDone[String(previewDoc.id)]?.done && (
                    <button className="btn btn-secondary btn-sm" onClick={() => openTestForDoc(previewDoc)}>
                      Перейти к тесту
                    </button>
                  )}
                </>
              )}
              <a
                className="btn btn-primary btn-sm"
                href={encodeURI(previewDoc.url || '#')}
                target="_blank"
                rel="noreferrer"
                download
              >
                <Download size={13} /> Скачать файл
              </a>
            </div>
          </div>
        </div>
      )}

      {testDoc && (
        <div className="modal-overlay" onClick={() => setTestDoc(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 760 }}>
            <div className="modal-header">
              <div className="modal-title">Тест по регламенту: {testDoc.title}</div>
              <button className="btn btn-secondary btn-sm" onClick={() => setTestDoc(null)}>Закрыть</button>
            </div>
            <div className="modal-body">
              {questions.map((q, idx) => (
                <div key={q.id} style={{ marginBottom: 14 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>{idx + 1}. {q.text}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {q.options.map((opt, i) => (
                      <label key={opt} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
                        <input
                          type="radio"
                          name={q.id}
                          checked={Number(answers[q.id]) === i}
                          onChange={() => setAnswers(a => ({ ...a, [q.id]: i }))}
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              {testMsg && (
                <div style={{ fontSize: 13, color: testMsg.includes('пройден') ? 'var(--success)' : 'var(--danger)' }}>
                  {testMsg}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary btn-sm" onClick={submitTest}>Проверить тест</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 40, borderTop: '1px solid var(--gray-200)', paddingTop: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr 1fr 1fr', gap: 32, alignItems: 'start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 28, height: 28, background: 'var(--primary)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <span style={{ fontWeight: 700, fontSize: 15 }}>В Плюсе</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>© 2025 В Плюсе. Все права защищены.</div>
          </div>
          {[
            { label: 'ОФИС', items: ['г. Бишкек, ул. Исанова 1'] },
            { label: 'ЧАСЫ РАБОТЫ', items: ['Пн-Пт: 09:00 – 21:00', 'Сб: 10:00 – 18:00'] },
            { label: 'КОНТАКТЫ', items: ['+996 (555) 00-00-00'] },
          ].map(col => (
            <div key={col.label}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{col.label}</div>
              {col.items.map(item => <div key={item} style={{ fontSize: 13, color: 'var(--gray-600)', marginBottom: 4 }}>{item}</div>)}
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
