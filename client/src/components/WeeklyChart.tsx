interface WeeklyData {
  week_number: number;
  total_distance: number;
  checkin_count: number;
  avg_feeling?: number;
}

interface Props {
  data: WeeklyData[];
  totalWeeks?: number;
}

export default function WeeklyChart({ data, totalWeeks = 12 }: Props) {
  const maxDist = Math.max(
    ...data.map(d => d.total_distance),
    10 // minimum scale
  );

  const chartHeight = 200;
  const chartWidth = Math.max(totalWeeks * 60, 400);

  // Build a map for quick lookup
  const dataMap = new Map(data.map(d => [d.week_number, d]));

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ width: chartWidth, minWidth: 400 }}>
        {/* Y-axis + bars */}
        <div style={{ display: 'flex', height: chartHeight, alignItems: 'flex-end', gap: 4, marginBottom: 8 }}>
          {Array.from({ length: totalWeeks }, (_, i) => i + 1).map(week => {
            const d = dataMap.get(week);
            const dist = d?.total_distance || 0;
            const barHeight = maxDist > 0 ? (dist / maxDist) * (chartHeight - 30) : 0;

            return (
              <div key={week} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {dist > 0 && (
                  <div style={{
                    fontSize: 11,
                    color: 'var(--gray-600)',
                    marginBottom: 4,
                    fontWeight: 500,
                  }}>
                    {dist.toFixed(1)}
                  </div>
                )}
                <div style={{
                  width: '100%',
                  maxWidth: 40,
                  height: Math.max(barHeight, 2),
                  background: dist > 0
                    ? (d?.avg_feeling && d.avg_feeling >= 3.5 ? 'var(--primary)' : d?.avg_feeling && d.avg_feeling >= 2.5 ? 'var(--warning)' : 'var(--danger)')
                    : 'var(--gray-200)',
                  borderRadius: '4px 4px 0 0',
                  transition: 'height 0.3s ease',
                }} />
              </div>
            );
          })}
        </div>

        {/* X-axis labels */}
        <div style={{ display: 'flex', gap: 4 }}>
          {Array.from({ length: totalWeeks }, (_, i) => i + 1).map(week => (
            <div key={week} style={{
              flex: 1,
              textAlign: 'center',
              fontSize: 12,
              color: 'var(--gray-500)',
              borderTop: '1px solid var(--gray-200)',
              paddingTop: 4,
            }}>
              W{week}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 12, color: 'var(--gray-500)' }}>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, background: 'var(--primary)', borderRadius: 2, marginRight: 4 }} />感觉好</span>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, background: 'var(--warning)', borderRadius: 2, marginRight: 4 }} />一般</span>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, background: 'var(--danger)', borderRadius: 2, marginRight: 4 }} />较吃力</span>
      </div>
    </div>
  );
}
