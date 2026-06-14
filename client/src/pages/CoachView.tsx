import { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function CoachView() {
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [studentPlan, setStudentPlan] = useState<any>(null);
  const [studentStats, setStudentStats] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [newStudentUsername, setNewStudentUsername] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudents();
  }, []);

  async function loadStudents() {
    try {
      const data = await api.getStudents();
      setStudents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function selectStudent(student: any) {
    setSelectedStudent(student);
    try {
      const [plan, stats, noteList] = await Promise.all([
        api.getStudentPlan(student.id),
        api.getStudentStats(student.id),
        api.getNotes(student.id),
      ]);
      setStudentPlan(plan);
      setStudentStats(stats);
      setNotes(noteList);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleAddStudent(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await api.addStudent(newStudentUsername);
      setMessage('学员添加成功');
      setNewStudentUsername('');
      loadStudents();
    } catch (err: any) {
      setError(err.message || '添加失败');
    }
  }

  async function handleRemoveStudent(studentId: number) {
    if (!confirm('确定移除此学员？')) return;
    try {
      await api.removeStudent(studentId);
      if (selectedStudent?.id === studentId) {
        setSelectedStudent(null);
        setStudentPlan(null);
      }
      loadStudents();
    } catch (err: any) {
      setError(err.message || '移除失败');
    }
  }

  async function handleSendNote(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStudent || !studentPlan || !noteContent) return;
    try {
      await api.addNote(selectedStudent.id, studentPlan.id, noteContent);
      setNoteContent('');
      const noteList = await api.getNotes(selectedStudent.id);
      setNotes(noteList);
      setMessage('留言已发送');
    } catch (err: any) {
      setError(err.message || '发送失败');
    }
  }

  if (loading) {
    return <div className="empty-state"><p>加载中...</p></div>;
  }

  return (
    <div>
      <h1 className="page-title">教练端</h1>

      {error && <div className="error-msg">{error}</div>}
      {message && (
        <div style={{
          background: 'var(--success-light)',
          color: 'var(--success)',
          padding: '10px 14px',
          borderRadius: 'var(--radius)',
          marginBottom: 16,
          fontSize: 14,
        }}>
          {message}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>
        {/* Left: Student list */}
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>添加学员</h3>
            <form onSubmit={handleAddStudent} style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={newStudentUsername}
                onChange={e => setNewStudentUsername(e.target.value)}
                placeholder="学员用户名"
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  border: '1px solid var(--gray-300)',
                  borderRadius: 'var(--radius)',
                  fontSize: 14,
                }}
              />
              <button type="submit" className="btn btn-primary btn-sm">添加</button>
            </form>
          </div>

          <div className="card">
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>我的学员 ({students.length})</h3>
            {students.length === 0 ? (
              <p style={{ color: 'var(--gray-500)', fontSize: 14, textAlign: 'center', padding: 20 }}>
                还没有学员
              </p>
            ) : (
              <div>
                {students.map(s => (
                  <div
                    key={s.id}
                    onClick={() => selectStudent(s)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius)',
                      cursor: 'pointer',
                      background: selectedStudent?.id === s.id ? 'var(--primary-light)' : 'transparent',
                      marginBottom: 4,
                      transition: 'all 0.15s',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>{s.username}</div>
                      <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{s.email}</div>
                    </div>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={(e) => { e.stopPropagation(); handleRemoveStudent(s.id); }}
                      style={{ fontSize: 11 }}
                    >
                      移除
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Student details */}
        <div>
          {!selectedStudent ? (
            <div className="empty-state">
              <h3>选择一个学员查看训练情况</h3>
              <p>从左侧列表中点击学员名字</p>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>
                {selectedStudent.username} 的训练情况
              </h2>

              {/* Stats summary */}
              {studentStats?.totals && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 12,
                  marginBottom: 20,
                }}>
                  {[
                    { label: '总距离', value: `${(studentStats.totals.total_distance || 0).toFixed(1)}km` },
                    { label: '总时长', value: `${Math.round(studentStats.totals.total_duration || 0)}分` },
                    { label: '打卡次数', value: `${studentStats.totals.total_checkins || 0}` },
                    { label: '平均感受', value: `${(studentStats.totals.avg_feeling || 0).toFixed(1)}★` },
                  ].map((s, i) => (
                    <div key={i} className="card" style={{ textAlign: 'center', padding: 14 }}>
                      <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{s.label}</div>
                      <div style={{ fontSize: 20, fontWeight: 700 }}>{s.value}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Recent checkins */}
              {studentPlan?.checkins?.length > 0 && (
                <div className="card" style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>最近训练</h3>
                  {studentPlan.checkins.slice(-5).reverse().map((c: any) => {
                    const day = studentPlan.days?.find((d: any) => d.id === c.plan_day_id);
                    return (
                      <div key={c.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '8px 0',
                        borderBottom: '1px solid var(--gray-100)',
                        fontSize: 14,
                      }}>
                        <span>第{day?.week_number || '?'}周 {c.workout_type || day?.workout_type}</span>
                        <span>{c.actual_distance_km}km · {c.actual_duration_minutes}分 · {'★'.repeat(c.feeling)}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Coach notes */}
              <div className="card">
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>教练留言</h3>

                <form onSubmit={handleSendNote} style={{ marginBottom: 16 }}>
                  <textarea
                    value={noteContent}
                    onChange={e => setNoteContent(e.target.value)}
                    placeholder="给学员写留言或训练建议..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: 10,
                      border: '1px solid var(--gray-300)',
                      borderRadius: 'var(--radius)',
                      resize: 'vertical',
                      marginBottom: 8,
                    }}
                  />
                  <button type="submit" className="btn btn-primary btn-sm" disabled={!noteContent}>
                    发送留言
                  </button>
                </form>

                {notes.length > 0 ? (
                  notes.map(n => (
                    <div key={n.id} style={{
                      padding: '10px 0',
                      borderBottom: '1px solid var(--gray-100)',
                    }}>
                      <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>
                        {new Date(n.created_at).toLocaleString()}
                      </div>
                      <p style={{ marginTop: 4, fontSize: 14 }}>{n.content}</p>
                    </div>
                  ))
                ) : (
                  <p style={{ color: 'var(--gray-500)', textAlign: 'center', fontSize: 14 }}>
                    暂无留言记录
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
