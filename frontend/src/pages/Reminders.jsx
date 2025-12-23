import { useEffect, useState } from 'react';

export default function Reminders() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    text: '',
    due_date: '',
  });

  useEffect(() => {
    setLoading(true);
    setError('');

    const timer = setTimeout(() => {
      setReminders([
        {
          id: '1',
          text: 'Renew health insurance',
          due_date: '2025-12-31',
        },
        {
          id: '2',
          text: 'Check probation end dates',
          due_date: '2026-01-15',
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

    if (!form.text || !form.due_date) {
      setError('Please fill in all fields.');
      return;
    }

    const newReminder = {
      id: Date.now().toString(),
      ...form,
    };

    setReminders((prev) => [newReminder, ...prev]);
    setForm({
      text: '',
      due_date: '',
    });
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Reminders</h2>
          <p className="text-muted mb-0">
            Set important reminders for HR events.
          </p>
        </div>
      </div>

      <div className="mb-4">
        <h5 className="mb-3">Add reminder</h5>

        {error && <div className="alert alert-danger">{error}</div>}

        <form className="row g-3 align-items-end" onSubmit={handleSubmit}>
          <div className="col-md-7">
            <label className="form-label">Text</label>
            <input
              name="text"
              className="form-control"
              value={form.text}
              onChange={handleChange}
              placeholder="Reminder text"
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">Due date</label>
            <input
              type="date"
              name="due_date"
              className="form-control"
              value={form.due_date}
              onChange={handleChange}
            />
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
        <h5 className="mb-3">Reminders list</h5>

        {loading ? (
          <p className="text-muted">Loading reminders…</p>
        ) : reminders.length === 0 ? (
          <p className="text-muted">No reminders found.</p>
        ) : (
          <ul className="list-group">
            {reminders.map((rem) => (
              <li key={rem.id} className="list-group-item d-flex justify-content-between align-items-center">
                <span>{rem.text}</span>
                <span className="badge bg-secondary rounded-pill">
                  {rem.due_date}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
