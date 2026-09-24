import Link from 'next/link';
import Image from 'next/image';
import { supabaseAdmin } from '@/lib/supabase-admin';

/** Latest article from the editors (sidebar) */
export default async function EditorsPick() {
  const { data } = await supabaseAdmin
    .from('articles')
    .select('slug, title, summary, thumbnail')
    .eq('is_deleted', false)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;

  return (
    <section className="card-flat overflow-hidden">
      <Link href={`/articles/${data.slug}`} className="block transition-colors hover:bg-gray-50">
        {data.thumbnail && (
          <div className="relative aspect-[2/1] bg-gray-100">
            <Image src={data.thumbnail} alt="" fill sizes="300px" className="object-cover" />
          </div>
        )}
        <div className="p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">📰 From the editors</p>
          <p className="mt-1 text-sm font-semibold text-gray-900">{data.title}</p>
          {data.summary && <p className="mt-1 line-clamp-2 text-xs text-gray-500">{data.summary}</p>}
        </div>
      </Link>
      <Link href="/articles" className="block border-t border-gray-100 px-4 py-2 text-xs font-medium text-brand-600 hover:bg-gray-50">
        All articles →
      </Link>
    </section>
  );
}
