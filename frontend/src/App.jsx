import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Documents from './pages/Documents';
import Employees from './pages/Employees'; 

// Layout 
import Sidebar from './components/Sidebar'; 

const Layout = ({ children }) => (
  <div className="app-layout">
    <Sidebar />
    <main>
      {children}
    </main>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* --- COMMON ROUTES (Everyone) --- */}
          <Route element={<ProtectedRoute allowedRoles={['admin', 'manager', 'employee']} />}>
            <Route path="/" element={<Layout><Dashboard /></Layout>} />
            <Route path="/tasks" element={<Layout><Tasks /></Layout>} />
            <Route path="/documents" element={<Layout><Documents /></Layout>} />
          </Route>

          {/* --- MANAGEMENT ROUTES (Admin & Manager) --- */}
          {/* UPDATED: Added 'manager' to allowedRoles here */}
          <Route element={<ProtectedRoute allowedRoles={['admin', 'manager']} />}>
             <Route path="/employees" element={<Layout><Employees /></Layout>} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;