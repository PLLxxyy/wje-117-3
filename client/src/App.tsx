import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import CreatePlan from './pages/CreatePlan';
import TrainingCalendar from './pages/TrainingCalendar';
import Checkin from './pages/Checkin';
import Stats from './pages/Stats';
import Shoes from './pages/Shoes';
import CoachView from './pages/CoachView';
import Dashboard from './pages/admin/Dashboard';
import Templates from './pages/admin/Templates';

function App() {
  const { user } = useAuth();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ flex: 1, maxWidth: 1200, margin: '0 auto', padding: '24px 16px', width: '100%' }}>
        <Routes>
          <Route path="/" element={user ? <Navigate to="/calendar" /> : <Home />} />
          <Route path="/login" element={user ? <Navigate to="/calendar" /> : <Login />} />
          <Route path="/signup" element={user ? <Navigate to="/calendar" /> : <Signup />} />
          <Route path="/create-plan" element={<ProtectedRoute><CreatePlan /></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><TrainingCalendar /></ProtectedRoute>} />
          <Route path="/checkin/:planDayId" element={<ProtectedRoute><Checkin /></ProtectedRoute>} />
          <Route path="/stats" element={<ProtectedRoute><Stats /></ProtectedRoute>} />
          <Route path="/shoes" element={<ProtectedRoute><Shoes /></ProtectedRoute>} />
          <Route path="/coach" element={<ProtectedRoute requiredRole="coach"><CoachView /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><Dashboard /></ProtectedRoute>} />
          <Route path="/admin/templates" element={<ProtectedRoute requiredRole="admin"><Templates /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
