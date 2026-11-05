import React from "react";
import { Link } from "react-router-dom";

export default function BugCard({ bug }) {
  return (
    <div style={{ border: "1px solid #ccc", padding: "12px", margin: "8px 0", borderRadius: "6px" }}>
      <h3>{bug.title}</h3>
      <p>Severity: <strong>{bug.severity}</strong></p>
      <Link to={`/bugs/${bug.id}`}>Open Case</Link>
    </div>
  );
}