import MainLayout from '../../layouts/MainLayout';
import { CONTENT_MODULES, REGULATIONS } from '../../data/mockData';
import { useState } from 'react';
import { Plus, Search, Pencil, Trash2, Link, Upload, ChevronRight } from 'lucide-react';

export default function AdminContent() {
  const [view, setView] = useState('hub'); // 'hub' or 'regulations'
  const selectedModule = CONTENT_MODULES.find((m) => m.id === view) || null;

  if (view === 'regulations') {
    return <RegulationsManage onBack={() => setView('hub')} />;
  }

  if (selectedModule) {
    return <GenericModuleManage module={selectedModule} onBack={() => setView('hub')} />;
  }

  return (
    <MainLayout title="Администрирование">
      <div className="page-header">
        <div className="page-title">Управление контентом</div>
        <div className="page-subtitle">Редактирование информации на страницах платформы</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {CONTENT_MODULES.map(mod => (
          <div key={mod.id} className="card" style={{ cursor: 'pointer', transition: 'all 0.15s' }}
            onClick={() => setView(mod.id)}>
            <div className="card-body">
              <div style={{ width: 52, height: 52, borderRadius: 'var(--radius-lg)', background: mod.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 14 }}>
                {mod.icon}
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{mod.title}</div>
              <p style={{ fontSize: 12, color: 'var(--gray-500)', lineHeight: 1.6, marginBottom: 14 }}>{mod.desc}</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: mod.id === 'welcome' ? 'var(--gray-500)' : mod.id === 'instruction' ? 'var(--success)' : 'var(--primary)', fontWeight: 500 }}>
                  {mod.stat}
                </span>
                <span style={{ fontSize: 13, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 3 }}>
                  {mod.link} <ChevronRight size={13} />
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </MainLayout>
  );
}

function GenericModuleManage({ module, onBack }) {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ title: '', desc: '' });

  const filtered = items.filter((d) => !search || d.title.toLowerCase().includes(search.toLowerCase()));

  const openCreate = () => {
    setEditId(null);
    setForm({ title: '', desc: '' });
  };

  const openEdit = (row) => {
    setEditId(row.id);
    setForm({ title: row.title, desc: row.desc || '' });
  };

  const save = () => {
    if (!form.title.trim()) return;
    if (editId) {
      setItems((prev) => prev.map((x) => (x.id === editId ? { ...x, title: form.title.trim(), desc: form.desc.trim(), date: 'сегодня' } : x)));
      return;
    }
    setItems((prev) => [
      { id: Date.now(), title: form.title.trim(), desc: form.desc.trim(), date: 'сегодня' },
      ...prev,
    ]);
  };

  const remove = (id) => setItems((prev) => prev.filter((x) => x.id !== id));

  return (
    <MainLayout title="Управление контентом">
      <div style={{ marginBottom: 16 }}>
        <button onClick={onBack} style={{ fontSize: 13, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          ← Контент
        </button>
      </div>
      <div className="page-header">
        <div>
          <div className="page-title">{module.title}</div>
          <div className="page-subtitle">{module.desc}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm" onClick={openCreate}><Plus size={13} /> Добавить запись</button>
          <button className="btn btn-primary btn-sm" onClick={save}><Upload size={13} /> Сохранить</button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-body" style={{ display: 'grid', gap: 10 }}>
          <input className="form-input" placeholder="Название" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <textarea className="form-textarea" placeholder="Описание" value={form.desc} onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))} />
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
            <input className="form-input" style={{ paddingLeft: 32 }} placeholder="Поиск по названию..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <span style={{ fontSize: 13, color: 'var(--gray-500)', flexShrink: 0 }}>{filtered.length} записей</span>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ЗАПИСЬ</th>
                <th>ОПИСАНИЕ</th>
                <th>ОБНОВЛЕНО</th>
                <th>ДЕЙСТВИЯ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id}>
                  <td style={{ fontWeight: 600 }}>{row.title}</td>
                  <td style={{ color: 'var(--gray-500)' }}>{row.desc || '—'}</td>
                  <td style={{ color: 'var(--gray-500)' }}>{row.date}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn-icon" onClick={() => openEdit(row)}><Pencil size={13} /></button>
                      <button className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => remove(row.id)}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  );
}

function RegulationsManage({ onBack }) {
  const [docs, setDocs] = useState(REGULATIONS.map((r, i) => ({
    id: i + 1,
    title: r.title,
    desc: r.desc,
    format: r.type === 'link' ? 'Внешняя ссылка' : r.type === 'pdf' ? `PDF, ${r.size}` : `DOCX, ${r.size}`,
    date: '25 окт. 2025',
  })));
  const [search, setSearch] = useState('');

  const filtered = docs.filter(d => !search || d.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <MainLayout title="Управление контентом">
      <div style={{ marginBottom: 16 }}>
        <button onClick={onBack} style={{ fontSize: 13, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          ← Контент
        </button>
      </div>
      <div className="page-header">
        <div>
          <div className="page-title">Регламенты и база знаний</div>
          <div className="page-subtitle">Загрузка документов, добавление внешних ссылок на регламенты.</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm"><Link size={13} /> Добавить ссылку</button>
          <button className="btn btn-primary btn-sm"><Upload size={13} /> Загрузить файл</button>
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
            <input className="form-input" style={{ paddingLeft: 32 }} placeholder="Поиск по названию..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <span style={{ fontSize: 13, color: 'var(--gray-500)', flexShrink: 0 }}>📄 {filtered.length} документа</span>
          <button className="btn btn-secondary btn-sm">Фильтры</button>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>НАЗВАНИЕ ДОКУМЕНТА</th>
                <th>ФОРМАТ</th>
                <th>ДАТА ИЗМЕНЕНИЯ</th>
                <th>ДЕЙСТВИЯ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(doc => (
                <tr key={doc.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 6, background: doc.format.includes('ссылка') ? '#EDE9FE' : doc.format.includes('PDF') ? '#FEE2E2' : '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 14 }}>{doc.format.includes('ссылка') ? '🔗' : '📄'}</span>
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{doc.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{doc.desc?.slice(0, 50)}...</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--gray-500)' }}>{doc.format}</td>
                  <td style={{ fontSize: 13, color: 'var(--gray-500)' }}>{doc.date}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn-icon"><Pencil size={13} /></button>
                      <button className="btn-icon" style={{ color: 'var(--danger)' }}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  );
}
