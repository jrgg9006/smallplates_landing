import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function LegalMarkdown({ content }: { content: string }) {
  return (
    <article
      className="
        prose prose-gray max-w-none
        prose-headings:font-serif prose-headings:text-brand-charcoal prose-headings:font-medium
        prose-h1:text-3xl prose-h1:md:text-4xl prose-h1:mb-4
        prose-h2:text-xl prose-h2:md:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h2:border-b prose-h2:border-gray-100 prose-h2:pb-2
        prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3
        prose-p:text-brand-charcoal/80 prose-p:leading-[1.8] prose-p:font-sans prose-p:text-[15px]
        prose-li:text-brand-charcoal/80 prose-li:leading-[1.8] prose-li:font-sans prose-li:text-[15px]
        prose-strong:text-brand-charcoal prose-strong:font-semibold
        prose-a:text-[#D4A854] prose-a:underline prose-a:underline-offset-2 hover:prose-a:text-[#c49b4a]
        prose-table:text-sm
        prose-th:text-left prose-th:font-semibold prose-th:text-brand-charcoal
        prose-td:text-brand-charcoal/80
      "
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </article>
  );
}
