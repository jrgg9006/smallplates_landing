"use client"

import React from 'react'
import { Search, ArrowLeft } from 'lucide-react'
import type { View } from '@/lib/tips/types'
import { getCategory, getArticle } from '@/lib/tips/content'

interface TipsLayoutProps {
  view: View
  onNavigate: (view: View) => void
  children: React.ReactNode
}

function getHeroContent(view: View): { title: string; subtitle: string } {
  if (view.type === 'home') {
    return {
      title: 'How can we help?',
      subtitle:
        'Everything you need to get the most recipes, make it easy for your guests, and feel confident every step of the way.',
    }
  }

  if (view.type === 'category') {
    const cat = getCategory(view.catId)
    return {
      title: cat?.name ?? '',
      subtitle: cat?.shortDesc ?? '',
    }
  }

  const art = getArticle(view.artId)
  return {
    title: art?.title ?? '',
    subtitle: art?.shortDesc ?? '',
  }
}

export default function TipsLayout({ view, onNavigate, children }: TipsLayoutProps) {
  const { title, subtitle } = getHeroContent(view)
  const isHome = view.type === 'home'

  return (
    <div className="w-full">
      {/* Hero — full-width, centered, generous breathing room */}
      <div className={`w-full ${isHome ? 'pt-14 md:pt-20 pb-10 md:pb-12' : 'pt-10 md:pt-16 pb-8 md:pb-12'}`}>
        <div className="max-w-2xl mx-auto text-center px-6">
          {isHome && (
            <div className="mb-8">
              <span className="text-[0.68rem] font-medium tracking-[0.18em] uppercase text-[hsl(var(--brand-warm-gray))]">
                Tips for success
              </span>
            </div>
          )}
          <h1
            className={`font-serif font-normal text-[hsl(var(--brand-charcoal))] leading-[1.15] ${
              isHome
                ? 'text-[2.5rem] md:text-[3.5rem] mb-5'
                : 'text-[1.75rem] md:text-[2.25rem] mb-3'
            }`}
          >
            {title}
          </h1>
          <p
            className={`text-[hsl(var(--brand-warm-gray))] leading-relaxed mx-auto ${
              isHome
                ? 'text-base md:text-lg max-w-md'
                : 'text-sm md:text-base max-w-lg'
            }`}
          >
            {subtitle}
          </p>

          {/* Search — centered, only on home */}
          {isHome && (
            <div className="mt-10 max-w-md mx-auto">
              {/* TODO: wire up search filtering against article titles and body content */}
              <div className="relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Search className="w-4 h-4 text-[hsl(var(--brand-warm-gray))]" />
                </div>
                <input
                  type="text"
                  placeholder="Search — captains, reminders, Zola..."
                  className="w-full py-3.5 pl-12 pr-5 border border-[hsl(var(--brand-border))] rounded-full text-sm text-[hsl(var(--brand-charcoal))] bg-white outline-none transition-all focus:border-[hsl(var(--brand-honey))] focus:shadow-[0_0_0_3px_hsla(var(--brand-honey),0.08)] placeholder:text-[hsl(var(--brand-warm-gray))/60]"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Thin divider */}
      <div className="w-full border-t border-[hsl(var(--brand-border))]" />

      {/* Back + breadcrumb row — quiet, understated */}
      {view.type !== 'home' && (
        <div className="max-w-2xl mx-auto px-6">
          <div className="flex items-center justify-between gap-4 py-5">
            <BackButton view={view} onNavigate={onNavigate} />
            <Breadcrumb view={view} onNavigate={onNavigate} />
          </div>
        </div>
      )}

      {/* Content */}
      {children}
    </div>
  )
}

function Breadcrumb({
  view,
  onNavigate,
}: {
  view: View
  onNavigate: (view: View) => void
}) {
  const catName = view.type !== 'home' ? getCategory(view.catId)?.name : null
  const artTitle = view.type === 'article' ? getArticle(view.artId)?.title : null

  return (
    <div className="flex items-center gap-2 text-[0.72rem] tracking-wide">
      <button
        onClick={() => onNavigate({ type: 'home' })}
        className="text-[hsl(var(--brand-honey))] hover:underline underline-offset-2 cursor-pointer transition-colors"
      >
        Help Center
      </button>

      {catName && (
        <>
          <span className="text-[hsl(var(--brand-border))]">/</span>
          {view.type === 'category' ? (
            <span className="text-[hsl(var(--brand-charcoal))]">{catName}</span>
          ) : (
            <button
              onClick={() => view.type === 'article' && onNavigate({ type: 'category', catId: view.catId })}
              className="text-[hsl(var(--brand-honey))] hover:underline underline-offset-2 cursor-pointer transition-colors"
            >
              {catName}
            </button>
          )}
        </>
      )}

      {view.type === 'article' && artTitle && (
        <>
          <span className="text-[hsl(var(--brand-border))]">/</span>
          <span className="text-[hsl(var(--brand-charcoal))] truncate max-w-[240px]">
            {artTitle}
          </span>
        </>
      )}
    </div>
  )
}

// Reason: Goes one level up — article → its category, category → home.
function BackButton({
  view,
  onNavigate,
}: {
  view: View
  onNavigate: (view: View) => void
}) {
  const handleBack = () => {
    if (view.type === 'article') {
      onNavigate({ type: 'category', catId: view.catId })
    } else if (view.type === 'category') {
      onNavigate({ type: 'home' })
    }
  }

  return (
    <button
      onClick={handleBack}
      className="group flex items-center gap-1.5 text-[0.72rem] tracking-wide text-[hsl(var(--brand-warm-gray))] hover:text-[hsl(var(--brand-charcoal))] transition-colors cursor-pointer flex-shrink-0"
    >
      <ArrowLeft
        className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform"
        strokeWidth={1.75}
      />
      Back
    </button>
  )
}
