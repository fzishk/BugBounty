import { useState, useEffect, type ChangeEvent } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { fetchBugs } from './api/mockApi';
import type { Bug } from './types/bazaar';
import BugList from './components/BugList';
import ReportBugForm from './components/ReportBugForm';
import BugDetail from './components/BugDetail';
import NotFound from './components/NotFound';

type BugDataRouteProps = {
  bugs: Bug[];
};

function BugDataRoute({ bugs }: BugDataRouteProps) {
  return <BugDetail bugs={bugs} />;
}

export default function App() {
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const loadBugs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data: Bug[] = await fetchBugs();
      setBugs(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch bugs.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBugs();
  }, []);

  const filteredBugs = bugs.filter((bug) =>
    bug.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleAddBug = (newBug: Bug) => {
    setBugs((prevBugs) => [newBug, ...prevBugs]);
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>The Bug Bazaar</h1>
      <nav style={{ marginBottom: '20px' }}>
        <Link to="/">Board</Link>
      </nav>

      <Routes>
        <Route
          path="/"
          element={
            <div>
              {loading && <p>Loading bugs...</p>}
              {error && (
                <div style={{ color: 'red', marginBottom: '15px' }}>
                  <p>Error: {error}</p>
                  <button onClick={() => void loadBugs()} style={{ padding: '6px 12px' }}>
                    Retry
                  </button>
                </div>
              )}

              {!loading && !error && (
                <>
                  <div style={{ marginBottom: '15px' }}>
                    <input
                      type="text"
                      placeholder="Search bugs by title..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                      style={{ padding: '8px', width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>

                  <ReportBugForm onAddBug={handleAddBug} />

                  <h2>Bug List</h2>
                  <BugList bugs={filteredBugs} />
                </>
              )}
            </div>
          }
        />
        <Route path="/bugs/:id" element={<BugDataRoute bugs={bugs} />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}
