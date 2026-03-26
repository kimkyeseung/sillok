'use client';

import { useEffect } from 'react';

export default function ViewLogger({ threadId }: { threadId: string }) {
  useEffect(() => {
    fetch(`/api/threads/${threadId}/view`, { method: 'POST' }).catch(() => {});
  }, [threadId]);

  return null;
}
