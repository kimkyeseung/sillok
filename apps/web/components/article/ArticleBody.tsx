'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ArticleBody({ content }: { content: string }) {
  return (
    <div className="prose prose-sm prose-gray mt-8 max-w-none leading-[1.8]">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
