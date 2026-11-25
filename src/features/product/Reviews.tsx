import { Star } from 'lucide-react';
import type { Product } from '../../api/contract';

const AUTHORS = ['Priya', 'Marco', 'Aisha', 'Tom', 'Lena', 'Kenji', 'Sam', 'Noor'];
const BODIES = [
  'Exactly what my desk needed. Arrived quickly and well packed.',
  'Explained a race condition to it and found the bug in five minutes.',
  'Great quality for the price. Would buy again.',
  'My team keeps borrowing it, so I am ordering a second one.',
  'Looks even better in person. Five stars from the on-call rotation.',
  'Solid. Slightly smaller than I expected, but still great.',
];

/** Deterministic sample reviews (no API endpoint for reviews in the contract). */
function reviewsFor(product: Product) {
  const seed = Number(product.id.replace(/\D/g, '')) || 1;
  return Array.from({ length: 6 }, (_, i) => ({
    id: `${product.id}-r${i}`,
    author: AUTHORS[(seed + i) % AUTHORS.length] ?? 'Anonymous',
    stars: 5 - ((seed + i) % 3 === 0 ? 1 : 0),
    body: BODIES[(seed * 3 + i) % BODIES.length] ?? '',
  }));
}

export function Reviews({ product }: { product: Product }) {
  const reviews = reviewsFor(product);
  return (
    <section aria-labelledby="reviews-heading" className="lg:col-span-2">
      <h2 id="reviews-heading" className="text-xl font-semibold">
        Customer reviews
      </h2>
      <ul className="mt-4 grid gap-4 sm:grid-cols-2">
        {reviews.map((review) => (
          <li key={review.id} className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900">{review.author}</span>
              <span className="flex" role="img" aria-label={`${review.stars} out of 5 stars`}>
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={`size-4 ${i < review.stars ? 'fill-accent-400 text-accent-500' : 'text-slate-300'}`}
                    aria-hidden="true"
                  />
                ))}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-600">{review.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
