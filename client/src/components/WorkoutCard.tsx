interface Props {
  day: any;
  checkin?: any;
  onCheckin?: () => void;
}

const WORKOUT_LABELS: Record<string, string> = {
  easy_run: '轻松跑',
  interval: '间歇跑',
  long_run: '长距离跑',
  tempo: '节奏跑',
  rest: '休息日',
};

const WORKOUT_ICONS: Record<string, string> = {
  easy_run: '\u{1F3C3}',
  interval: '⚡',
  long_run: '\u{1F6E5}️',
  tempo: '\u{1F525}',
  rest: '\u{1F6CC}',
};

export default function WorkoutCard({ day, checkin, onCheckin }: Props) {
  const isRest = day.workout_type === 'rest';

  return (
    <div style={{
      background: 'white',
      borderRadius: 12,
      padding: 20,
      border: checkin ? '2px solid var(--success)' : '1px solid var(--gray-200)',
      boxShadow: 'var(--shadow)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 20 }}>{WORKOUT_ICONS[day.workout_type]}</span>
            <h3 style={{
              fontSize: 16,
              fontWeight: 600,
              color: `var(--gray-800)`,
            }}>
              {WORKOUT_LABELS[day.workout_type]}
            </h3>
          </div>
          <p style={{ color: 'var(--gray-600)', fontSize: 14, lineHeight: 1.5 }}>
            {day.description}
          </p>
        </div>

        {checkin && (
          <span className="badge badge-success">已完成</span>
        )}
      </div>

      {!isRest && (
        <div style={{
          display: 'flex',
          gap: 24,
          marginTop: 12,
          padding: '12px 0',
          borderTop: '1px solid var(--gray-100)',
        }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>目标距离</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{day.target_distance_km} km</div>
          </div>
          {day.target_pace && (
            <div>
              <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>目标配速</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{day.target_pace}/km</div>
            </div>
          )}
          {checkin && (
            <>
              <div>
                <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>实际距离</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--success)' }}>{checkin.actual_distance_km} km</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>实际用时</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--success)' }}>{checkin.actual_duration_minutes} 分</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>身体感受</div>
                <div style={{ fontSize: 18 }}>{'★'.repeat(checkin.feeling)}{'☆'.repeat(5 - checkin.feeling)}</div>
              </div>
            </>
          )}
        </div>
      )}

      {!isRest && !checkin && onCheckin && (
        <button onClick={onCheckin} className="btn btn-primary" style={{ marginTop: 12, width: '100%' }}>
          训练打卡
        </button>
      )}
    </div>
  );
}
