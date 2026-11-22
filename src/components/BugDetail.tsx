import { useParams, Link } from 'react-router-dom';
import type { Bug } from '../types/bazaar';

type BugDetailProps = {
  bugs: Bug[];
};

export default function BugDetail({ bugs }: BugDetailProps) {
  const { id } = useParams<{ id: string }>();
  const bug = bugs.find((b) => b.id.toString() === id);

  if (!bug) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>Bug Not Found</h2>
        <p>The requested bug case does not exist.</p>
        <Link to="/">← Back to Board</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Bug Case Details #{bug.id}</h2>
      <p>
        <strong>Title:</strong> {bug.title}
      </p>
      <p>
        <strong>Severity:</strong> {bug.severity ?? 'medium'}
      </p>
      <Link to="/">← Back to Bug Board</Link>
    </div>
  );
}
