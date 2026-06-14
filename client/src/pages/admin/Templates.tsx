import { useState, useEffect } from 'react';
import { api } from '../../api/client';

export default function Templates() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: '',
    level: 'beginner',
    distance: 'half',
    weeks: 12,
    description: '',
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    try {
      const data = await api.getTemplates();
      setTemplates(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateTemplate(editingId, form);
      } else {
        await api.createTemplate(form);
      }
      resetForm();
      loadTemplates();
    } catch (err: any) {
      alert(err.message || '操作失败');
    }
  }

  function resetForm() {
    setForm({ name: '', level: 'beginner', distance: 'half', weeks: 12, description: '' });
    setShowForm(false);
    setEditingId(null);
  }

  function startEdit(template: any) {
    setForm({
      name: template.name,
      level: template.level,
      distance: template.distance,
      weeks: template.weeks,
      description: template.description || '',
    });
    setEditingId(template.id);
    setShowForm(true);
  }

  async function handleDelete(id: number) {
    if (!confirm('确定删除此模板？')) return;
    try {
      await api.deleteTemplate(id);
      loadTemplates();
    } catch (err: any) {
      alert(err.message);
    }
  }

  if (loading) {
    return <div className="empty-state"><p>加载中...</p></div>;
  }

  const levelLabels: Record<string, string> = { beginner: '入门', intermediate: '中级', advanced: '进阶' };
  const distanceLabels: Record<string, string> = { half: '半马', full: '全马' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>训练模板管理</h1>
        <button
          className="btn btn-primary"
          onClick={() => { resetForm(); setShowForm(!showForm); }}
        >
          {showForm ? '取消' : '新建模板'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
            {editingId ? '编辑模板' : '新建模板'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="input-group">
                <label>模板名称</label>
                <input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="例：初马完赛计划"
                  required
                />
              </div>
              <div className="input-group">
                <label>训练周数</label>
                <input
                  type="number"
                  min={4}
                  max={24}
                  value={form.weeks}
                  onChange={e => setForm({ ...form, weeks: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="input-group">
                <label>适用水平</label>
                <select value={form.level} onChange={e => setForm({ ...form, level: e.target.value })}>
                  <option value="beginner">入门</option>
                  <option value="intermediate">中级</option>
                  <option value="advanced">进阶</option>
                </select>
              </div>
              <div className="input-group">
                <label>赛事距离</label>
                <select value={form.distance} onChange={e => setForm({ ...form, distance: e.target.value })}>
                  <option value="half">半马</option>
                  <option value="full">全马</option>
                </select>
              </div>
            </div>
            <div className="input-group">
              <label>模板说明</label>
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="描述此模板的适用人群和训练特点..."
                rows={3}
              />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" className="btn btn-outline" onClick={resetForm}>取消</button>
              <button type="submit" className="btn btn-primary">
                {editingId ? '保存修改' : '创建模板'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: 16,
      }}>
        {templates.map(t => (
          <div key={t.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>{t.name}</h3>
              <div style={{ display: 'flex', gap: 4 }}>
                <span className="badge badge-primary">{levelLabels[t.level] || t.level}</span>
                <span className="badge badge-warning">{distanceLabels[t.distance] || t.distance}</span>
              </div>
            </div>
            <p style={{ color: 'var(--gray-600)', fontSize: 14, marginBottom: 12, lineHeight: 1.5 }}>
              {t.description || '暂无说明'}
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>
                {t.weeks} 周 · 创建者：{t.creator_name}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-outline btn-sm" onClick={() => startEdit(t)}>编辑</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(t.id)}>删除</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="empty-state">
          <h3>暂无训练模板</h3>
          <p>点击"新建模板"开始创建</p>
        </div>
      )}
    </div>
  );
}
