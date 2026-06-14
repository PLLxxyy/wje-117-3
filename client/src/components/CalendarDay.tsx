interface Props {
  day: any; // plan_day object
  checkin?: any; // checkin object if exists
  onClick?: () => void;
  isToday?: boolean;
}

const WORKOUT_LABELS: Record<string, string> = {
  easy_run: '轻松跑',
  interval: '间歇跑',
  long_run: '长距离',
  tempo: '节奏跑',
  rest: '休息',
};

const WORKOUT_COLORS: Record<string, string> = {
  easy_run: '#2563eb',
  interval: '#dc2626',
  long_run: '#7c3aed',
  tempo: '#ea580c',
  rest: '#9ca3af',
};

export default function CalendarDay({ day, checkin, onClick, isToday }: Props) {
  const isRest = day.workout_type === 'rest';
  const hasCheckin = !!checkin;
  const skipped = !isRest && !hasCheckin && isPastWeek(day);

  function isPastWeek(d: any): boolean {
    // Simplified: we just show visual state based on checkin presence
    return false;
  }

  let bgColor = 'white';
  let borderColor = 'var(--gray-200)';

  if (hasCheckin) {
    bgColor = '#dcfce7';
    borderColor = '#86efac';
  } else if (isRest) {
    bgColor = 'var(--gray-50)';
    borderColor = 'var(--gray-200)';
  } else if (skipped) {
    bgColor = '#f3f4f6';
    borderColor = '#d1d5db';
  }

  if (isToday) {
    borderColor = 'var(--primary)';
  }

  return (
    <div
      onClick={!isRest ? onClick : undefined}
      style={{
        background: bgColor,
        border: `2px solid ${borderColor}`,
        borderRadius: 8,
        padding: '8px 10px',
        minHeight: 80,
        cursor: !isRest ? 'pointer' : 'default',
        transition: 'all 0.15s',
        opacity: isRest ? 0.6 : 1,
      }}
    >
      <div style={{
        fontSize: 11,
        fontWeight: 600,
        color: WORKOUT_COLORS[day.workout_type],
        marginBottom: 4,
        textTransform: 'uppercase',
      }}>
        {WORKOUT_LABELS[day.workout_type]}
      </div>

      {day.target_distance_km > 0 && (
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--gray-800)' }}>
          {day.target_distance_km}
          <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--gray-500)' }}> km</span>
        </div>
      )}

      {day.target_pace && (
        <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>
          {day.target_pace}/km
        </div>
      )}

      {hasCheckin && (
        <div style={{
          marginTop: 6,
          fontSize: 11,
          color: 'var(--success)',
          fontWeight: 500,
        }}>
          {'✓'} {checkin.actual_distance_km}km
          {checkin.feeling && (
            <span style={{ marginLeft: 4 }}>
              {'★'.repeat(checkin.feeling)}
            </span>
          )}
        </div>
      )}

      {skipped && (
        <div style={{
          marginTop: 6,
          fontSize: 11,
          color: 'var(--gray-400)',
        }}>
          未打卡
        </div>
      )}
    </div>
  );
}
