"use client"

import React from 'react'
import { ArrowRight, ImageIcon } from 'lucide-react'
import type { View } from '@/lib/tips/types'
import { CATEGORIES, FEATURED_TIPS, getArticle } from '@/lib/tips/content'

interface TipsHomeProps {
  onNavigate: (view: View) => void
}

const CATEGORY_MARKS: Record<string, string> = {
  setup: '01',
  recipes: '02',
  captains: '03',
  reminders: '04',
  closing: '05',
}

export default function TipsHome({ onNavigate }: TipsHomeProps) {
  return (
    <>
      {/* Featured tips — wider container so 4 cards fit in a single row.
          Photo-led editorial cards in the recipe-card visual language. */}
      <div className="max-w-5xl mx-auto px-6 pt-8 md:pt-10 pb-16 md:pb-20">
        {/* Quiet, centered section header — single italic line + tiny honey rule */}
        <div className="text-center mb-10 md:mb-14">
          <div className="w-8 h-px bg-[hsl(var(--brand-honey))] mx-auto mb-5" />
          <p className="font-serif italic text-[hsl(var(--brand-warm-gray))] text-base md:text-lg">
            If you do nothing else, start with these four.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
          {FEATURED_TIPS.map((tip) => {
            const art = getArticle(tip.articleId)
            if (!art) return null

            return (
              <button
                key={tip.articleId}
                onClick={() =>
                  onNavigate({ type: 'article', catId: art.catId, artId: art.id })
                }
                className="group bg-white rounded-lg border border-[hsl(var(--brand-border))]
                           overflow-hidden text-left cursor-pointer
                           transition-all duration-300 ease-out
                           hover:-translate-y-0.5
                           hover:shadow-[0_12px_30px_-10px_rgba(45,45,45,0.12)]
                           shadow-[0_1px_3px_rgba(45,45,45,0.04)]
                           flex flex-col"
              >
                {/* Image area — placeholder for now */}
                <div className="relative aspect-[4/3] bg-[hsl(var(--brand-cream))] flex flex-col items-center justify-center gap-1 overflow-hidden">
                  <ImageIcon
                    className="w-5 h-5 text-[hsl(var(--brand-honey))/25] transition-colors duration-300 group-hover:text-[hsl(var(--brand-honey))/40]"
                    strokeWidth={1.25}
                  />
                  <span className="text-[0.55rem] font-medium tracking-[0.14em] uppercase text-[hsl(var(--brand-warm-gray))/40]">
                    Image
                  </span>
                </div>

                {/* Content area — recipe-card style, tighter for 4-up grid */}
                <div className="px-5 py-6 flex-1 flex flex-col items-center text-center">
                  <h3 className="font-serif italic text-base md:text-[1.05rem] text-[hsl(var(--brand-charcoal))] leading-snug group-hover:text-[hsl(var(--brand-honey))] transition-colors">
                    {tip.title}
                  </h3>
                  <div className="w-5 h-px bg-[hsl(var(--brand-border))] my-3" />
                  <p className="text-[0.78rem] text-[hsl(var(--brand-warm-gray))] leading-relaxed">
                    {tip.hook}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Browse by topic stays in the narrower editorial column */}
      <div className="max-w-3xl mx-auto px-6">

      {/* Thin separator */}
      <div className="w-12 h-px bg-[hsl(var(--brand-honey))] mx-auto mb-16" />

      {/* Browse by topic — editorial numbered list */}
      <div className="pb-20 md:pb-28">
        <div className="mb-10">
          <div className="text-[0.65rem] font-medium tracking-[0.2em] uppercase text-[hsl(var(--brand-warm-gray))]">
            Browse by topic
          </div>
        </div>

        <div className="space-y-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onNavigate({ type: 'category', catId: cat.id })}
              className="group w-full text-left cursor-pointer block"
            >
              <div className="flex items-baseline justify-between gap-6 py-6 md:py-7 border-t border-[hsl(var(--brand-border))] group-last:border-b transition-colors group-hover:bg-[hsl(var(--brand-background))] -mx-6 px-6">
                <div className="flex items-baseline gap-5 md:gap-8 flex-1 min-w-0">
                  <span className="text-[0.65rem] font-medium tracking-[0.15em] text-[hsl(var(--brand-warm-gray))] tabular-nums flex-shrink-0 w-5">
                    {CATEGORY_MARKS[cat.id]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-serif text-lg md:text-xl text-[hsl(var(--brand-charcoal))] leading-snug mb-1 group-hover:text-[hsl(var(--brand-honey))] transition-colors">
                      {cat.name}
                    </div>
                    <div className="text-[0.82rem] text-[hsl(var(--brand-warm-gray))] leading-relaxed">
                      {cat.shortDesc}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[0.7rem] text-[hsl(var(--brand-warm-gray))] hidden md:inline">
                    {cat.articleIds.length} articles
                  </span>
                  <ArrowRight
                    className="w-4 h-4 text-[hsl(var(--brand-warm-gray))] group-hover:text-[hsl(var(--brand-honey))] group-hover:translate-x-0.5 transition-all"
                    strokeWidth={1.5}
                  />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
      </div>
    </>
  )
}
