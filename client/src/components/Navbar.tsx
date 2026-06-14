import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={{
      background: 'white',
      borderBottom: '1px solid var(--gray-200)',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      height: 56,
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: 'var(--shadow)',
    }}>
      <Link to="/" style={{
        fontSize: 18,
        fontWeight: 700,
        color: 'var(--primary)',
        marginRight: 32,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <span style={{ fontSize: 24 }}>&#127939;</span> 马拉松训练
      </Link>

      {user && (
        <div style={{ display: 'flex', gap: 4, flex: 1 }}>
          <Link to="/calendar" style={navLinkStyle}>训练日历</Link>
          <Link to="/create-plan" style={navLinkStyle}>新建计划</Link>
          <Link to="/stats" style={navLinkStyle}>跑量统计</Link>
          {user.role === 'coach' && (
            <Link to="/coach" style={navLinkStyle}>教练端</Link>
          )}
          {user.role === 'admin' && (
            <>
              <Link to="/admin" style={navLinkStyle}>后台管理</Link>
              <Link to="/admin/templates" style={navLinkStyle}>模板管理</Link>
            </>
          )}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {user ? (
          <>
            <span style={{ color: 'var(--gray-600)', fontSize: 14 }}>
              {user.username}
              <span style={{
                marginLeft: 6,
                fontSize: 11,
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                padding: '1px 6px',
                borderRadius: 10,
              }}>
                {user.role === 'admin' ? '管理员' : user.role === 'coach' ? '教练' : '跑者'}
              </span>
            </span>
            <button onClick={handleLogout} className="btn btn-outline btn-sm">
              退出
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-outline btn-sm">登录</Link>
            <Link to="/signup" className="btn btn-primary btn-sm">注册</Link>
          </>
        )}
      </div>
    </nav>
  );
}

const navLinkStyle: React.CSSProperties = {
  padding: '8px 14px',
  borderRadius: 6,
  fontSize: 14,
  fontWeight: 500,
  color: 'var(--gray-600)',
  textDecoration: 'none',
  transition: 'all 0.15s',
};
