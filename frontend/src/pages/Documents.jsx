import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'; 
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import { 
  FiFileText, FiDownload, FiTrash2, FiSearch, FiUser, 
  FiArrowLeft, FiEdit2, FiLayers
} from 'react-icons/fi';

const Documents = () => {
  const { user } = useAuth();
  const location = useLocation(); 
  const navigate = useNavigate();

  // 1. Retrieve the ID passed from the Tasks page
  const relatedTaskId = location.state?.relatedTaskId || '';     // The Robust ID
  const relatedTaskTitle = location.state?.relatedTaskTitle || ''; // The Display Name
  
  const isTaskView = !!relatedTaskId; // We are in "Task Mode" if we have an ID

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const isAdmin = user.role === 'admin';

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await axiosClient.get('/documents');
      setDocuments(res.data);
    } catch (error) {
      console.error("Error loading docs", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Permanently delete this file?")) return;
    try {
      await axiosClient.delete(`/documents/${id}`);
      setDocuments(documents.filter(d => d.id !== id));
    } catch (error) { alert("Delete failed"); }
  };

  const handleEdit = (doc) => {
    const newName = prompt("Rename document:", doc.title);
    if(newName) alert(`Document renamed to: ${newName} (Mock Action)`);
  };

  // --- FILTERING LOGIC ---
  const visibleDocs = documents.filter(doc => {
    // Filter 1: Search Bar
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter 2: Specific Task View (BY ID NOW)
    if (isTaskView) {
      // We check if the doc's task_id matches the one we clicked
      // Fallback: doc.task_name === relatedTaskTitle (for old files before we added IDs)
      const matchesTask = (doc.task_id === relatedTaskId) || (doc.task_name === relatedTaskTitle);
      return matchesSearch && matchesTask;
    }

    // Filter 3: Global View
    if (isAdmin) return matchesSearch;
    return matchesSearch && doc.employee_id === user.id;
  });

  if (loading) return <div className="p-4">Loading documents...</div>;

  return (
    <div>
      {/* HEADER */}
      <div className="page-header">
        {isTaskView && (
          <button 
            onClick={() => navigate('/tasks')}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', 
              background: 'none', border: 'none', cursor: 'pointer', 
              color: '#667085', marginBottom: '12px', padding: 0 
            }}
          >
            <FiArrowLeft /> Back to Tasks
          </button>
        )}
        
        <h1>{isTaskView ? `Documents: ${relatedTaskTitle}` : "Document Repository"}</h1>
        <p className="text-secondary">
          {isTaskView 
            ? "Manage files linked to this specific task." 
            : "Overview of all uploaded documents."}
        </p>
      </div>

      <div className="card">
        {/* Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'white', border: '1px solid #D0D5DD', padding: '8px 12px', borderRadius: '8px', width: '300px' }}>
            <FiSearch color="#667085" />
            <input 
              placeholder="Search files..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ border: 'none', outline: 'none', width: '100%' }}
            />
          </div>
        </div>

        {/* Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #EAECF0', color: '#667085', fontSize: '12px' }}>
              <th style={{ padding: '12px 0' }}>FILE NAME</th>
              {!isTaskView && <th style={{ padding: '12px 0' }}>TASK</th>}
              <th style={{ padding: '12px 0' }}>UPLOADED BY</th>
              <th style={{ padding: '12px 0' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {visibleDocs.length === 0 ? (
              <tr><td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#667085' }}>No documents found.</td></tr>
            ) : (
              visibleDocs.map((doc) => (
                <tr key={doc.id} style={{ borderBottom: '1px solid #EAECF0' }}>
                  <td style={{ padding: '16px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ padding: '8px', background: '#FEF3F2', borderRadius: '8px', color: '#B42318' }}>
                        <FiFileText />
                      </div>
                      <div>
                        <div style={{ fontWeight: '500', color: '#101828' }}>{doc.title}</div>
                        <div style={{ fontSize: '12px', color: '#667085' }}>{doc.description}</div>
                      </div>
                    </div>
                  </td>
                  
                  {!isTaskView && (
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#475467', background: '#F2F4F7', width: 'fit-content', padding: '2px 8px', borderRadius: '12px' }}>
                        <FiLayers size={12} /> {doc.task_name || 'Unlinked'}
                      </span>
                    </td>
                  )}
                  
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#475467' }}>
                      <FiUser size={14} /> {doc.employee_name}
                    </span>
                  </td>
                  
                  <td>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#155EEF' }} title="Download">
                        <FiDownload size={18} />
                      </button>
                      <button onClick={() => handleEdit(doc)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#667085' }} title="Rename">
                        <FiEdit2 size={18} />
                      </button>
                      {isAdmin && (
                        <button 
                          onClick={() => handleDelete(doc.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#F04438' }} 
                          title="Delete"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      )}
                    </div>
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

export default Documents;