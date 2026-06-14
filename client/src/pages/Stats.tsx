import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import WeeklyChart from '../components/WeeklyChart';

export default function Stats() {
  const [plan, setPlan] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [recentCheckins, setRecentCheckins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const activePlan = await api.getActivePlan();
      if (!activePlan) {
        setLoading(false);
        return;
      }
      setPlan(activePlan);

      const [statsData, recent] = await Promise.all([
        api.getStats(activePlan.id),
        api.getRecentCheckins(),
      ]);

      setStats(statsData);
      setRecentCheckins(recent);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="empty-state"><p>加载中...</p></div>;
  }

  if (!plan) {
    return (
      <div className="empty-state">
        <h3>暂无统计数据</h3>
        <p>创建训练计划并开始打卡后，这里会展示你的跑量统计</p>
        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/create-plan')}>
          创建训练计划
        </button>
      </div>
    );
  }

  const totals = stats?.totals || {};

  return (
    <div>
      <h1 className="page-title">跑量统计</h1>

      {/* Summary cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 16,
        marginBottom: 24,
      }}>
        {[
          { label: '总距离', value: `${(totals.total_distance || 0).toFixed(1)} km`, color: 'var(--primary)' },
          { label: '总时长', value: `${Math.round(totals.total_duration || 0)} 分钟`, color: 'var(--success)' },
          { label: '打卡次数', value: `${totals.total_checkins || 0} 次`, color: '#7c3aed' },
          { label: '平均感受', value: `${(totals.avg_feeling || 0).toFixed(1)} ★`, color: 'var(--warning)' },
        ].map((item, i) => (
          <div key={i} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 4 }}>{item.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: item.color }}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* Weekly chart */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>每周跑量趋势</h3>
        {stats?.weeklyStats?.length > 0 ? (
          <WeeklyChart data={stats.weeklyStats} totalWeeks={plan.total_weeks || 12} />
        ) : (
          <p style={{ color: 'var(--gray-500)', textAlign: 'center', padding: 40 }}>
            还没有打卡记录，开始训练后这里会展示图表
          </p>
        )}
      </div>

      {/* Recent checkins */}
      <div className="card">
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>最近训练记录</h3>
        {recentCheckins.length > 0 ? (
          <div>
            {recentCheckins.map((c: any) => (
              <div key={c.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 0',
                borderBottom: '1px solid var(--gray-100)',
              }}>
                <div>
                  <div style={{ fontWeight: 500 }}>
                    第{c.week_number}周 · {['周日', '周一', '周二', '周三', '周四', '周五', '周六'][c.day_number % 7]}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 2 }}>
                    {c.description?.split(' - ')[0] || c.workout_type}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 600 }}>{c.actual_distance_km} km</div>
                  <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>
                    {c.actual_duration_minutes} 分 · {'★'.repeat(c.feeling)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--gray-500)', textAlign: 'center', padding: 20 }}>
            暂无训练记录
          </p>
        )}
      </div>
    </div>
  );
}
