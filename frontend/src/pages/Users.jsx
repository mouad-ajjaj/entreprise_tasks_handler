import { useEffect, useState } from 'react';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'User',
    status: 'Active',
  });

  useEffect(() => {
    setLoading(true);
    setError('');

    const timer = setTimeout(() => {
      setUsers([
        {
          id: '1',
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'Admin',
          status: 'Active',
        },
        {
          id: '2',
          name: 'HR Manager',
          email: 'hr@example.com',
          role: 'Manager',
          status: 'Active',
        },
        {
          id: '3',
          name: 'Disabled User',
          email: 'disabled@example.com',
          role: 'User',
          status: 'Disabled',
        },
      ]);
      setLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!form.name || !form.email) {
      setError('Please fill in name and email.');
      return;
    }

    const newUser = {
      id: Date.now().toString(),
      ...form,
    };

    setUsers((prev) => [newUser, ...prev]);
    setForm({
      name: '',
      email: '',
      role: 'User',
      status: 'Active',
    });
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Users</h2>
          <p className="text-muted mb-0">
            Manage application user accounts and roles.
          </p>
        </div>
      </div>

      <div className="mb-4">
        <h5 className="mb-3">Add user</h5>

        {error && <div className="alert alert-danger">{error}</div>}

        <form className="row g-3 align-items-end" onSubmit={handleSubmit}>
          <div className="col-md-3">
            <label className="form-label">Name</label>
            <input
              name="name"
              className="form-control"
              value={form.name}
              onChange={handleChange}
              placeholder="User name"
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">Email</label>
            <input
              name="email"
              type="email"
              className="form-control"
              value={form.email}
              onChange={handleChange}
              placeholder="user@example.com"
            />
          </div>
          <div className="col-md-2">
            <label className="form-label">Role</label>
            <select
              name="role"
              className="form-select"
              value={form.role}
              onChange={handleChange}
            >
              <option value="Admin">Admin</option>
              <option value="Manager">Manager</option>
              <option value="User">User</option>
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label">Status</label>
            <select
              name="status"
              className="form-select"
              value={form.status}
              onChange={handleChange}
            >
              <option value="Active">Active</option>
              <option value="Disabled">Disabled</option>
            </select>
          </div>
          <div className="col-md-2 d-grid">
            <button type="submit" className="btn btn-primary">
              Add
            </button>
          </div>
        </form>
      </div>

      <hr />

      <div>
        <h5 className="mb-3">Users list</h5>

        {loading ? (
          <p className="text-muted">Loading users…</p>
        ) : users.length === 0 ? (
          <p className="text-muted">No users found.</p>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>
                      <span
                        className={
                          'badge rounded-pill ' +
                          (user.status === 'Active'
                            ? 'bg-success'
                            : 'bg-secondary')
                        }
                      >
                        {user.status}
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
}
