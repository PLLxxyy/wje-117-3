import { useState, useEffect, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';

export default function Checkin() {
  const { planDayId } = useParams<{ planDayId: string }>();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<any>(null);
  const [day, setDay] = useState<any>(null);
  const [existingCheckin, setExistingCheckin] = useState<any>(null);
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [feeling, setFeeling] = useState(3);
  const [notes, setNotes] = useState('');
  const [shoes, setShoes] = useState<any[]>([]);
  const [selectedShoeId, setSelectedShoeId] = useState<string>('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [planDayId]);

  async function loadData() {
    try {
      const [activePlan, shoesData] = await Promise.all([
        api.getActivePlan(),
        api.getShoes(),
      ]);

      if (!activePlan) {
        navigate('/calendar');
        return;
      }
      setPlan(activePlan);
      setShoes(shoesData.filter((s: any) => s.status === 'active'));

      const targetDay = activePlan.days?.find((d: any) => d.id === Number(planDayId));
      if (!targetDay) {
        navigate('/calendar');
        return;
      }
      setDay(targetDay);

      // Check for existing checkin
      const existing = activePlan.checkins?.find((c: any) => c.plan_day_id === Number(planDayId));
      if (existing) {
        setExistingCheckin(existing);
        setDistance(String(existing.actual_distance_km));
        setDuration(String(existing.actual_duration_minutes));
        setFeeling(existing.feeling);
        setNotes(existing.notes || '');
        setSelectedShoeId(existing.shoe_id ? String(existing.shoe_id) : '');
      } else {
        // Pre-fill with target values
        setDistance(String(targetDay.target_distance_km));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await api.createCheckin({
        plan_id: plan.id,
        plan_day_id: Number(planDayId),
        actual_distance_km: Number(distance),
        actual_duration_minutes: Number(duration),
        feeling,
        notes,
        shoe_id: selectedShoeId ? Number(selectedShoeId) : null,
      });
      navigate('/calendar');
    } catch (err: any) {
      setError(err.message || '打卡失败');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !day) {
    return <div className="empty-state"><p>加载中...</p></div>;
  }

  if (day.workout_type === 'rest') {
    return (
      <div className="empty-state">
        <h3>今天是休息日</h3>
        <p>好好恢复身体，明天继续！</p>
        <button className="btn btn-outline" style={{ marginTop: 16 }} onClick={() => navigate('/calendar')}>
          返回日历
        </button>
      </div>
    );
  }

  const actualPace = distance && duration ? (Number(duration) / Number(distance)).toFixed(1) : '-';

  return (
    <div style={{ maxWidth: 500, margin: '0 auto' }}>
      <h1 className="page-title">{existingCheckin ? '更新打卡' : '训练打卡'}</h1>

      {/* Workout info */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{day.description}</h3>
        <div style={{ display: 'flex', gap: 20, color: 'var(--gray-500)', fontSize: 14 }}>
          <span>目标：{day.target_distance_km} km</span>
          {day.target_pace && <span>配速：{day.target_pace}/km</span>}
        </div>
      </div>

      <div className="card">
        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>实际距离（公里）</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={distance}
              onChange={e => setDistance(e.target.value)}
              placeholder="例：10.5"
              required
            />
          </div>

          <div className="input-group">
            <label>实际用时（分钟）</label>
            <input
              type="number"
              min="1"
              value={duration}
              onChange={e => setDuration(e.target.value)}
              placeholder="例：60"
              required
            />
          </div>

          {distance && duration && Number(distance) > 0 && (
            <div style={{
              background: 'var(--gray-50)',
              padding: 12,
              borderRadius: 8,
              marginBottom: 16,
              fontSize: 14,
            }}>
              实际配速：<strong>{actualPace} 分钟/公里</strong>
              {day.target_pace && (
                <span style={{ marginLeft: 12, color: 'var(--gray-500)' }}>
                  (目标 {day.target_pace}/km)
                </span>
              )}
            </div>
          )}

          <div className="input-group">
            <label>身体感受</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[1, 2, 3, 4, 5].map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setFeeling(v)}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 8,
                    border: `2px solid ${feeling >= v ? 'var(--warning)' : 'var(--gray-200)'}`,
                    background: feeling >= v ? 'var(--warning-light)' : 'white',
                    fontSize: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}
                >
                  {'★'}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 4 }}>
              {feeling <= 1 ? '非常吃力' : feeling === 2 ? '比较吃力' : feeling === 3 ? '一般' : feeling === 4 ? '状态不错' : '状态极佳'}
            </div>
          </div>

          <div className="input-group">
            <label>穿着跑鞋</label>
            {shoes.length > 0 ? (
              <select
                value={selectedShoeId}
                onChange={e => setSelectedShoeId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--gray-200)',
                  borderRadius: 8,
                  fontSize: 14,
                  background: 'white',
                  cursor: 'pointer',
                }}
              >
                <option value="">不选择</option>
                {shoes.map(shoe => (
                  <option key={shoe.id} value={shoe.id}>
                    {shoe.name} {shoe.brand ? `(${shoe.brand})` : ''} - 累计 {shoe.total_distance.toFixed(1)}km
                  </option>
                ))}
              </select>
            ) : (
              <div style={{
                padding: '12px',
                background: 'var(--gray-50)',
                borderRadius: 8,
                fontSize: 13,
                color: 'var(--gray-500)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span>还没有添加跑鞋</span>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => navigate('/shoes')}
                >
                  去添加
                </button>
              </div>
            )}
          </div>

          <div className="input-group">
            <label>训练笔记（选填）</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="记录训练感受、天气、装备等..."
              rows={3}
            />
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => navigate('/calendar')}>
              取消
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={submitting}>
              {submitting ? '提交中...' : existingCheckin ? '更新打卡' : '完成打卡'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
