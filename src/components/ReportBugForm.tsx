import { type ChangeEvent, type FormEvent, useState } from 'react';
import type { Bug } from '../types/bazaar';

type ReportBugFormProps = {
  onAddBug: (bug: Bug) => void;
};

export default function ReportBugForm({ onAddBug }: ReportBugFormProps) {
  const [title, setTitle] = useState('');
  const [severity, setSeverity] = useState('Medium');
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Bug title cannot be blank.');
      return;
    }
    setError('');
    const newBug: Bug = {
      id: Date.now(),
      title: title.trim(),
      severity,
    };
    onAddBug(newBug);
    setTitle('');
    setSeverity('Medium');
  };

  const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleSeverityChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSeverity(e.target.value);
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ margin: '20px 0', padding: '15px', border: '1px solid #ddd', borderRadius: '6px' }}
    >
      <h3>Report a New Bug</h3>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div style={{ marginBottom: '10px' }}>
        <label>
          Title:{' '}
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Enter bug description..."
            style={{ padding: '6px', width: '300px' }}
          />
        </label>
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label>
          Severity:{' '}
          <select value={severity} onChange={handleSeverityChange} style={{ padding: '6px' }}>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </label>
      </div>
      <button type="submit" style={{ padding: '8px 16px' }}>
        Add Bug
      </button>
    </form>
  );
}
