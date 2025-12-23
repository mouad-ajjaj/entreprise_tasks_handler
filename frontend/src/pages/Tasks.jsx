import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; 
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import { 
  FiPlus, FiTrash2, FiUser, FiCalendar, 
  FiUploadCloud, FiChevronDown, FiChevronUp, FiX, FiCheckSquare 
} from 'react-icons/fi';

const Tasks = () => {
  const { user } = useAuth();
  const navigate = useNavigate(); 
  const location = useLocation(); // Hook to read data sent from Employees page
  
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  const [expandedTasks, setExpandedTasks] = useState(new Set());
  const [showForm, setShowForm] = useState(false);
  const [uploadTask, setUploadTask] = useState(null); 

  const [newTask, setNewTask] = useState({ 
    title: '', description: '', employee_id: '', due_date: '', status: 'pending'
  });

  const canManage = user.role === 'admin' || user.role === 'manager';
  const canDelete = user.role === 'admin';

  // 1. Fetch Data
  useEffect(() => {
    fetchData();
  }, []);

  // 2. Handle Redirect from Employees Page
  useEffect(() => {
    if (location.state?.assignToId) {
      // Open the form
      setShowForm(true);
      // Pre-fill the employee ID
      setNewTask(prev => ({ ...prev, employee_id: location.state.assignToId }));
      // Clear the state so refreshing doesn't keep resetting it
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const fetchData = async () => {
    try {
      const [taskRes, empRes] = await Promise.all([
        axiosClient.get('/tasks'),
        axiosClient.get('/employees')
      ]);
      setTasks(taskRes.data);
      setEmployees(empRes.data);
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTask.employee_id) return alert("Please assign to an employee");
    try {
      const res = await axiosClient.post('/tasks', newTask);
      setTasks([...tasks, res.data]); 
      setShowForm(false);
      setNewTask({ title: '', description: '', employee_id: '', due_date: '', status: 'pending' });
      alert("Task assigned successfully!");
    } catch (error) { alert("Failed to create task"); }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation(); 
    if (!canDelete) return; 
    if (!window.confirm("Delete this task?")) return;
    try {
      await axiosClient.delete(`/tasks/${id}`);
      setTasks(tasks.filter(t => t.id !== id));
    } catch (error) { alert("Failed to delete"); }
  };

  const updateStatus = async (task, newStatus, e) => {
    e.stopPropagation(); 
    try {
      await axiosClient.put(`/tasks/${task.id}`, { ...task, status: newStatus });
      setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    } catch (error) { alert("Failed to update status"); }
  };

  const toggleExpand = (id, e) => {
    e.stopPropagation(); 
    const newSet = new Set(expandedTasks);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedTasks(newSet);
  };

  const handleUploadClick = (task, e) => {
    e.stopPropagation(); 
    setUploadTask(task); 
  };

  const handleTaskClick = (task) => {
    navigate('/documents', { 
      state: { relatedTaskId: task.id, relatedTaskTitle: task.title } 
    });
  };

  const getAssigneeName = (id) => {
    const emp = employees.find(e => e.id === id);
    return emp ? emp.name : 'Unknown Employee';
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return { bg: '#ECFDF3', text: '#027A48', border: '#A6F4C5' };
      case 'in-progress': return { bg: '#EFF8FF', text: '#175CD3', border: '#B2DDFF' };
      default: return { bg: '#FFFAEB', text: '#B54708', border: '#FEDF89' };
    }
  };

  const visibleTasks = canManage ? tasks : tasks.filter(t => t.employee_id === user.id);

  if (loading) return <div className="p-4">Loading tasks...</div>;

  return (
    <div>
      {/* HEADER SECTION */}
      <div className="page-header" style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
        <div>
          <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>{canManage ? "Team Assignments" : "My Tasks"}</h1>
          <p className="text-secondary">{canManage ? "Track and manage team deliverables." : "Prioritize your pending work."}</p>
        </div>
        {canManage && (
          <button 
            onClick={() => setShowForm(!showForm)}
            style={{ padding: '10px 18px', background: '#155EEF', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', boxShadow: '0 1px 2px rgba(16,24,40,0.05)' }}
          >
            <FiPlus size={18} /> Assign Task
          </button>
        )}
      </div>

      {/* CREATE TASK FORM */}
      {showForm && (
        <div className="card" style={{ marginBottom: '24px', background: '#F9FAFB', border: '1px solid #EAECF0', padding: '24px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>New Assignment</h3>
          <form onSubmit={handleCreate} style={{ display: 'grid', gap: '16px', maxWidth: '600px' }}>
            <input placeholder="Task Title" required value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #D0D5DD' }} />
            <textarea placeholder="Description" value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #D0D5DD', minHeight: '80px' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <select required value={newTask.employee_id} onChange={e => setNewTask({...newTask, employee_id: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #D0D5DD', backgroundColor: 'white' }}>
                <option value="">Assign To...</option>
                {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name} — {emp.position}</option>)}
              </select>
              <input type="date" required value={newTask.due_date} onChange={e => setNewTask({...newTask, due_date: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #D0D5DD' }} />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" style={{ padding: '10px 20px', background: '#155EEF', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Create Task</button>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 20px', background: 'white', border: '1px solid #D0D5DD', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: '#344054' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* TASK LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
        {visibleTasks.length === 0 ? (
          <div className="empty-state">
             <div className="empty-icon"><FiCheckSquare size={24} /></div>
             <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>No tasks found</h3>
             <p style={{ color: '#667085', fontSize: '14px' }}>{canManage ? "Assign a new task to get the team moving." : "You're all caught up! Great job."}</p>
          </div>
        ) : (
          visibleTasks.map(task => {
            const isExpanded = expandedTasks.has(task.id);
            const statusStyle = getStatusColor(task.status);
            const isAssignee = task.employee_id === user.id;

            return (
              <div 
                key={task.id} 
                className="task-card"
                onClick={() => handleTaskClick(task)}
              >
                {/* Colored Strip */}
                <div className="task-card-strip" style={{ backgroundColor: statusStyle.text }}></div>

                {/* Main Row */}
                <div className="task-main">
                  
                  {/* Left: Info */}
                  <div style={{ flex: 1, paddingLeft: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 className="task-title">{task.title}</h3>
                      <button 
                        onClick={(e) => toggleExpand(task.id, e)} 
                        className="icon-btn" 
                        style={{ width: '24px', height: '24px' }}
                      >
                        {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                      </button>
                    </div>
                    
                    <div className="task-meta">
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FiCalendar size={14} /> {task.due_date || 'No Date'}
                      </span>
                      {canManage && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <FiUser size={14} /> {getAssigneeName(task.employee_id)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="action-group" onClick={e => e.stopPropagation()}>
                    {/* Status Select */}
                    <select
                      value={task.status}
                      onChange={(e) => updateStatus(task, e.target.value, e)}
                      disabled={!isAssignee} 
                      className="status-select"
                      style={{
                        backgroundColor: !isAssignee ? '#F2F4F7' : statusStyle.bg,
                        color: !isAssignee ? '#98A2B3' : statusStyle.text,
                        borderColor: statusStyle.border,
                        cursor: isAssignee ? 'pointer' : 'not-allowed'
                      }}
                    >
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>

                    {/* Upload Button */}
                    <button 
                      onClick={(e) => handleUploadClick(task, e)} 
                      title="Upload Document"
                      className="icon-btn primary"
                    >
                      <FiUploadCloud size={18} />
                    </button>

                    {/* Delete (Admin) */}
                    {canDelete && (
                      <button 
                        onClick={(e) => handleDelete(task.id, e)}
                        className="icon-btn danger"
                        title="Delete Task"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Description (Collapsible) */}
                {isExpanded && (
                  <div className="task-desc">
                    <strong>Description:</strong>
                    <p style={{ marginTop: '4px' }}>{task.description || "No description provided."}</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* UPLOAD MODAL */}
      {uploadTask && (
        <UploadModal task={uploadTask} onClose={() => setUploadTask(null)} user={user} />
      )}
    </div>
  );
};

// --- MODAL COMPONENT ---
const UploadModal = ({ task, onClose, user }) => {
  const [uploading, setUploading] = useState(false);
  const [newFile, setNewFile] = useState(null);
  const [docAttr, setDocAttr] = useState({ title: '', description: '' });

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!newFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', docAttr.title || newFile.name);
      formData.append('description', docAttr.description);
      // SENDING ID FOR BACKEND LINKING
      formData.append('task_id', task.id); 
      formData.append('task_name', task.title); 
      formData.append('employee_id', user.id);
      formData.append('employee_name', user.name);
      formData.append('file', newFile);

      await axiosClient.post('/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      alert("Uploaded successfully!");
      onClose();
    } catch (error) { alert("Upload failed"); } 
    finally { setUploading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #EAECF0', paddingBottom: '16px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px' }}>Upload Deliverable</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#667085' }}>For task: <strong>{task.title}</strong></p>
          </div>
          <button onClick={onClose} className="icon-btn"><FiX size={20}/></button>
        </div>
        
        <form onSubmit={handleUpload} style={{ display: 'grid', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#344054' }}>Document Title</label>
            <input placeholder="e.g. Final Report" value={docAttr.title} onChange={e => setDocAttr({...docAttr, title: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #D0D5DD' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#344054' }}>Description</label>
            <input placeholder="Short description..." value={docAttr.description} onChange={e => setDocAttr({...docAttr, description: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #D0D5DD' }} />
          </div>
          
          <div style={{ padding: '16px', border: '1px dashed #D0D5DD', borderRadius: '8px', textAlign: 'center', background: '#F9FAFB' }}>
            <div style={{ color: '#667085', marginBottom: '8px' }}><FiUploadCloud size={24} /></div>
            <input type="file" onChange={e => setNewFile(e.target.files[0])} style={{ width: '100%' }} />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button type="submit" disabled={!newFile || uploading} style={{ flex: 1, padding: '10px', background: '#155EEF', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', opacity: uploading ? 0.7 : 1 }}>
              {uploading ? "Uploading..." : "Upload File"}
            </button>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px', background: 'white', border: '1px solid #D0D5DD', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: '#344054' }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Tasks;