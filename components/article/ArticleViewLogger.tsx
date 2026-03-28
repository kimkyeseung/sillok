'use client';

import { useEffect } from 'react';

export default function ArticleViewLogger({ slug }: { slug: string }) {
  useEffect(() => {
    fetch(`/api/articles/${slug}/view`, { method: 'POST' }).catch(() => {});
  }, [slug]);

  return null;
}
