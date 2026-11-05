import React, { useState, useEffect } from "react";
import { Routes, Route, Link } from "react-router-dom";
import { fetchBugs } from "./mockApi";
import BugList from "./components/BugList";
import ReportBugForm from "./components/ReportBugForm";
import BugDetail from "./components/BugDetail";
import NotFound from "./components/NotFound";

export default function App() {
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const loadBugs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBugs();
      setBugs(data);
    } catch (err) {
      setError(err.message || "Failed to fetch bugs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBugs();
  }, []);

  // Derived filtered bugs (Mission 3: derived value without storing filtered results in state)
  const filteredBugs = bugs.filter((bug) =>
    bug.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddBug = (newBug) => {
    // Immutable update (Mission 4)
    setBugs((prevBugs) => [newBug, ...prevBugs]);
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Bug Bounty Board</h1>
      <nav style={{ marginBottom: "20px" }}>
        <Link to="/">Board</Link>
      </nav>

      <Routes>
        <Route
          path="/"
          element={
            <div>
              {loading && <p>Loading bugs...</p>}
              {error && (
                <div style={{ color: "red", marginBottom: "15px" }}>
                  <p>Error: {error}</p>
                  <button onClick={loadBugs} style={{ padding: "6px 12px" }}>
                    Retry
                  </button>
                </div>
              )}

              {!loading && !error && (
                <>
                  <div style={{ marginBottom: "15px" }}>
                    <input
                      type="text"
                      placeholder="Search bugs by title..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ padding: "8px", width: "100%", boxSizing: "border-box" }}
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

function BugDataRoute({ bugs }) {
  return <BugDetail bugs={bugs} />;
}