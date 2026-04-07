"use client"

import React from 'react'
import { ArrowRight, ImageIcon } from 'lucide-react'
import type { View, Article, ArticleBody, Category } from '@/lib/tips/types'

interface TipsArticleProps {
  article: Article
  category: Category
  relatedArticles: Article[]
  onNavigate: (view: View) => void
}

export default function TipsArticle({
  article,
  category,
  relatedArticles,
  onNavigate,
}: TipsArticleProps) {
  return (
    <div className="max-w-2xl mx-auto px-6 pb-20 md:pb-28">
      {/* Article body — editorial column */}
      <article className="pt-4 md:pt-8">
        {article.body.map((block, i) => (
          <BodyBlock key={i} block={block} />
        ))}
      </article>

      {/* Related articles — separated, minimal */}
      {relatedArticles.length > 0 && (
        <div className="mt-16 md:mt-20 pt-10 border-t border-[hsl(var(--brand-border))]">
          <div className="text-[0.65rem] font-medium tracking-[0.2em] uppercase text-[hsl(var(--brand-warm-gray))] mb-6">
            Continue reading
          </div>
          <div className="space-y-0">
            {relatedArticles.map((rel) => (
              <button
                key={rel.id}
                onClick={() =>
                  onNavigate({
                    type: 'article',
                    catId: rel.catId,
                    artId: rel.id,
                  })
                }
                className="group w-full text-left cursor-pointer block"
              >
                <div className="flex items-center justify-between gap-4 py-4 border-t border-[hsl(var(--brand-border))/40] group-last:border-b transition-colors group-hover:bg-[hsl(var(--brand-background))] -mx-6 px-6">
                  <span className="text-[0.85rem] text-[hsl(var(--brand-charcoal))] group-hover:text-[hsl(var(--brand-honey))] transition-colors">
                    {rel.title}
                  </span>
                  <ArrowRight
                    className="w-3.5 h-3.5 text-[hsl(var(--brand-warm-gray))/40] group-hover:text-[hsl(var(--brand-honey))] group-hover:translate-x-0.5 transition-all flex-shrink-0"
                    strokeWidth={1.5}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function BodyBlock({ block }: { block: ArticleBody }) {
  switch (block.type) {
    case 'paragraph':
      return (
        <p
          className="type-body !text-[0.95rem] md:!text-base mb-5"
          dangerouslySetInnerHTML={{ __html: block.content ?? '' }}
        />
      )

    case 'callout':
      return (
        <div className="relative bg-[hsl(var(--brand-cream))/45] border border-[hsl(var(--brand-honey))/20] border-l-[3px] border-l-[hsl(var(--brand-honey))] rounded-r-md rounded-l-sm px-6 md:px-8 py-6 md:py-7 my-9">
          {block.calloutTitle && (
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-4 h-px bg-[hsl(var(--brand-honey))]" />
              <div className="text-[0.66rem] font-semibold tracking-[0.18em] uppercase text-[hsl(var(--brand-honey))]">
                {block.calloutTitle}
              </div>
            </div>
          )}
          <div
            className="font-serif italic text-base md:text-[1.05rem] text-[hsl(var(--brand-charcoal))/80] leading-[1.75] whitespace-pre-line"
            dangerouslySetInnerHTML={{ __html: block.content ?? '' }}
          />
        </div>
      )

    case 'note':
      return (
        <div className="bg-[hsl(var(--brand-background))] rounded-sm px-5 md:px-6 py-5 my-7">
          <div
            className="type-body !text-[0.9rem] md:!text-[0.95rem] !text-[hsl(var(--brand-warm-gray))] whitespace-pre-line"
            dangerouslySetInnerHTML={{ __html: block.content ?? '' }}
          />
        </div>
      )

    case 'steps':
      return (
        <ol className="list-none my-6 space-y-4">
          {block.steps?.map((step, i) => (
            <li key={i} className="flex gap-4 items-start type-body !text-base md:!text-lg">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[hsl(var(--brand-charcoal))] text-white text-[0.65rem] font-semibold flex items-center justify-center mt-[3px]">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      )

    case 'imagePlaceholder':
      return (
        <div className="border border-dashed border-[hsl(var(--brand-border))] rounded-sm py-10 px-6 my-8 flex flex-col items-center gap-2">
          <ImageIcon
            className="w-5 h-5 text-[hsl(var(--brand-warm-gray))/40] mb-1"
            strokeWidth={1.25}
          />
          <div className="text-[0.62rem] font-medium text-[hsl(var(--brand-warm-gray))] tracking-[0.15em] uppercase">
            {block.placeholderType}
          </div>
          <div className="text-[0.72rem] text-[hsl(var(--brand-warm-gray))/50] text-center leading-relaxed max-w-[280px]">
            {block.placeholderDesc}
          </div>
        </div>
      )

    default:
      return null
  }
}
