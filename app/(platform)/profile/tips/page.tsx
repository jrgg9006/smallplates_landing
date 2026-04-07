"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/contexts/AuthContext'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { X } from 'lucide-react'
import TipsLayout from '@/components/tips/TipsLayout'
import TipsHome from '@/components/tips/TipsHome'
import TipsCategory from '@/components/tips/TipsCategory'
import TipsArticle from '@/components/tips/TipsArticle'
import type { View } from '@/lib/tips/types'
import {
  getCategory,
  getArticle,
  getArticlesForCategory,
} from '@/lib/tips/content'

export default function TipsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [view, setView] = useState<View>({ type: 'home' })

  // Reason: SPA-style navigation doesn't trigger a page reload, so the browser
  // keeps the previous scroll position. Force scroll-to-top on every view change.
  const handleNavigate = React.useCallback((next: View) => {
    setView(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[hsl(var(--brand-honey))] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-white">
      <ProfileHeader />
      <main className="relative">
        {/* Close button — exits the knowledge center back to the dashboard */}
        <button
          onClick={() => router.push('/profile/groups')}
          aria-label="Close help center"
          className="absolute top-6 left-6 md:top-8 md:left-8 z-10 group flex items-center gap-2 text-[hsl(var(--brand-warm-gray))] hover:text-[hsl(var(--brand-charcoal))] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" strokeWidth={1.5} />
          <span className="text-[0.72rem] tracking-wide hidden sm:inline">Close</span>
        </button>

        <TipsLayout view={view} onNavigate={handleNavigate}>
          {view.type === 'home' && <TipsHome onNavigate={handleNavigate} />}

          {view.type === 'category' && (() => {
            const cat = getCategory(view.catId)
            if (!cat) return null
            const articles = getArticlesForCategory(view.catId)
            return (
              <TipsCategory
                category={cat}
                articles={articles}
                onNavigate={handleNavigate}
              />
            )
          })()}

          {view.type === 'article' && (() => {
            const art = getArticle(view.artId)
            const cat = getCategory(view.catId)
            if (!art || !cat) return null
            const relatedArticles = art.relatedIds
              .map((id) => getArticle(id))
              .filter((a): a is NonNullable<typeof a> => a !== undefined)
            return (
              <TipsArticle
                article={art}
                category={cat}
                relatedArticles={relatedArticles}
                onNavigate={handleNavigate}
              />
            )
          })()}
        </TipsLayout>
      </main>
    </div>
  )
}
