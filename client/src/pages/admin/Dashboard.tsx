import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEvent, setNewEvent] = useState({ name: '', city: '', date: '', type: 'half' });
  const [showEventForm, setShowEventForm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [s, u, e] = await Promise.all([
        api.getAdminStats(),
        api.getUsers(),
        api.getEvents(),
      ]);
      setStats(s);
      setUsers(u);
      setEvents(e);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(userId: number, role: string) {
    try {
      await api.updateUserRole(userId, role);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleDeleteUser(userId: number) {
    if (!confirm('确定删除此用户？')) return;
    try {
      await api.deleteUser(userId);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleAddEvent(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.createEvent(newEvent);
      setNewEvent({ name: '', city: '', date: '', type: 'half' });
      setShowEventForm(false);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleDeleteEvent(eventId: number) {
    if (!confirm('确定删除此赛事？')) return;
    try {
      await api.deleteEvent(eventId);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  }

  if (loading) {
    return <div className="empty-state"><p>加载中...</p></div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>后台管理</h1>
        <Link to="/admin/templates" className="btn btn-outline">模板管理</Link>
      </div>

      {/* Stats cards */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}>
          {[
            { label: '注册用户', value: stats.totalUsers, color: 'var(--primary)' },
            { label: '教练数', value: stats.totalCoaches, color: '#7c3aed' },
            { label: '训练计划', value: stats.totalPlans, color: 'var(--success)' },
            { label: '活跃计划', value: stats.activePlans, color: 'var(--warning)' },
            { label: '打卡记录', value: stats.totalCheckins, color: 'var(--danger)' },
          ].map((item, i) => (
            <div key={i} className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{item.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: item.color }}>{item.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Users */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>用户管理</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--gray-200)' }}>
                <th style={{ textAlign: 'left', padding: '10px 8px', color: 'var(--gray-600)' }}>ID</th>
                <th style={{ textAlign: 'left', padding: '10px 8px', color: 'var(--gray-600)' }}>用户名</th>
                <th style={{ textAlign: 'left', padding: '10px 8px', color: 'var(--gray-600)' }}>邮箱</th>
                <th style={{ textAlign: 'left', padding: '10px 8px', color: 'var(--gray-600)' }}>角色</th>
                <th style={{ textAlign: 'left', padding: '10px 8px', color: 'var(--gray-600)' }}>注册时间</th>
                <th style={{ textAlign: 'left', padding: '10px 8px', color: 'var(--gray-600)' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                  <td style={{ padding: '10px 8px' }}>{u.id}</td>
                  <td style={{ padding: '10px 8px', fontWeight: 500 }}>{u.username}</td>
                  <td style={{ padding: '10px 8px' }}>{u.email}</td>
                  <td style={{ padding: '10px 8px' }}>
                    <select
                      value={u.role}
                      onChange={e => handleRoleChange(u.id, e.target.value)}
                      style={{
                        padding: '4px 8px',
                        border: '1px solid var(--gray-300)',
                        borderRadius: 4,
                        fontSize: 13,
                      }}
                    >
                      <option value="user">跑者</option>
                      <option value="coach">教练</option>
                      <option value="admin">管理员</option>
                    </select>
                  </td>
                  <td style={{ padding: '10px 8px', color: 'var(--gray-500)', fontSize: 13 }}>
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '10px 8px' }}>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteUser(u.id)}
                      style={{ fontSize: 12 }}
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Events */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>赛事管理</h3>
          <button className="btn btn-primary btn-sm" onClick={() => setShowEventForm(!showEventForm)}>
            {showEventForm ? '取消' : '添加赛事'}
          </button>
        </div>

        {showEventForm && (
          <form onSubmit={handleAddEvent} style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 100px 80px',
            gap: 8,
            marginBottom: 16,
            padding: 12,
            background: 'var(--gray-50)',
            borderRadius: 'var(--radius)',
          }}>
            <input
              placeholder="赛事名称"
              value={newEvent.name}
              onChange={e => setNewEvent({ ...newEvent, name: e.target.value })}
              required
              style={{ padding: '8px 10px', border: '1px solid var(--gray-300)', borderRadius: 4, fontSize: 13 }}
            />
            <input
              placeholder="城市"
              value={newEvent.city}
              onChange={e => setNewEvent({ ...newEvent, city: e.target.value })}
              required
              style={{ padding: '8px 10px', border: '1px solid var(--gray-300)', borderRadius: 4, fontSize: 13 }}
            />
            <input
              type="date"
              value={newEvent.date}
              onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
              required
              style={{ padding: '8px 10px', border: '1px solid var(--gray-300)', borderRadius: 4, fontSize: 13 }}
            />
            <select
              value={newEvent.type}
              onChange={e => setNewEvent({ ...newEvent, type: e.target.value as any })}
              style={{ padding: '8px 10px', border: '1px solid var(--gray-300)', borderRadius: 4, fontSize: 13 }}
            >
              <option value="half">半马</option>
              <option value="full">全马</option>
            </select>
            <button type="submit" className="btn btn-primary btn-sm">保存</button>
          </form>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 12 }}>
          {events.map(e => (
            <div key={e.id} style={{
              padding: 14,
              border: '1px solid var(--gray-200)',
              borderRadius: 'var(--radius)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{e.name}</div>
                <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                  {e.city} · {e.date} · {e.type === 'full' ? '全马' : '半马'}
                </div>
              </div>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => handleDeleteEvent(e.id)}
                style={{ fontSize: 11 }}
              >
                删除
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
