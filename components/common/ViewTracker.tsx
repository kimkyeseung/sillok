'use client';

import { useEffect } from 'react';

/**
 * Logs one view per page load (server dedupes by IP for 24h).
 * view_count itself is updated by the batch aggregation job — never directly.
 */
export default function ViewTracker({
  targetType,
  targetId,
}: {
  targetType: 'PERSON' | 'NODE' | 'THREAD' | 'ARTICLE';
  targetId: string;
}) {
  useEffect(() => {
    fetch('/api/view-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_type: targetType, target_id: targetId }),
      keepalive: true,
    }).catch(() => {});
  }, [targetType, targetId]);

  return null;
}
