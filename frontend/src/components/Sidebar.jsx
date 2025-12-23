import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FiHome, FiCheckSquare, FiFileText, FiUsers, FiLogOut 
} from 'react-icons/fi';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Cloud Corp</h2>
        <span className="role-badge">{user.role}</span>
      </div>

      <nav className="sidebar-nav">
        <Link to="/dashboard" className={`nav-item ${isActive('/dashboard')}`}>
          <FiHome size={20} /> Dashboard
        </Link>

        {/* Everyone sees Tasks */}
        <Link to="/tasks" className={`nav-item ${isActive('/tasks')}`}>
          <FiCheckSquare size={20} /> {user.role === 'employee' ? 'My Tasks' : 'Team Tasks'}
        </Link>

        {/* Everyone sees Documents (Context changes inside) */}
        <Link to="/documents" className={`nav-item ${isActive('/documents')}`}>
          <FiFileText size={20} /> Documents
        </Link>

        {/* Admin AND Manager see Employees */}
        {(user.role === 'admin' || user.role === 'manager') && (
          <Link to="/employees" className={`nav-item ${isActive('/employees')}`}>
            <FiUsers size={20} /> Team Directory
          </Link>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{user.name.charAt(0)}</div>
          <div className="user-details">
            <span className="user-name">{user.name}</span>
            <span className="user-email">{user.email}</span>
          </div>
        </div>
        <button onClick={handleLogout} className="logout-btn">
          <FiLogOut size={20} />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;