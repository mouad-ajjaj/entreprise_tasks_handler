import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';

const Login = () => {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loading, setLoading] = useState(true);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // 1. Fetch real employees from Azure
        const res = await axiosClient.get('/employees');
        const realEmployees = res.data;

        // 2. Define Demo Users (Guarantees you always have an Admin/Manager to test with)
        const demoUsers = [
          { 
            id: 'demo-admin-01', 
            name: 'Demo Admin', 
            position: 'System Administrator', // Triggers Admin Role
            department: 'IT',
            isDemo: true
          },
          { 
            id: 'demo-manager-01', 
            name: 'Demo Manager', 
            position: 'Project Manager',      // Triggers Manager Role
            department: 'Operations',
            isDemo: true
          },
          { 
            id: 'demo-employee-01', 
            name: 'Demo Employee', 
            position: 'Software Developer',   // Triggers Employee Role
            department: 'Engineering',
            isDemo: true
          }
        ];

        // 3. Combine them (Real first, then Demo)
        const allUsers = [...realEmployees, ...demoUsers];
        setUsers(allUsers);
        
        // Default selection to the first user
        if (allUsers.length > 0) {
          setSelectedUserId(allUsers[0].id);
        }

      } catch (error) {
        console.error("Failed to load users", error);
        // If API fails, at least show demo users
        setUsers([
          { id: 'demo-admin-01', name: 'Demo Admin', position: 'System Administrator' },
          { id: 'demo-manager-01', name: 'Demo Manager', position: 'Project Manager' },
          { id: 'demo-employee-01', name: 'Demo Employee', position: 'Software Developer' }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    
    // Find the full user object based on the ID selected
    const userToLogin = users.find(u => u.id === selectedUserId);
    
    if (userToLogin) {
      login(userToLogin);
      navigate('/'); // Redirect to Dashboard
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh', 
      backgroundColor: '#f0f2f5' 
    }}>
      <div style={{ 
        background: 'white', 
        padding: '2.5rem', 
        borderRadius: '12px', 
        boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '450px',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ 
            width: '48px', height: '48px', background: '#155EEF', 
            borderRadius: '10px', margin: '0 auto 16px auto', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 'bold', fontSize: '24px'
          }}>
            C
          </div>
          <h2 style={{ marginBottom: '0.5rem', color: '#1a1a1a' }}>Cloud Corp Portal</h2>
          <p style={{ color: '#666' }}>Select a user profile to simulate login</p>
        </div>

        {loading ? (
          <p>Loading users...</p>
        ) : (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#444' }}>
                Login As:
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  fontSize: '16px',
                  backgroundColor: '#fff',
                  cursor: 'pointer'
                }}
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} — {u.position} {u.isDemo ? '(Demo)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: '#155EEF',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                boxShadow: '0 1px 2px rgba(16, 24, 40, 0.05)'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#104dbf'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#155EEF'}
            >
              Enter Portal
            </button>
          </form>
        )}
        
        <div style={{ marginTop: '24px', fontSize: '12px', color: '#98A2B3' }}>
          Connected to Azure Functions • Blob Storage
        </div>
      </div>
    </div>
  );
};

export default Login;