import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

export default function CreatePlan() {
  const navigate = useNavigate();
  const [targetEvent, setTargetEvent] = useState<'full' | 'half'>('half');
  const [targetTime, setTargetTime] = useState(120);
  const [currentLevel, setCurrentLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [trainingDays, setTrainingDays] = useState(4);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.createPlan({
        target_event: targetEvent,
        target_time: targetTime,
        current_level: currentLevel,
        training_days: trainingDays,
      });
      navigate('/calendar');
    } catch (err: any) {
      setError(err.message || '创建计划失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <h1 className="page-title">创建训练计划</h1>

      <div className="card">
        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>目标赛事</label>
            <div style={{ display: 'flex', gap: 12 }}>
              {[
                { value: 'half' as const, label: '半程马拉松 (21.0975km)', time: '1:30-2:30' },
                { value: 'full' as const, label: '全程马拉松 (42.195km)', time: '3:00-5:30' },
              ].map(opt => (
                <div
                  key={opt.value}
                  onClick={() => {
                    setTargetEvent(opt.value);
                    setTargetTime(opt.value === 'half' ? 120 : 240);
                  }}
                  style={{
                    flex: 1,
                    padding: 16,
                    border: `2px solid ${targetEvent === opt.value ? 'var(--primary)' : 'var(--gray-200)'}`,
                    borderRadius: 8,
                    cursor: 'pointer',
                    background: targetEvent === opt.value ? 'var(--primary-light)' : 'white',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{opt.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 4 }}>
                    参考完赛时间：{opt.time}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="input-group">
            <label>目标完赛时间（分钟）</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="range"
                min={targetEvent === 'half' ? 60 : 150}
                max={targetEvent === 'half' ? 180 : 360}
                step={5}
                value={targetTime}
                onChange={e => setTargetTime(Number(e.target.value))}
                style={{ flex: 1 }}
              />
              <span style={{
                minWidth: 80,
                fontWeight: 700,
                fontSize: 18,
                color: 'var(--primary)',
              }}>
                {Math.floor(targetTime / 60)}:{(targetTime % 60).toString().padStart(2, '0')}
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 4 }}>
              目标配速约 {(targetTime / (targetEvent === 'full' ? 42.195 : 21.0975)).toFixed(1)} 分钟/公里
            </div>
          </div>

          <div className="input-group">
            <label>当前水平</label>
            <div style={{ display: 'flex', gap: 12 }}>
              {[
                { value: 'beginner' as const, label: '入门', desc: '刚开始跑步或跑龄不到1年' },
                { value: 'intermediate' as const, label: '中级', desc: '有规律训练，跑过半马' },
                { value: 'advanced' as const, label: '进阶', desc: '系统训练2年以上，追求PB' },
              ].map(opt => (
                <div
                  key={opt.value}
                  onClick={() => setCurrentLevel(opt.value)}
                  style={{
                    flex: 1,
                    padding: 14,
                    border: `2px solid ${currentLevel === opt.value ? 'var(--primary)' : 'var(--gray-200)'}`,
                    borderRadius: 8,
                    cursor: 'pointer',
                    background: currentLevel === opt.value ? 'var(--primary-light)' : 'white',
                    textAlign: 'center',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{opt.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 4 }}>{opt.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="input-group">
            <label>每周可训练天数：{trainingDays} 天</label>
            <input
              type="range"
              min={3}
              max={6}
              value={trainingDays}
              onChange={e => setTrainingDays(Number(e.target.value))}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--gray-500)' }}>
              <span>3天</span><span>4天</span><span>5天</span><span>6天</span>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
            {loading ? '生成中...' : '生成训练计划'}
          </button>
        </form>
      </div>
    </div>
  );
}
