import { useEffect } from 'react';

const SUFFIX = 'The Bug Bazaar';

/** Sets the tab title for a page, so screen-reader users hear where they landed. */
export function useDocumentTitle(title: string | undefined): void {
  useEffect(() => {
    document.title = title ? `${title} · ${SUFFIX}` : SUFFIX;
  }, [title]);
}
