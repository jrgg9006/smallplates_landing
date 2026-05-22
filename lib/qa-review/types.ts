/**
 * Shared types for the QA Review feature.
 * Mirrors the Pydantic models in docs/qa-review-setup/railway-qa-book/models.py
 */

export type QASeverity = 'critical' | 'warning' | 'info';
export type QAFindingSource = 'deterministic' | 'gemini';
export type QAStatus = 'uploading' | 'processing' | 'complete' | 'failed';

export type QAFindingCategory =
  | 'missing_recipe'
  | 'recipe_name_mismatch'
  | 'ingredients_mismatch'
  | 'instructions_mismatch'
  | 'missing_contributor'
  | 'missing_captain'
  | 'missing_couple_name'
  | 'missing_wedding_date'
  | 'empty_page'
  | 'text_overflow'
  | 'placeholder_unreplaced'
  | 'weird_character'
  | 'image_pixelated'
  | 'image_missing'
  | 'image_recipe_mismatch'
  | 'image_duplicate'
  | 'cover_issue'
  | 'intro_page_issue'
  | 'recipe_format_issue'
  | 'page_text_unreadable'
  | 'other';

export interface QAFinding {
  source: QAFindingSource;
  severity: QASeverity;
  category: QAFindingCategory;
  page: number | null;
  description: string;
  suggestion?: string | null;
  confidence?: number | null;
  db_value?: string | null;
  pdf_value?: string | null;
}

export interface QABookContextRecipe {
  id: string;
  recipe_name: string;
  contributor_name: string;
  ingredients: string;
  instructions: string;
  has_print_image: boolean;
  using_clean_text: boolean;
}

export interface QABookContextCouple {
  display_name: string;
  print_name: string | null;
  first_name_a: string | null;
  first_name_b: string | null;
  wedding_date: string | null;
}

export interface QABookContext {
  group_id: string;
  couple: QABookContextCouple;
  contributors: string[];
  captains: string[];
  recipes: QABookContextRecipe[];
}

/** What Next.js sends to Railway when /start is called. */
export interface RailwayQABookRequest {
  review_id: string;
  storage_signed_url: string;
  book_context: QABookContext;
  callback_url: string;
}

/** What Railway POSTs back to Next.js on /complete. */
export interface RailwayCompleteCallback {
  status: 'complete' | 'failed';
  findings?: QAFinding[];
  human_summary?: string;
  critical_count?: number;
  warning_count?: number;
  info_count?: number;
  pdf_page_count?: number;
  pdf_size_bytes?: number;
  cost_usd?: number;
  duration_ms?: number;
  gemini_model?: string;
  error_message?: string;
}

/** Row shape returned by GET endpoints (subset of the DB row). */
export interface QAReviewRow {
  id: string;
  group_id: string;
  status: QAStatus;
  storage_path: string | null;
  pdf_size_bytes: number | null;
  pdf_page_count: number | null;
  findings: QAFinding[] | null;
  human_summary: string | null;
  critical_count: number;
  warning_count: number;
  info_count: number;
  gemini_model: string | null;
  cost_usd: number | null;
  duration_ms: number | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

/** Tunables. Match the limits in Gemini Files API. */
export const QA_MAX_PDF_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB
export const QA_MAX_PDF_PAGES = 1000;
