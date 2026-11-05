import React from "react";
import { useParams, Link } from "react-router-dom";

export default function BugDetail({ bugs }) {
  const { id } = useParams();
  const bug = bugs.find((b) => b.id.toString() === id);

  if (!bug) {
    return (
      <div style={{ padding: "20px" }}>
        <h2>Bug Not Found</h2>
        <p>The requested bug case does not exist.</p>
        <Link to="/">← Back to Board</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>Bug Case Details #{bug.id}</h2>
      <p><strong>Title:</strong> {bug.title}</p>
      <p><strong>Severity:</strong> {bug.severity}</p>
      <Link to="/">← Back to Bug Board</Link>
    </div>
  );
}