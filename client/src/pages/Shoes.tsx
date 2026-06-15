import { useState, useEffect, FormEvent } from 'react';
import { api } from '../api/client';

interface Shoe {
  id: number;
  name: string;
  brand: string;
  purchase_date: string;
  initial_mileage_km: number;
  status: 'active' | 'retired';
  notes: string;
  total_distance: number;
  created_at: string;
}

export default function Shoes() {
  const [shoes, setShoes] = useState<Shoe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingShoe, setEditingShoe] = useState<Shoe | null>(null);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [initialMileage, setInitialMileage] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadShoes();
  }, []);

  async function loadShoes() {
    try {
      setLoading(true);
      const data = await api.getShoes();
      setShoes(data as Shoe[]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setName('');
    setBrand('');
    setPurchaseDate('');
    setInitialMileage('');
    setNotes('');
    setError('');
    setShowForm(false);
    setEditingShoe(null);
  }

  function openAddForm() {
    resetForm();
    setShowForm(true);
  }

  function openEditForm(shoe: Shoe) {
    setEditingShoe(shoe);
    setName(shoe.name);
    setBrand(shoe.brand);
    setPurchaseDate(shoe.purchase_date);
    setInitialMileage(String(shoe.initial_mileage_km));
    setNotes(shoe.notes);
    setShowForm(true);
    setError('');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('请输入跑鞋名称');
      return;
    }

    try {
      const data = {
        name: name.trim(),
        brand: brand.trim(),
        purchase_date: purchaseDate,
        initial_mileage_km: Number(initialMileage) || 0,
        notes: notes.trim(),
      };

      if (editingShoe) {
        await api.updateShoe(editingShoe.id, data);
      } else {
        await api.createShoe(data);
      }

      resetForm();
      loadShoes();
    } catch (err: any) {
      setError(err.message || '保存失败');
    }
  }

  async function toggleStatus(shoe: Shoe) {
    try {
      const newStatus = shoe.status === 'active' ? 'retired' : 'active';
      await api.updateShoeStatus(shoe.id, newStatus);
      loadShoes();
    } catch (err: any) {
      console.error(err);
    }
  }

  async function handleDelete(shoe: Shoe) {
    if (!confirm(`确定要删除跑鞋"${shoe.name}"吗？删除后关联的打卡记录会保留但不再关联此跑鞋。`)) {
      return;
    }

    try {
      await api.deleteShoe(shoe.id);
      loadShoes();
    } catch (err: any) {
      console.error(err);
      alert('删除失败');
    }
  }

  const activeShoes = shoes.filter(s => s.status === 'active');
  const retiredShoes = shoes.filter(s => s.status === 'retired');

  if (loading) {
    return <div className="empty-state"><p>加载中...</p></div>;
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 className="page-title" style={{ margin: 0 }}>装备管理</h1>
        <button className="btn btn-primary" onClick={openAddForm}>
          + 添加跑鞋
        </button>
      </div>

      {error && <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
            {editingShoe ? '编辑跑鞋' : '添加跑鞋'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="input-group">
                <label>跑鞋名称 *</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="例：Vaporfly Next% 2"
                  required
                />
              </div>
              <div className="input-group">
                <label>品牌</label>
                <input
                  type="text"
                  value={brand}
                  onChange={e => setBrand(e.target.value)}
                  placeholder="例：Nike"
                />
              </div>
              <div className="input-group">
                <label>购入日期</label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={e => setPurchaseDate(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label>初始里程（公里）</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={initialMileage}
                  onChange={e => setInitialMileage(e.target.value)}
                  placeholder="购入时已有的里程"
                />
              </div>
            </div>
            <div className="input-group">
              <label>备注</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="跑鞋特点、使用场景等..."
                rows={2}
              />
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-outline" onClick={resetForm}>
                取消
              </button>
              <button type="submit" className="btn btn-primary">
                {editingShoe ? '保存' : '添加'}
              </button>
            </div>
          </form>
        </div>
      )}

      {shoes.length === 0 && !showForm ? (
        <div className="empty-state">
          <div style={{ fontSize: 48, marginBottom: 16 }}>&#128095;</div>
          <h3>还没有跑鞋</h3>
          <p>添加你的跑鞋，记录每双鞋的累计跑量</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openAddForm}>
            添加第一双跑鞋
          </button>
        </div>
      ) : (
        <>
          {activeShoes.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-600)', marginBottom: 12 }}>
                使用中 ({activeShoes.length})
              </h2>
              <div style={{ display: 'grid', gap: 12 }}>
                {activeShoes.map(shoe => (
                  <ShoeCard
                    key={shoe.id}
                    shoe={shoe}
                    onEdit={openEditForm}
                    onToggleStatus={toggleStatus}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {retiredShoes.length > 0 && (
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-600)', marginBottom: 12 }}>
                已退役 ({retiredShoes.length})
              </h2>
              <div style={{ display: 'grid', gap: 12 }}>
                {retiredShoes.map(shoe => (
                  <ShoeCard
                    key={shoe.id}
                    shoe={shoe}
                    onEdit={openEditForm}
                    onToggleStatus={toggleStatus}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ShoeCard({ shoe, onEdit, onToggleStatus, onDelete }: {
  shoe: Shoe;
  onEdit: (shoe: Shoe) => void;
  onToggleStatus: (shoe: Shoe) => void;
  onDelete: (shoe: Shoe) => void;
}) {
  const isRetired = shoe.status === 'retired';
  const mileagePercent = Math.min((shoe.total_distance / 800) * 100, 100);

  return (
    <div className="card" style={{ opacity: isRetired ? 0.6 : 1 }}>
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: 12,
          background: isRetired ? 'var(--gray-100)' : 'var(--primary-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 28,
          flexShrink: 0,
        }}>
          &#128095;
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h4 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
                {shoe.name}
                {isRetired && (
                  <span style={{
                    marginLeft: 8,
                    fontSize: 11,
                    background: 'var(--gray-100)',
                    color: 'var(--gray-500)',
                    padding: '2px 6px',
                    borderRadius: 4,
                    fontWeight: 500,
                  }}>
                    已退役
                  </span>
                )}
              </h4>
              {shoe.brand && (
                <div style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 2 }}>
                  {shoe.brand}
                  {shoe.purchase_date && ` · 购入于 ${shoe.purchase_date}`}
                </div>
              )}
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
              <span style={{ color: 'var(--gray-500)' }}>累计跑量</span>
              <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
                {shoe.total_distance.toFixed(1)} km
              </span>
            </div>
            <div style={{
              height: 6,
              background: 'var(--gray-100)',
              borderRadius: 3,
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                background: mileagePercent >= 90 ? 'var(--danger)' : mileagePercent >= 60 ? 'var(--warning)' : 'var(--primary)',
                borderRadius: 3,
                width: `${mileagePercent}%`,
                transition: 'width 0.3s',
              }} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4 }}>
              {shoe.total_distance >= 800 ? '建议更换' : `距 800km 还有 ${(800 - shoe.total_distance).toFixed(0)} km`}
            </div>
          </div>

          {shoe.notes && (
            <div style={{
              marginTop: 10,
              fontSize: 12,
              color: 'var(--gray-500)',
              background: 'var(--gray-50)',
              padding: '8px 10px',
              borderRadius: 6,
            }}>
              {shoe.notes}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => onEdit(shoe)}
            >
              编辑
            </button>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => onToggleStatus(shoe)}
            >
              {isRetired ? '恢复使用' : '标记退役'}
            </button>
            <button
              className="btn btn-outline btn-sm"
              style={{ color: 'var(--danger)', borderColor: 'var(--danger-light)' }}
              onClick={() => onDelete(shoe)}
            >
              删除
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
