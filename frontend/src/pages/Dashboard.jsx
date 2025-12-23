import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import { 
  FiUsers, FiCheckSquare, FiFileText, FiBell, FiActivity, FiAlertCircle 
} from 'react-icons/fi';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    // Employee Specific
    myPendingTasks: 0,
    myDocs: 0,
    myReminders: 0,
    myUrgentTasks: [], // For the list view

    // Admin/Manager Specific
    totalEmployees: 0,
    totalSystemTasks: 0,
    totalSystemDocs: 0,
    recentEmployees: []
  });
  const [loading, setLoading] = useState(true);

  // Check if the user is management
  const isManagement = user.role === 'admin' || user.role === 'manager';

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all data sources
        const [empRes, tasksRes, docsRes, remRes] = await Promise.all([
          axiosClient.get('/employees'),
          axiosClient.get('/tasks'),
          axiosClient.get('/documents'),
          axiosClient.get('/reminders')
        ]);

        const allTasks = tasksRes.data;
        const allDocs = docsRes.data;
        const allReminders = remRes.data;
        const allEmps = empRes.data;

        if (isManagement) {
          // --- LOGIC FOR ADMIN & MANAGER ---
          setStats({
            totalEmployees: allEmps.length,
            totalSystemTasks: allTasks.filter(t => t.status !== 'completed').length,
            totalSystemDocs: allDocs.length,
            recentEmployees: allEmps.slice(-5).reverse() // Last 5 employees
          });
        } else {
          // --- LOGIC FOR EMPLOYEE (Strict Filtering) ---
          const myTasks = allTasks.filter(t => t.employee_id === user.id);
          const myPending = myTasks.filter(t => t.status !== 'completed');
          
          setStats({
            myPendingTasks: myPending.length,
            myDocs: allDocs.filter(d => d.employee_id === user.id).length,
            myReminders: allReminders.filter(r => r.employee_id === user.id).length,
            myUrgentTasks: myPending.slice(0, 5) // Show top 5 pending
          });
        }

      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user.id, isManagement]);

  if (loading) return <div className="p-4">Loading dashboard...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p className="text-secondary">
          {isManagement 
            ? `Overview for ${user.department} Department` 
            : `Welcome back, ${user.name}`}
        </p>
      </div>

      {/* --- STATS CARDS GRID --- */}
      <div className="stats-grid">
        
        {/* 1. TASKS CARD */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <h3>{isManagement ? 'Total Active Tasks' : 'My Pending Tasks'}</h3>
              <div className="value">
                {isManagement ? stats.totalSystemTasks : stats.myPendingTasks}
              </div>
            </div>
            <div style={{ padding: '10px', background: '#FEF3F2', borderRadius: '8px', color: '#D92D20' }}>
              <FiCheckSquare size={24} />
            </div>
          </div>
        </div>

        {/* 2. DOCUMENTS CARD */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <h3>{isManagement ? 'Total Documents' : 'My Documents'}</h3>
              <div className="value">
                {isManagement ? stats.totalSystemDocs : stats.myDocs}
              </div>
            </div>
            <div style={{ padding: '10px', background: '#EFF8FF', borderRadius: '8px', color: '#155EEF' }}>
              <FiFileText size={24} />
            </div>
          </div>
        </div>

        {/* 3. THIRD CARD (Different for Role) */}
        {isManagement ? (
          // Manager sees Employee Count
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <h3>Total Employees</h3>
                <div className="value">{stats.totalEmployees}</div>
              </div>
              <div style={{ padding: '10px', background: '#ECFDF3', borderRadius: '8px', color: '#027A48' }}>
                <FiUsers size={24} />
              </div>
            </div>
          </div>
        ) : (
          // Employee sees Reminders
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <h3>My Reminders</h3>
                <div className="value">{stats.myReminders}</div>
              </div>
              <div style={{ padding: '10px', background: '#FFFAEB', borderRadius: '8px', color: '#B54708' }}>
                <FiBell size={24} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- BOTTOM SECTION (Specific Lists) --- */}
      <div style={{ marginTop: '30px' }}>
        
        {/* VIEW FOR EMPLOYEES: My Priority Tasks */}
        {!isManagement && (
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <FiAlertCircle size={20} color="#D92D20" />
              <h3 style={{ margin: 0, fontSize: '18px', color: '#101828' }}>My Priority Actions</h3>
            </div>
            
            {stats.myUrgentTasks.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid #EAECF0' }}>
                    <th style={{ padding: '12px 0', fontSize: '12px', color: '#667085' }}>TASK TITLE</th>
                    <th style={{ padding: '12px 0', fontSize: '12px', color: '#667085' }}>DUE DATE</th>
                    <th style={{ padding: '12px 0', fontSize: '12px', color: '#667085' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.myUrgentTasks.map(task => (
                    <tr key={task.id} style={{ borderBottom: '1px solid #EAECF0' }}>
                      <td style={{ padding: '16px 0', fontWeight: '500' }}>{task.title}</td>
                      <td style={{ padding: '16px 0', color: '#667085' }}>{task.due_date || 'No Date'}</td>
                      <td>
                        <span style={{ 
                          background: '#FEF3F2', color: '#B42318', 
                          padding: '4px 10px', borderRadius: '16px', fontSize: '12px', fontWeight: '500' 
                        }}>
                          {task.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ color: '#667085' }}>You have no pending tasks. Great job!</p>
            )}
          </div>
        )}

        {/* VIEW FOR MANAGEMENT: Recent Joiners */}
        {isManagement && (
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <FiActivity size={20} color="#155EEF" />
              <h3 style={{ margin: 0, fontSize: '18px', color: '#101828' }}>Recently Joined Employees</h3>
            </div>
            
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #EAECF0' }}>
                  <th style={{ padding: '12px 0', fontSize: '12px', color: '#667085' }}>NAME</th>
                  <th style={{ padding: '12px 0', fontSize: '12px', color: '#667085' }}>POSITION</th>
                  <th style={{ padding: '12px 0', fontSize: '12px', color: '#667085' }}>DEPARTMENT</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentEmployees.map(emp => (
                  <tr key={emp.id} style={{ borderBottom: '1px solid #EAECF0' }}>
                    <td style={{ padding: '16px 0', fontWeight: '500' }}>{emp.name}</td>
                    <td style={{ padding: '16px 0', color: '#667085' }}>{emp.position}</td>
                    <td style={{ padding: '16px 0', color: '#667085' }}>
                      <span style={{ 
                        background: '#EFF8FF', color: '#175CD3', 
                        padding: '4px 10px', borderRadius: '16px', fontSize: '12px', fontWeight: '500' 
                      }}>
                        {emp.department}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
};

export default Dashboard;