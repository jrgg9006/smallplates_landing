export type ArticleTag = 'essential' | 'quick' | null

export interface ArticleBody {
  type: 'paragraph' | 'callout' | 'note' | 'steps' | 'imagePlaceholder'
  content?: string
  calloutTitle?: string
  steps?: string[]
  placeholderType?: string
  placeholderDesc?: string
}

export interface Article {
  id: string
  catId: string
  tag: ArticleTag
  title: string
  shortDesc: string
  body: ArticleBody[]
  relatedIds: string[]
}

export interface Category {
  id: string
  name: string
  shortDesc: string
  iconType: 'layers' | 'users' | 'bell' | 'book' | 'people'
  colorVariant: 'amber' | 'terra' | 'sage' | 'blue' | 'slate'
  articleIds: string[]
}

export type View =
  | { type: 'home' }
  | { type: 'category'; catId: string }
  | { type: 'article'; catId: string; artId: string }
