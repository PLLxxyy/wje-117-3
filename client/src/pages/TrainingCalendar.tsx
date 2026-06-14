import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import CalendarDay from '../components/CalendarDay';

const DAY_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export default function TrainingCalendar() {
  const [plan, setPlan] = useState<any>(null);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [loading, setLoading] = useState(true);
  const [coachNotes, setCoachNotes] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadPlan();
    loadNotes();
  }, []);

  async function loadPlan() {
    try {
      const data = await api.getActivePlan();
      setPlan(data);
      if (data?.days?.length > 0) {
        // Find current week based on plan start
        const weeksActive = data.days.filter((d: any) => d.workout_type !== 'rest').length;
        const checkinWeeks = new Set(data.checkins?.map((c: any) => {
          const day = data.days.find((d: any) => d.id === c.plan_day_id);
          return day?.week_number;
        }) || []);
        // Set to next unchecked week or max week
        let maxCheckedWeek = 0;
        checkinWeeks.forEach(w => { if (w && w > maxCheckedWeek) maxCheckedWeek = w; });
        setCurrentWeek(Math.min(maxCheckedWeek + 1, 12));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadNotes() {
    try {
      const notes = await api.getReceivedNotes();
      setCoachNotes(notes);
    } catch {
      // ignore
    }
  }

  if (loading) {
    return <div className="empty-state"><p>加载中...</p></div>;
  }

  if (!plan) {
    return (
      <div className="empty-state">
        <h3>还没有训练计划</h3>
        <p>创建一个训练计划，开始你的马拉松之旅！</p>
        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/create-plan')}>
          创建训练计划
        </button>
      </div>
    );
  }

  const weekDays = plan.days?.filter((d: any) => d.week_number === currentWeek) || [];
  const checkinMap = new Map<number, any>();
  plan.checkins?.forEach((c: any) => {
    checkinMap.set(c.plan_day_id, c);
  });

  const totalWeeks = 12;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>训练日历</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="badge badge-primary">
            {plan.target_event === 'full' ? '全程马拉松' : '半程马拉松'}
          </span>
          <span className="badge badge-warning">
            目标 {Math.floor(plan.target_time / 60)}:{(plan.target_time % 60).toString().padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Week navigation */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
        background: 'white',
        padding: '12px 20px',
        borderRadius: 'var(--radius)',
        boxShadow: 'var(--shadow)',
      }}>
        <button
          className="btn btn-outline btn-sm"
          onClick={() => setCurrentWeek(Math.max(1, currentWeek - 1))}
          disabled={currentWeek <= 1}
        >
          上一周
        </button>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>
          第 {currentWeek} 周 / 共 {totalWeeks} 周
        </h2>
        <button
          className="btn btn-outline btn-sm"
          onClick={() => setCurrentWeek(Math.min(totalWeeks, currentWeek + 1))}
          disabled={currentWeek >= totalWeeks}
        >
          下一周
        </button>
      </div>

      {/* Week progress indicator */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        {Array.from({ length: totalWeeks }, (_, i) => i + 1).map(week => {
          const weekCheckins = plan.days
            ?.filter((d: any) => d.week_number === week && d.workout_type !== 'rest')
            .filter((d: any) => checkinMap.has(d.id)) || [];
          const weekTotal = plan.days?.filter((d: any) => d.week_number === week && d.workout_type !== 'rest') || [];
          const isComplete = weekCheckins.length === weekTotal.length && weekTotal.length > 0;
          const isPartial = weekCheckins.length > 0 && !isComplete;

          return (
            <div
              key={week}
              onClick={() => setCurrentWeek(week)}
              style={{
                flex: 1,
                height: 6,
                borderRadius: 3,
                background: isComplete ? 'var(--success)' : isPartial ? 'var(--warning)' : currentWeek === week ? 'var(--primary)' : 'var(--gray-200)',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              title={`第${week}周`}
            />
          );
        })}
      </div>

      {/* Calendar grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: 8,
        marginBottom: 24,
      }}>
        {DAY_LABELS.map(label => (
          <div key={label} style={{
            textAlign: 'center',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--gray-500)',
            padding: '8px 0',
          }}>
            {label}
          </div>
        ))}

        {Array.from({ length: 7 }, (_, i) => i + 1).map(dayNum => {
          const day = weekDays.find((d: any) => d.day_number === dayNum);
          if (!day) {
            return <div key={dayNum} style={{ minHeight: 80 }} />;
          }
          const checkin = checkinMap.get(day.id);
          return (
            <CalendarDay
              key={dayNum}
              day={day}
              checkin={checkin}
              isToday={new Date().getDay() === (dayNum % 7)}
              onClick={() => navigate(`/checkin/${day.id}`)}
            />
          );
        })}
      </div>

      {/* Coach notes */}
      {coachNotes.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>教练留言</h3>
          {coachNotes.slice(0, 3).map((note: any) => (
            <div key={note.id} style={{
              padding: '10px 0',
              borderBottom: '1px solid var(--gray-100)',
            }}>
              <div style={{ fontSize: 13, color: 'var(--gray-600)' }}>
                <strong>{note.coach_name}</strong>
                <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--gray-400)' }}>
                  {new Date(note.created_at).toLocaleDateString()}
                </span>
              </div>
              <p style={{ marginTop: 4, fontSize: 14 }}>{note.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--gray-500)' }}>
        <span><span style={{ display: 'inline-block', width: 12, height: 12, background: '#dcfce7', border: '2px solid #86efac', borderRadius: 4, marginRight: 4 }} />已完成</span>
        <span><span style={{ display: 'inline-block', width: 12, height: 12, background: 'white', border: '2px solid var(--gray-200)', borderRadius: 4, marginRight: 4 }} />未完成</span>
        <span><span style={{ display: 'inline-block', width: 12, height: 12, background: 'var(--gray-50)', border: '2px solid var(--gray-200)', borderRadius: 4, marginRight: 4 }} />休息日</span>
      </div>
    </div>
  );
}
