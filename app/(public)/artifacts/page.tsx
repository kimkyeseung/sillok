import { permanentRedirect } from 'next/navigation';

export default function ArtifactsPage() {
  permanentRedirect('/nodes?type=ARTIFACT');
}
