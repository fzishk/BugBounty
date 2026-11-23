import type { Bug } from '../types/bazaar';
import BugCard from './BugCard';

type BugListProps = {
  bugs: Bug[];
};

export default function BugList({ bugs }: BugListProps) {
  if (bugs.length === 0) {
    return <p>No bugs found.</p>;
  }

  return (
    <div>
      {bugs.map((bug) => (
        <BugCard key={bug.id} bug={bug} />
      ))}
    </div>
  );
}
