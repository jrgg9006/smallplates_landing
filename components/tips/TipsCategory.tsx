"use client"

import React from 'react'
import { ImageIcon } from 'lucide-react'
import type { View, Category, Article } from '@/lib/tips/types'

interface TipsCategoryProps {
  category: Category
  articles: Article[]
  onNavigate: (view: View) => void
}

export default function TipsCategory({
  category,
  articles,
  onNavigate,
}: TipsCategoryProps) {
  return (
    <div className="max-w-3xl mx-auto px-6 pb-20 md:pb-28">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-4">
        {articles.map((art) => (
          <button
            key={art.id}
            onClick={() =>
              onNavigate({ type: 'article', catId: category.id, artId: art.id })
            }
            className="group text-left cursor-pointer rounded-lg border border-[hsl(var(--brand-border))]
                       overflow-hidden bg-white transition-all duration-200
                       hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(45,45,45,0.1)]
                       shadow-[0_1px_3px_rgba(45,45,45,0.06)]"
          >
            {/* Image placeholder */}
            <div className="aspect-[16/10] bg-[hsl(var(--brand-background))] flex flex-col items-center justify-center gap-1.5 border-b border-[hsl(var(--brand-border))/50]">
              <ImageIcon
                className="w-6 h-6 text-[hsl(var(--brand-warm-gray))/30]"
                strokeWidth={1.25}
              />
              <span className="text-[0.58rem] font-medium tracking-[0.12em] uppercase text-[hsl(var(--brand-warm-gray))/30]">
                Image
              </span>
            </div>

            {/* Content */}
            <div className="px-5 py-5">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {art.tag && <TagBadge tag={art.tag} />}
              </div>
              <h3 className="font-serif text-base text-[hsl(var(--brand-charcoal))] leading-snug group-hover:text-[hsl(var(--brand-honey))] transition-colors mb-2">
                {art.title}
              </h3>
              <p className="text-[0.78rem] text-[hsl(var(--brand-warm-gray))] leading-relaxed line-clamp-2">
                {art.shortDesc}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function TagBadge({ tag }: { tag: 'essential' | 'quick' }) {
  if (tag === 'essential') {
    return (
      <span className="text-[0.6rem] font-medium tracking-wide uppercase px-2 py-0.5 rounded-full border border-[hsl(var(--brand-honey))/30] text-[hsl(var(--brand-honey))]">
        Essential
      </span>
    )
  }
  return (
    <span className="text-[0.6rem] font-medium tracking-wide uppercase px-2 py-0.5 rounded-full border border-[#557A50]/25 text-[#557A50]">
      Quick
    </span>
  )
}
