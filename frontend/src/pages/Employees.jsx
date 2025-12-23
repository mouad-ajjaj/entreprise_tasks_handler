import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import { 
  FiPlus, FiTrash2, FiSearch, FiMail, FiBriefcase, FiX, FiCheckSquare 
} from 'react-icons/fi';

const Employees = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [showForm, setShowForm] = useState(false);
  const [newEmp, setNewEmp] = useState({
    name: '', email: '', position: '', department: ''
  });

  // Permissions
  const isAdmin = user.role === 'admin';
  const isManager = user.role === 'manager';

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await axiosClient.get('/employees');
      setEmployees(res.data);
    } catch (error) {
      console.error("Failed to load employees", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosClient.post('/employees', newEmp);
      setEmployees([...employees, res.data]);
      setShowForm(false);
      setNewEmp({ name: '', email: '', position: '', department: '' });
      alert("Employee added successfully!");
    } catch (error) {
      alert("Failed to add employee.");
    }
  };

  const handleDelete = async (id) => {
    if (!isAdmin) return;
    if (!window.confirm("Are you sure you want to remove this employee?")) return;
    try {
      await axiosClient.delete(`/employees/${id}`);
      setEmployees(employees.filter(emp => emp.id !== id));
    } catch (error) {
      alert("Failed to delete employee.");
    }
  };

  const handleAssignTask = (employee) => {
    // Redirect to Tasks page, passing the employee ID to pre-fill the form
    navigate('/tasks', { 
      state: { 
        assignToId: employee.id, 
        openForm: true 
      } 
    });
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-4">Loading directory...</div>;

  return (
    <div>
      {/* HEADER */}
      <div className="page-header" style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
        <div>
          <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>Team Directory</h1>
          <p className="text-secondary">
            {isAdmin ? "Manage your organization's talent." : "View team members and assign work."}
          </p>
        </div>
        
        {/* Only Admin can Add Employees */}
        {isAdmin && (
          <button 
            onClick={() => setShowForm(!showForm)}
            style={{ 
              padding: '10px 18px', background: '#155EEF', color: 'white', 
              border: 'none', borderRadius: '8px', cursor: 'pointer', 
              display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600'
            }}
          >
            {showForm ? <FiX /> : <FiPlus />} {showForm ? "Cancel" : "Add Employee"}
          </button>
        )}
      </div>

      {/* CREATE FORM (Admin Only) */}
      {showForm && isAdmin && (
        <div className="card" style={{ marginBottom: '30px', background: '#F9FAFB', border: '1px solid #EAECF0', padding: '24px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>Onboard New Employee</h3>
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <input required placeholder="Full Name" value={newEmp.name} onChange={e => setNewEmp({...newEmp, name: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #D0D5DD' }} />
            <input required type="email" placeholder="Email" value={newEmp.email} onChange={e => setNewEmp({...newEmp, email: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #D0D5DD' }} />
            <input required placeholder="Position" value={newEmp.position} onChange={e => setNewEmp({...newEmp, position: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #D0D5DD' }} />
            <select required value={newEmp.department} onChange={e => setNewEmp({...newEmp, department: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #D0D5DD', background: 'white' }}>
              <option value="">Select Department...</option>
              <option value="Engineering">Engineering</option>
              <option value="Design">Design</option>
              <option value="Marketing">Marketing</option>
              <option value="HR">HR</option>
            </select>
            <div style={{ gridColumn: '1 / -1' }}>
              <button type="submit" style={{ padding: '10px 24px', background: '#155EEF', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Save Employee</button>
            </div>
          </form>
        </div>
      )}

      {/* SEARCH BAR */}
      <div style={{ marginBottom: '24px', position: 'relative', maxWidth: '400px' }}>
        <FiSearch style={{ position: 'absolute', left: '12px', top: '12px', color: '#667085' }} />
        <input 
          placeholder="Search by name, role, or department..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '8px', border: '1px solid #D0D5DD' }}
        />
      </div>

      {/* TABLE VIEW */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Contact</th>
              <th>Position</th>
              <th>Department</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#667085' }}>No employees found.</td></tr>
            ) : (
              filteredEmployees.map(emp => (
                <tr key={emp.id}>
                  {/* Name + Avatar */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="table-avatar">{getInitials(emp.name)}</div>
                      <div style={{ fontWeight: '600', color: '#101828' }}>{emp.name}</div>
                    </div>
                  </td>
                  
                  {/* Contact */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FiMail size={14} /> {emp.email}
                    </div>
                  </td>

                  {/* Role */}
                  <td style={{ color: '#155EEF', fontWeight: '500' }}>{emp.position}</td>

                  {/* Dept */}
                  <td>
                    <span style={{ background: '#F2F4F7', padding: '4px 8px', borderRadius: '16px', fontSize: '12px', fontWeight: '500', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <FiBriefcase size={12} /> {emp.department}
                    </span>
                  </td>

                  {/* Actions */}
                  <td>
                    {isManager && (
                      <button 
                        onClick={() => handleAssignTask(emp)}
                        style={{ 
                          padding: '6px 12px', background: '#155EEF', color: 'white', 
                          border: 'none', borderRadius: '6px', cursor: 'pointer', 
                          fontSize: '13px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px'
                        }}
                      >
                        <FiCheckSquare /> Assign Task
                      </button>
                    )}

                    {isAdmin && (
                      <button 
                        onClick={() => handleDelete(emp.id)}
                        title="Delete"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#F04438' }}
                      >
                        <FiTrash2 size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Employees;