import { redirect } from 'next/navigation';

export default function ArtifactsPage() {
  redirect('/nodes?type=ARTIFACT');
}
