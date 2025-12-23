import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  // 1. If not logged in, kick them to login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 2. If logged in but wrong role (e.g. Employee trying to view Admin)
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div style={{ padding: '2rem', color: 'red', textAlign: 'center' }}>
        <h2>Access Denied</h2>
        <p>You do not have permission to view this page.</p>
        <p>Your Role: <strong>{user.role}</strong></p>
      </div>
    );
  }

  // 3. If allowed, show the page
  return <Outlet />;
};

export default ProtectedRoute;