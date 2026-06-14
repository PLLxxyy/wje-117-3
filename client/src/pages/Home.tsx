import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <div style={{
        textAlign: 'center',
        padding: '60px 20px',
        background: 'linear-gradient(135deg, var(--primary) 0%, #7c3aed 100%)',
        borderRadius: 16,
        color: 'white',
        marginBottom: 40,
      }}>
        <h1 style={{ fontSize: 40, fontWeight: 800, marginBottom: 12 }}>
          科学训练，跑出 PB
        </h1>
        <p style={{ fontSize: 18, opacity: 0.9, maxWidth: 500, margin: '0 auto 24px' }}>
          根据你的水平和目标，自动生成分阶段训练计划。每天练什么一目了然，打卡记录成长轨迹。
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link to="/signup" className="btn" style={{
            background: 'white',
            color: 'var(--primary)',
            fontSize: 16,
            padding: '12px 32px',
          }}>
            免费注册
          </Link>
          <Link to="/login" className="btn" style={{
            background: 'rgba(255,255,255,0.2)',
            color: 'white',
            fontSize: 16,
            padding: '12px 32px',
          }}>
            已有账号登录
          </Link>
        </div>
      </div>

      {/* Features */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: 20,
        marginBottom: 40,
      }}>
        {[
          { icon: '\u{1F4CB}', title: '智能训练计划', desc: '输入目标赛事、成绩和当前水平，系统自动生成12周分阶段训练计划' },
          { icon: '\u{1F4C5}', title: '训练日历', desc: '整月计划一目了然，完成的标绿、休息日标灰，进度清晰可见' },
          { icon: '\u{1F4CA}', title: '跑量统计', desc: '周跑量柱状图展示趋势，配速、距离、身体感受全面记录' },
          { icon: '\u{1F91D}', title: '教练协作', desc: '教练端查看学员训练情况，留言指导，灵活调整训练强度' },
        ].map((f, i) => (
          <div key={i} className="card" style={{ textAlign: 'center', padding: 28 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>{f.icon}</div>
            <h3 style={{ fontSize: 17, marginBottom: 8, color: 'var(--gray-800)' }}>{f.title}</h3>
            <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
