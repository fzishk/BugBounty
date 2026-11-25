import { useState } from 'react';
import { ImageOff } from 'lucide-react';

type Props = { src: string; alt: string; className?: string; eager?: boolean };

/** Lazy-loaded product image with a fixed square box (no layout shift) and a fallback. */
export function ProductImage({ src, alt, className = '', eager = false }: Props) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={`aspect-square overflow-hidden bg-slate-100 ${className}`}>
      {failed ? (
        <div
          className="grid size-full place-items-center text-slate-500"
          role="img"
          aria-label={alt}
        >
          <ImageOff className="size-8" aria-hidden="true" />
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          width={400}
          height={400}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          className="size-full object-cover"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
