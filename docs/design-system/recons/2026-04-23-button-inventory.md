#### Section 1 — Metadata
Button Inventory Recon — April 23, 2026
Purpose: Complete inventory of user-facing buttons across the product,
fingerprinted by visual signature, for Phase 2 radius consolidation.
Status: Reference document. Do not edit.
Scope:
- `app/(public)/`
- `app/(platform)/`
- `app/(auth)/`
- `app/copy/`
- `app/welcome/`
- `app/check-your-email/`
- `components/landing/`
- `components/profile/`
- `components/onboarding/`
- `components/groups/`
- `components/auth/`
- `components/pricing/`
- `components/recipe-journey/`
- Any file in `components/` or `app/` with `Modal` or `Dialog` in filename
Total buttons inventoried: 460
Total files scanned: 172
Ambiguous/skipped: 10 (see Section 5)

#### Section 2 — Per-file inventory

app/(admin)/admin/books/components/CreateCompedBookDialog.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 88 | `<button>` | `rounded-lg` | `implicit` | `px-3 py-1.5` | `text-sm font-medium` | `primary-honey` | `modal` | `native-button-inline` |  |
| 120 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `native-button-inline` |  |
| 130 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `native-button-inline` |  |
| 193 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `native-button-inline` |  |
| 231 | `<button>` | `rounded-lg` | `implicit` | `py-2.5` | `text-sm font-medium` | `primary-honey` | `modal` | `native-button-inline` |  |

app/(auth)/activate/[token]/page.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 157 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `other` | `native-button-inline` |  |
| 224 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `other` | `native-button-inline` |  |
| 332 | `<button>` | `rounded-xl` | `implicit` | `py-3` | `font-semibold` | `ghost` | `icon-only` | `native-button-inline` | composed |
| 354 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `other` | `native-button-inline` |  |

app/(auth)/onboarding/page.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 43 | `<button>` | `none` | `implicit` | `px-6 py-3` | `font-medium` | `ghost` | `icon-only` | `native-button-inline` |  |
| 46 | `<button>` | `rounded-sm` | `implicit` | `px-8 py-3` | `font-semibold` | `ghost` | `icon-only` | `native-button-inline` | composed |
| 199 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `icon-only` | `native-button-inline` |  |
| 270 | `<button>` | `rounded-sm` | `implicit` | `px-8 py-3.5` | `font-semibold` | `ghost` | `icon-only` | `native-button-inline` | composed |
| 281 | `<button>` | `none` | `implicit` | `px-6 py-3` | `font-medium` | `ghost` | `icon-only` | `native-button-inline` |  |
| 310 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `other` | `native-button-inline` |  |

app/(auth)/reset-password/page.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 297 | `<button>` | `rounded-xl` | `implicit` | `py-3` | `font-semibold` | `primary-dark` | `icon-only` | `native-button-inline` |  |
| 312 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `other` | `native-button-inline` |  |
| 357 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `other` | `native-button-inline` |  |
| 449 | `<button>` | `rounded-xl` | `implicit` | `py-3` | `font-semibold` | `ghost` | `icon-only` | `native-button-inline` | composed |
| 473 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `other` | `native-button-inline` |  |

app/(platform)/profile/account/page.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 75 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |

app/(platform)/profile/cookbook/page.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 272 | `<Button>` | `none` | `h-8` | `none` | `none` | `ghost` | `profile-inline` | `shadcn-Button` |  |
| 292 | `<Button>` | `rounded-lg` | `implicit` | `px-8 py-3` | `text-base font-medium` | `primary-honey` | `profile-inline` | `shadcn-Button` | accent color is teal |

app/(platform)/profile/groups/page.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 674 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 685 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 701 | `<div>` | `none` | `implicit` | `none` | `none` | `primary-dark` | `profile-inline` | `div-role-button` | composed |
| 706 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 720 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 734 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 763 | `<div>` | `none` | `implicit` | `none` | `none` | `primary-dark` | `profile-inline` | `div-role-button` |  |
| 830 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-primary` | `btn-primary` |  |
| 839 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-primary` | `btn-secondary` |  |
| 848 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-primary` | `btn-secondary` |  |
| 857 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-primary` | `btn-secondary` |  |
| 867 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 879 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |

app/(platform)/profile/how-it-works/page.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 242 | `<Button>` | `rounded-lg` | `implicit` | `px-8 py-6` | `text-lg font-medium` | `primary-dark` | `profile-inline` | `shadcn-Button` |  |
| 280 | `<Button>` | `rounded-lg` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `shadcn-Button` |  |
| 284 | `<Button>` | `rounded-lg` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `shadcn-Button` |  |
| 288 | `<Button>` | `rounded-lg` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `shadcn-Button` |  |
| 347 | `<Button>` | `rounded-lg` | `implicit` | `px-8 py-6` | `text-lg font-medium` | `primary-dark` | `profile-inline` | `shadcn-Button` |  |
| 586 | `<Button>` | `rounded-lg` | `implicit` | `px-12 py-6` | `text-xl font-medium` | `primary-dark` | `profile-inline` | `shadcn-Button` |  |

app/(platform)/profile/orders/page.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 75 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |

app/(platform)/profile/recipes/page.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 201 | `<Button>` | `rounded-lg` | `implicit` | `px-8 py-3` | `text-base font-medium` | `other` | `profile-inline` | `shadcn-Button` | no explicit color-role rule match; color-rule fallback |
| 276 | `<Button>` | `none` | `implicit` | `none` | `none` | `primary-dark` | `profile-inline` | `shadcn-Button` |  |

app/(platform)/profile/tips/page.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 52 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |

app/(public)/collect/[token]/CollectionForm.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 472 | `<Button>` | `rounded-full` | `h-10` | `px-4 py-2` | `none` | `ghost` | `form` | `shadcn-Button` | composed |
| 512 | `<Button>` | `rounded-full` | `h-10` | `px-4 py-2` | `none` | `ghost` | `form` | `shadcn-Button` | composed |
| 534 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `form` | `native-button-inline` |  |
| 552 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `form` | `native-button-inline` |  |
| 600 | `<Button>` | `rounded-full` | `h-10` | `px-4 py-2` | `none` | `ghost` | `form` | `shadcn-Button` | composed |

app/(public)/collect/[token]/recipe/page.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 146 | `<button>` | `rounded-md` | `implicit` | `px-4 py-2` | `text-sm font-medium` | `outline` | `icon-only` | `native-button-inline` |  |

app/(public)/collect/[token]/review/page.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 151 | `<Button>` | `none` | `implicit` | `none` | `none` | `ghost` | `other` | `shadcn-Button` |  |
| 177 | `<Button>` | `none` | `implicit` | `none` | `none` | `primary-honey` | `icon-only` | `shadcn-Button` |  |
| 200 | `<Button>` | `rounded-full` | `implicit` | `none` | `none` | `ghost` | `icon-only` | `shadcn-Button` |  |
| 294 | `<Button>` | `none` | `implicit` | `none` | `none` | `ghost` | `icon-only` | `shadcn-Button` |  |
| 303 | `<Button>` | `none` | `implicit` | `none` | `none` | `primary-honey` | `icon-only` | `shadcn-Button` |  |

app/(public)/how-it-works/page.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 263 | `<Button>` | `rounded-lg` | `implicit` | `px-8 py-6` | `text-lg font-medium` | `primary-dark` | `icon-only` | `shadcn-Button` |  |
| 298 | `<Button>` | `rounded-lg` | `implicit` | `none` | `none` | `ghost` | `icon-only` | `shadcn-Button` |  |
| 302 | `<Button>` | `rounded-lg` | `implicit` | `none` | `none` | `ghost` | `icon-only` | `shadcn-Button` |  |
| 306 | `<Button>` | `rounded-lg` | `implicit` | `none` | `none` | `ghost` | `icon-only` | `shadcn-Button` |  |
| 359 | `<Button>` | `rounded-lg` | `implicit` | `px-8 py-6` | `text-lg font-medium` | `primary-dark` | `icon-only` | `shadcn-Button` |  |
| 546 | `<Button>` | `rounded-lg` | `implicit` | `px-12 py-6` | `text-xl font-medium` | `other` | `icon-only` | `shadcn-Button` | no explicit color-role rule match; color-rule fallback |

app/(public)/preview-recipe-journey/page.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 219 | `<Button>` | `rounded-full` | `h-10` | `px-4 py-2` | `none` | `ghost` | `icon-only` | `shadcn-Button` | composed |
| 266 | `<Button>` | `rounded-full` | `h-10` | `px-4 py-2` | `none` | `ghost` | `icon-only` | `shadcn-Button` | composed |

app/check-your-email/ResendButton.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 73 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `icon-only` | `native-button-inline` | composed |

app/copy/[bookId]/CopyOrderClient.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 285 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `other` | `native-button-inline` |  |
| 295 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `other` | `native-button-inline` |  |
| 327 | `<button>` | `rounded-full` | `implicit` | `py-4` | `text-base font-medium` | `primary-dark` | `icon-only` | `native-button-inline` |  |
| 495 | `<button>` | `rounded-full` | `implicit` | `py-4` | `text-base font-medium` | `primary-dark` | `icon-only` | `native-button-inline` |  |
| 503 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `other` | `native-button-inline` |  |

app/welcome/page.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 216 | `<button>` | `rounded-xl` | `implicit` | `none` | `font-medium` | `primary-honey` | `icon-only` | `native-button-inline` |  |
| 226 | `<button>` | `none` | `implicit` | `py-2` | `none` | `ghost` | `icon-only` | `native-button-inline` |  |

components/auth/LoginModal.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 93 | `<div>` | `none` | `implicit` | `none` | `none` | `primary-dark` | `modal` | `div-role-button` |  |
| 97 | `<div>` | `rounded-2xl` | `implicit` | `none` | `none` | `other` | `modal` | `div-role-button` | no explicit color-role rule match; color-rule fallback |
| 102 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `native-button-inline` |  |
| 197 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `native-button-inline` |  |
| 205 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `native-button-inline` |  |
| 216 | `<button>` | `rounded-lg` | `implicit` | `py-3` | `font-semibold` | `primary-dark` | `modal` | `native-button-inline` |  |
| 231 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `native-button-inline` |  |
| 258 | `<button>` | `rounded-lg` | `implicit` | `px-4 py-2` | `none` | `other` | `modal` | `native-button-inline` | no explicit color-role rule match; color-rule fallback |
| 294 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `native-button-inline` |  |

components/groups/GroupJoinForm.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 245 | `<Button>` | `none` | `implicit` | `none` | `none` | `ghost` | `form` | `shadcn-Button` |  |
| 434 | `<Button>` | `none` | `implicit` | `py-3` | `text-sm font-semibold` | `primary-dark` | `form` | `shadcn-Button` |  |
| 448 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `form` | `native-button-inline` |  |

components/landing/Banner.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 52 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `landing-inline` | `native-button-inline` |  |
| 70 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `landing-inline` | `native-button-inline` |  |
| 100 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `landing-inline` | `native-button-inline` |  |

components/landing/BookDetailsModal.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 51 | `<div>` | `none` | `implicit` | `none` | `none` | `primary-dark` | `modal` | `div-role-button` |  |
| 60 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `native-button-inline` |  |

components/landing/BookPreview/BookPreviewModal.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 63 | `<button>` | `rounded-xl` | `implicit` | `px-6 py-3` | `font-medium` | `outline` | `modal` | `native-button-inline` |  |
| 69 | `<button>` | `rounded-xl` | `implicit` | `px-6 py-3` | `font-medium` | `primary-honey` | `modal` | `native-button-inline` |  |

components/landing/BooksPrinted.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 225 | `<button>` | `rounded-full` | `implicit` | `px-8 py-4` | `text-lg font-medium` | `primary-honey` | `landing-cta` | `native-button-inline` |  |
| 251 | `<div>` | `rounded-2xl` | `implicit` | `none` | `none` | `other` | `landing-inline` | `div-role-button` | no explicit color-role rule match; color-rule fallback |

components/landing/EmotionalClose.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 121 | `<button>` | `rounded-full` | `implicit` | `px-10 py-4` | `text-lg font-medium` | `primary-honey` | `landing-cta` | `native-button-inline` |  |

components/landing/Footer.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 71 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `landing-inline` | `native-button-inline` |  |
| 79 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `landing-inline` | `native-button-inline` |  |

components/landing/Hero.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 73 | `<button>` | `rounded-full` | `implicit` | `px-8 py-4` | `text-lg font-medium` | `primary-honey` | `landing-cta` | `native-button-inline` |  |
| 83 | `<button>` | `rounded` | `implicit` | `px-2 py-1` | `text-lg font-light` | `ghost` | `landing-inline` | `native-button-inline` |  |

components/landing/NewsletterSignup.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 112 | `<button>` | `rounded-full` | `implicit` | `px-8 py-3` | `text-base font-semibold` | `primary-honey` | `landing-inline` | `native-button-inline` |  |

components/landing/PersonalNotes.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 167 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `landing-inline` | `native-button-inline` |  |

components/landing/RecipeModal.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 47 | `<div>` | `none` | `implicit` | `none` | `none` | `primary-dark` | `modal` | `div-role-button` |  |
| 56 | `<button>` | `rounded-full` | `implicit` | `none` | `none` | `other` | `modal` | `native-button-inline` | no explicit color-role rule match; color-rule fallback |

components/landing/RegistryInterlude.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 36 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `landing-inline` | `native-button-inline` |  |

components/landing/TheBook.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 227 | `<button>` | `rounded-full` | `implicit` | `px-8 py-4` | `text-lg font-medium` | `primary-honey` | `landing-cta` | `native-button-inline` |  |

components/landing/TheSolution.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 94 | `<button>` | `rounded-full` | `implicit` | `px-8 py-4` | `text-lg font-medium` | `primary-honey` | `landing-cta` | `native-button-inline` |  |

components/onboarding/CustomDropdown.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 76 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `onboarding` | `native-button-inline` |  |
| 110 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `onboarding` | `native-button-inline` |  |

components/onboarding/DatePickerStep.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 229 | `<button>` | `rounded-full` | `implicit` | `none` | `none` | `ghost` | `onboarding` | `native-button-inline` |  |
| 316 | `<button>` | `none` | `implicit` | `none` | `text-sm font-light` | `ghost` | `onboarding` | `native-button-inline` |  |
| 344 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `onboarding` | `native-button-inline` |  |
| 351 | `<button>` | `rounded-xl` | `implicit` | `px-8 py-3` | `font-semibold` | `ghost` | `onboarding` | `native-button-inline` | composed |

components/onboarding/FirstRecipeExperience.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 66 | `<button>` | `none` | `implicit` | `none` | `text-sm` | `other` | `onboarding` | `native-button-inline` | no explicit color-role rule match; color-rule fallback |
| 87 | `<Button>` | `none` | `implicit` | `px-8 py-4` | `text-lg` | `primary-dark` | `onboarding` | `shadcn-Button` |  |
| 203 | `<Button>` | `none` | `implicit` | `py-4` | `text-lg` | `primary-dark` | `onboarding` | `shadcn-Button` |  |

components/onboarding/OnboardingCards.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 104 | `<button>` | `none` | `implicit` | `none` | `text-sm` | `other` | `onboarding` | `native-button-inline` | no explicit color-role rule match; color-rule fallback |

components/onboarding/OnboardingStep.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 138 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `onboarding` | `native-button-inline` |  |

components/onboarding/ProductSelectionStep.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 55 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `onboarding` | `native-button-inline` |  |
| 89 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `onboarding` | `native-button-inline` |  |

components/onboarding/SelectionCard.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 21 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `onboarding` | `native-button-inline` |  |

components/onboarding/SetupChecklist.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 192 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `onboarding` | `native-button-inline` |  |
| 209 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `onboarding` | `native-button-inline` |  |
| 304 | `<button>` | `rounded-[10px` | `implicit` | `px-5` | `none` | `other` | `onboarding` | `native-button-inline` | no explicit color-role rule match; color-rule fallback |
| 363 | `<button>` | `rounded-full` | `h-8` | `none` | `none` | `ghost` | `onboarding` | `native-button-inline` |  |
| 384 | `<button>` | `rounded-full` | `implicit` | `px-6 py-3` | `text-sm font-medium` | `other` | `onboarding` | `native-button-inline` | no explicit color-role rule match; color-rule fallback |
| 400 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `onboarding` | `native-button-inline` |  |
| 472 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `onboarding` | `native-button-inline` |  |
| 488 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `onboarding` | `native-button-inline` |  |
| 501 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `onboarding` | `native-button-inline` |  |
| 515 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `onboarding` | `native-button-inline` |  |
| 528 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `onboarding` | `native-button-inline` |  |
| 539 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `onboarding` | `native-button-inline` |  |

components/onboarding/StepSuccess.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 70 | `<Button>` | `none` | `implicit` | `py-3` | `none` | `primary-dark` | `onboarding` | `shadcn-Button` |  |

components/onboarding/WelcomeOverlay.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 54 | `<Button>` | `rounded-full` | `implicit` | `px-10 py-3` | `text-base font-medium` | `primary-dark` | `onboarding` | `shadcn-Button` |  |

components/pricing/PricingPage.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 163 | `<button>` | `rounded-full` | `implicit` | `px-10 py-4` | `text-lg font-medium` | `primary-honey` | `icon-only` | `native-button-inline` |  |
| 170 | `<button>` | `none` | `implicit` | `none` | `text-sm` | `ghost` | `icon-only` | `native-button-inline` |  |

components/profile/CustomizeCollectorModal.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 92 | `<button>` | `none` | `implicit` | `none` | `text-sm font-medium` | `ghost` | `modal` | `native-button-inline` |  |
| 201 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `native-button-inline` |  |
| 274 | `<Button>` | `rounded-full` | `implicit` | `py-3` | `none` | `primary-dark` | `modal` | `shadcn-Button` |  |
| 303 | `<Button>` | `rounded-full` | `implicit` | `px-6 py-2` | `none` | `primary-dark` | `modal` | `shadcn-Button` |  |

components/profile/EmptyStateBanner.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 33 | `<Button>` | `none` | `implicit` | `none` | `none` | `primary-dark` | `profile-inline` | `shadcn-Button` |  |

components/profile/FirstRecipeModal.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 136 | `<Button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `shadcn-Button` |  |
| 143 | `<Button>` | `none` | `implicit` | `none` | `none` | `primary-dark` | `modal` | `shadcn-Button` |  |

components/profile/OnboardingResume.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 49 | `<Button>` | `none` | `implicit` | `px-6 py-2` | `text-sm` | `other` | `profile-inline` | `shadcn-Button` | no explicit color-role rule match; color-rule fallback |
| 55 | `<button>` | `none` | `implicit` | `px-3 py-2` | `text-sm` | `ghost` | `profile-inline` | `native-button-inline` |  |

components/profile/ProfileDropdown.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 54 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 69 | `<button>` | `none` | `implicit` | `px-4 py-2` | `text-sm` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 79 | `<button>` | `none` | `implicit` | `px-4 py-2` | `text-sm` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 89 | `<button>` | `none` | `implicit` | `px-4 py-2` | `text-sm` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 99 | `<button>` | `none` | `implicit` | `px-4 py-2` | `text-sm` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 109 | `<button>` | `none` | `implicit` | `px-4 py-2` | `text-sm` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 119 | `<button>` | `none` | `implicit` | `px-4 py-2` | `text-sm` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 129 | `<button>` | `none` | `implicit` | `px-4 py-2` | `text-sm` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 139 | `<button>` | `none` | `implicit` | `px-4 py-2` | `text-sm` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 150 | `<button>` | `none` | `implicit` | `px-4 py-2` | `text-sm` | `ghost` | `profile-inline` | `native-button-inline` |  |

components/profile/ProfileHeader.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 78 | `<button>` | `rounded-full` | `h-10` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 101 | `<button>` | `rounded-full` | `implicit` | `px-5 py-3` | `font-semibold` | `other` | `profile-inline` | `native-button-inline` | composed; no explicit color-role rule match; color-rule fallback |
| 111 | `<button>` | `rounded-full` | `implicit` | `px-5 py-3` | `font-semibold` | `other` | `profile-inline` | `native-button-inline` | composed; no explicit color-role rule match; color-rule fallback |
| 121 | `<button>` | `rounded-full` | `implicit` | `px-5 py-3` | `font-semibold` | `primary-dark` | `profile-inline` | `native-button-inline` |  |

components/profile/ProfileTabs.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 52 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 91 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |

components/profile/account/DangerZone.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 100 | `<Button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `shadcn-Button` |  |
| 122 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 197 | `<Button>` | `none` | `implicit` | `none` | `none` | `destructive` | `profile-inline` | `shadcn-Button` |  |
| 214 | `<Button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `shadcn-Button` |  |

components/profile/account/EmailChangeForm.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 170 | `<Button>` | `none` | `implicit` | `none` | `none` | `other` | `profile-inline` | `shadcn-Button` | no explicit color-role rule match; color-rule fallback |
| 186 | `<Button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `shadcn-Button` |  |

components/profile/account/PasswordChangeForm.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 148 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 174 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 238 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 269 | `<Button>` | `none` | `implicit` | `none` | `none` | `other` | `profile-inline` | `shadcn-Button` | no explicit color-role rule match; color-rule fallback |
| 283 | `<Button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `shadcn-Button` |  |

components/profile/account/PersonalInfoForm.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 202 | `<Button>` | `none` | `implicit` | `none` | `none` | `primary-dark` | `profile-inline` | `shadcn-Button` |  |
| 216 | `<Button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `shadcn-Button` |  |

components/profile/account/SetupGuidePreferences.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 34 | `<button>` | `rounded-full` | `implicit` | `px-4 py-2` | `text-sm font-medium` | `other` | `profile-inline` | `native-button-inline` | no explicit color-role rule match; color-rule fallback |

components/profile/cookbook/AddNoteModal.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 159 | `<Button>` | `rounded-full` | `implicit` | `py-3` | `none` | `primary-dark` | `modal` | `shadcn-Button` |  |
| 188 | `<Button>` | `rounded-full` | `implicit` | `py-3` | `none` | `primary-dark` | `modal` | `shadcn-Button` |  |

components/profile/cookbook/AddToCookbookModal.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 248 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `native-button-inline` |  |
| 265 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `native-button-inline` |  |
| 306 | `<Button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `shadcn-Button` |  |
| 316 | `<Button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `shadcn-Button` |  |

components/profile/cookbook/CookbookActionsDropdown.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 94 | `<Button>` | `none` | `h-8` | `none` | `none` | `ghost` | `profile-inline` | `shadcn-Button` |  |
| 117 | `<button>` | `none` | `implicit` | `px-3 py-2` | `text-sm` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 128 | `<button>` | `none` | `implicit` | `px-3 py-2` | `text-sm` | `ghost` | `profile-inline` | `native-button-inline` |  |

components/profile/cookbook/CookbookMembersDropdown.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 262 | `<Button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `shadcn-Button` |  |
| 386 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 431 | `<div>` | `rounded-md` | `implicit` | `py-1` | `none` | `outline` | `profile-inline` | `div-role-button` |  |
| 440 | `<button>` | `none` | `implicit` | `px-3 py-2` | `text-sm` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 452 | `<button>` | `none` | `implicit` | `px-3 py-2` | `text-sm` | `ghost` | `profile-inline` | `native-button-inline` |  |

components/profile/cookbook/CookbookTable.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 274 | `<Button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `shadcn-Button` |  |
| 458 | `<Button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `shadcn-Button` |  |
| 470 | `<Button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `shadcn-Button` |  |

components/profile/cookbook/CookbookTableColumns.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 133 | `<Button>` | `none` | `h-10` | `none` | `none` | `ghost` | `profile-inline` | `shadcn-Button` |  |
| 155 | `<button>` | `none` | `implicit` | `px-3 py-2` | `text-sm` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 390 | `<Button>` | `none` | `h-8` | `px-2` | `none` | `ghost` | `profile-inline` | `shadcn-Button` |  |

components/profile/cookbook/CookbookTableControls.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 53 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 67 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 83 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 155 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 169 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 185 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |

components/profile/cookbook/CreateCookbookModal.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 196 | `<Button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `shadcn-Button` |  |
| 203 | `<Button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `shadcn-Button` |  |

components/profile/cookbook/DeleteCookbookModal.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 70 | `<Button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `shadcn-Button` |  |
| 78 | `<Button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `shadcn-Button` |  |

components/profile/cookbook/EditCookbookNameModal.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 217 | `<Button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `shadcn-Button` |  |
| 224 | `<Button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `shadcn-Button` |  |

components/profile/cookbook/MobileCookbookCard.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 87 | `<div>` | `rounded-lg` | `implicit` | `none` | `none` | `outline` | `profile-inline` | `div-role-button` |  |
| 137 | `<div>` | `none` | `implicit` | `none` | `none` | `other` | `profile-inline` | `div-role-button` | no explicit color-role rule match; color-rule fallback |
| 139 | `<Button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `shadcn-Button` |  |
| 157 | `<Button>` | `none` | `h-8` | `none` | `none` | `ghost` | `profile-inline` | `shadcn-Button` |  |
| 174 | `<button>` | `none` | `implicit` | `px-3 py-2` | `text-sm` | `ghost` | `profile-inline` | `native-button-inline` |  |

components/profile/groups/AddFriendToGroupModal.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 199 | `<Button>` | `none` | `implicit` | `none` | `none` | `other` | `modal` | `shadcn-Button` | composed; no explicit color-role rule match; color-rule fallback |
| 232 | `<Button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `shadcn-Button` |  |
| 239 | `<Button>` | `none` | `implicit` | `none` | `none` | `primary-dark` | `modal` | `shadcn-Button` |  |

components/profile/groups/BookClosedStatus.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 26 | `<button>` | `rounded-full` | `implicit` | `px-4 py-2` | `text-xs font-medium` | `other` | `profile-inline` | `native-button-inline` | no explicit color-role rule match; color-rule fallback |
| 84 | `<button>` | `rounded-lg` | `implicit` | `px-4 py-2` | `font-medium` | `ghost` | `profile-inline` | `native-button-inline` | composed |
| 462 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 627 | `<button>` | `rounded-full` | `implicit` | `py-3` | `text-sm font-medium` | `primary-dark` | `profile-inline` | `native-button-inline` |  |

components/profile/groups/BookPreviewPanel.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 63 | `<Button>` | `none` | `implicit` | `none` | `font-medium` | `ghost` | `profile-inline` | `shadcn-Button` |  |

components/profile/groups/CaptainsDropdown.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 148 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 165 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |

components/profile/groups/CloseBookModal.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 50 | `<button>` | `rounded-full` | `implicit` | `py-3` | `font-medium` | `other` | `modal` | `native-button-inline` | no explicit color-role rule match; color-rule fallback |
| 57 | `<button>` | `rounded-full` | `implicit` | `py-3` | `font-medium` | `primary-dark` | `modal` | `native-button-inline` |  |
| 64 | `<button>` | `rounded-full` | `implicit` | `py-3` | `font-medium` | `primary-dark` | `modal` | `native-button-inline` |  |

components/profile/groups/CoupleNamesModal.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 58 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `native-button-inline` |  |
| 83 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `native-button-inline` |  |
| 290 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `native-button-inline` |  |
| 341 | `<button>` | `rounded-xl` | `implicit` | `none` | `font-medium` | `primary-honey` | `modal` | `native-button-inline` |  |

components/profile/groups/CreateGroupModal.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 168 | `<Button>` | `rounded-full` | `implicit` | `py-3` | `none` | `primary-dark` | `modal` | `shadcn-Button` |  |

components/profile/groups/DeleteGroupModal.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 83 | `<Button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `shadcn-Button` |  |
| 91 | `<Button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `shadcn-Button` |  |

components/profile/groups/EditGroupModal.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 245 | `<Button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `shadcn-Button` |  |
| 252 | `<Button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `shadcn-Button` |  |

components/profile/groups/ExtraCopyPurchase.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 88 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 96 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 120 | `<button>` | `rounded-full` | `implicit` | `py-4` | `text-base font-medium` | `primary-dark` | `profile-inline` | `native-button-inline` |  |
| 127 | `<button>` | `none` | `implicit` | `none` | `text-sm` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 373 | `<button>` | `rounded-full` | `implicit` | `py-4` | `text-base font-medium` | `primary-dark` | `profile-inline` | `native-button-inline` |  |
| 381 | `<button>` | `none` | `implicit` | `none` | `text-sm` | `ghost` | `profile-inline` | `native-button-inline` |  |

components/profile/groups/GroupActionsDropdown.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 97 | `<Button>` | `none` | `h-8` | `none` | `none` | `ghost` | `profile-inline` | `shadcn-Button` |  |
| 120 | `<button>` | `none` | `implicit` | `px-3 py-2` | `text-sm` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 131 | `<button>` | `none` | `implicit` | `px-3 py-2` | `text-sm` | `ghost` | `profile-inline` | `native-button-inline` |  |

components/profile/groups/GroupMembersDropdown.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 192 | `<Button>` | `rounded-lg` | `h-12` | `px-3` | `text-base font-medium` | `outline` | `profile-inline` | `shadcn-Button` |  |
| 316 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 328 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |

components/profile/groups/GroupNavigationSheet.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 110 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 165 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |

components/profile/groups/GroupsSection.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 257 | `<Button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `shadcn-Button` |  |
| 331 | `<Button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `shadcn-Button` |  |

components/profile/groups/MoreMenuDropdown.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 32 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 43 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 54 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 64 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 76 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |

components/profile/groups/PostCloseFlow.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 178 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 189 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 231 | `<button>` | `rounded-full` | `implicit` | `py-4` | `text-base font-medium` | `primary-dark` | `profile-inline` | `native-button-inline` |  |
| 242 | `<button>` | `none` | `implicit` | `none` | `text-sm` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 560 | `<button>` | `rounded-full` | `implicit` | `py-4` | `text-base font-medium` | `primary-dark` | `profile-inline` | `native-button-inline` |  |
| 652 | `<button>` | `rounded-full` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |

components/profile/groups/RecipeCardGrid.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 51 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 58 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 124 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 133 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |

components/profile/groups/RedesignedGroupsSection.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 359 | `<Button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `shadcn-Button` |  |
| 417 | `<button>` | `none` | `implicit` | `none` | `text-sm font-medium` | `ghost` | `profile-inline` | `native-button-inline` |  |

components/profile/groups/RemoveRecipeFromGroupModal.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 52 | `<Button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `shadcn-Button` |  |
| 59 | `<Button>` | `none` | `implicit` | `none` | `none` | `primary-dark` | `modal` | `shadcn-Button` |  |

components/profile/groups/ReviewRecipesModal.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 172 | `<button>` | `rounded-full` | `implicit` | `none` | `none` | `ghost` | `modal` | `native-button-inline` |  |
| 185 | `<button>` | `rounded-full` | `implicit` | `none` | `none` | `ghost` | `modal` | `native-button-inline` |  |
| 196 | `<Button>` | `rounded-full` | `implicit` | `none` | `none` | `primary-dark` | `modal` | `shadcn-Button` |  |

components/profile/groups/review/PrintDetailsSidebar.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 89 | `<div>` | `none` | `implicit` | `none` | `none` | `primary-dark` | `profile-inline` | `div-role-button` |  |
| 106 | `<button>` | `rounded-full` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 131 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 137 | `<button>` | `none` | `implicit` | `none` | `text-xs font-medium` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 151 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 175 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 182 | `<button>` | `none` | `implicit` | `none` | `text-xs` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 191 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |

components/profile/groups/review/PrintDetailsWizard.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 94 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 130 | `<button>` | `rounded-full` | `implicit` | `py-4` | `text-base font-medium` | `primary-dark` | `profile-inline` | `native-button-inline` |  |
| 159 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 166 | `<button>` | `none` | `implicit` | `none` | `text-sm` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 176 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 208 | `<button>` | `rounded-full` | `implicit` | `py-4` | `text-base font-medium` | `primary-dark` | `profile-inline` | `native-button-inline` |  |
| 217 | `<button>` | `none` | `implicit` | `none` | `text-sm` | `ghost` | `profile-inline` | `native-button-inline` |  |

components/profile/groups/review/ReviewRecipeCard.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 77 | `<button>` | `none` | `implicit` | `none` | `text-xs` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 86 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 93 | `<button>` | `none` | `implicit` | `none` | `text-xs font-medium` | `ghost` | `profile-inline` | `native-button-inline` |  |

components/profile/groups/review/ReviewRecipeSidebar.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 29 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |

components/profile/groups/review/ReviewRecipesPage.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 115 | `<button>` | `rounded-full` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 133 | `<button>` | `rounded-full` | `implicit` | `none` | `none` | `other` | `profile-inline` | `native-button-inline` | no explicit color-role rule match; color-rule fallback |
| 144 | `<button>` | `rounded-full` | `implicit` | `none` | `none` | `other` | `profile-inline` | `native-button-inline` | no explicit color-role rule match; color-rule fallback |
| 159 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 167 | `<Button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `shadcn-Button` |  |

components/profile/guests/AddGuestModal.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 197 | `<Button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `shadcn-Button` |  |
| 204 | `<Button>` | `none` | `implicit` | `none` | `none` | `primary-dark` | `modal` | `shadcn-Button` |  |

components/profile/guests/DeleteGuestModal.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 36 | `<Button>` | `none` | `implicit` | `none` | `none` | `primary-dark` | `modal` | `shadcn-Button` |  |
| 43 | `<Button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `shadcn-Button` |  |

components/profile/guests/EditRecipeModal.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 154 | `<Button>` | `rounded-full` | `implicit` | `px-4 py-2` | `none` | `ghost` | `modal` | `shadcn-Button` |  |
| 161 | `<Button>` | `rounded-full` | `implicit` | `px-6 py-2` | `none` | `primary-dark` | `modal` | `shadcn-Button` |  |

components/profile/guests/GuestDetailsModal.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 297 | `<Button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `shadcn-Button` |  |
| 305 | `<Button>` | `none` | `h-8` | `px-3` | `text-xs` | `destructive` | `modal` | `shadcn-Button` |  |
| 322 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `native-button-inline` |  |
| 335 | `<Button>` | `none` | `implicit` | `none` | `none` | `other` | `modal` | `shadcn-Button` | no explicit color-role rule match; color-rule fallback |
| 344 | `<Button>` | `none` | `implicit` | `none` | `none` | `other` | `modal` | `shadcn-Button` | no explicit color-role rule match; color-rule fallback |
| 352 | `<Button>` | `none` | `implicit` | `none` | `none` | `other` | `modal` | `shadcn-Button` | no explicit color-role rule match; color-rule fallback |

components/profile/guests/GuestNavigationSheet.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 227 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 256 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 270 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |

components/profile/guests/GuestTable.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 214 | `<Button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `shadcn-Button` |  |
| 403 | `<Button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `shadcn-Button` |  |
| 415 | `<Button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `shadcn-Button` |  |

components/profile/guests/GuestTableColumns.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 190 | `<Button>` | `none` | `h-12` | `none` | `none` | `ghost` | `profile-inline` | `shadcn-Button` | composed |
| 205 | `<Button>` | `none` | `implicit` | `px-3 py-1` | `text-sm font-medium` | `ghost` | `profile-inline` | `shadcn-Button` |  |
| 221 | `<Button>` | `none` | `h-12` | `none` | `none` | `ghost` | `profile-inline` | `shadcn-Button` |  |
| 242 | `<button>` | `none` | `implicit` | `px-3 py-2` | `text-sm` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 291 | `<Button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `shadcn-Button` |  |

components/profile/guests/GuestTableControls.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 54 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 64 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 74 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 107 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 118 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 126 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 134 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |

components/profile/guests/ImportGuestsModal.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 285 | `<div>` | `none` | `implicit` | `none` | `none` | `primary-dark` | `modal` | `div-role-button` |  |
| 293 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `native-button-inline` |  |
| 316 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `native-button-inline` |  |
| 325 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `native-button-inline` |  |
| 352 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `native-button-inline` |  |
| 433 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `native-button-inline` |  |
| 536 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `native-button-inline` |  |
| 545 | `<button>` | `rounded-lg` | `implicit` | `px-4 py-2` | `text-xs font-medium` | `primary-honey` | `modal` | `native-button-inline` |  |

components/profile/guests/MobileGuestCard.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 147 | `<div>` | `rounded-lg` | `implicit` | `none` | `none` | `outline` | `profile-inline` | `div-role-button` |  |
| 193 | `<Button>` | `none` | `implicit` | `none` | `text-xs` | `ghost` | `profile-inline` | `shadcn-Button` | composed |
| 210 | `<Button>` | `none` | `implicit` | `none` | `text-xs` | `ghost` | `profile-inline` | `shadcn-Button` |  |
| 228 | `<Button>` | `none` | `h-8` | `none` | `none` | `ghost` | `profile-inline` | `shadcn-Button` |  |
| 244 | `<button>` | `none` | `implicit` | `px-3 py-2` | `text-sm` | `ghost` | `profile-inline` | `native-button-inline` |  |

components/profile/guests/RecipeCollectorButton.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 42 | `<Button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `shadcn-Button` |  |

components/profile/guests/RecipeCollectorLink.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 99 | `<Button>` | `none` | `implicit` | `py-3` | `text-sm font-medium` | `primary-dark` | `profile-inline` | `shadcn-Button` |  |
| 133 | `<Button>` | `none` | `h-8` | `px-3 py-2` | `text-sm font-medium` | `primary-dark` | `profile-inline` | `shadcn-Button` |  |

components/profile/guests/SendInvitationsPage.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 315 | `<button>` | `none` | `implicit` | `none` | `text-base font-medium` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 330 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 345 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 357 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 378 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 488 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 503 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 515 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 530 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 540 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 686 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 810 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 845 | `<button>` | `rounded-full` | `implicit` | `py-3` | `text-sm font-medium` | `other` | `profile-inline` | `native-button-inline` | no explicit color-role rule match; color-rule fallback |
| 851 | `<button>` | `rounded-full` | `implicit` | `py-3` | `text-sm font-medium` | `primary-honey` | `profile-inline` | `native-button-inline` |  |
| 868 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 877 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 899 | `<button>` | `rounded-full` | `implicit` | `py-3.5` | `font-medium` | `primary-honey` | `profile-inline` | `native-button-inline` |  |

components/profile/guests/SendMessageModal.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 111 | `<Button>` | `rounded-full` | `implicit` | `px-6 py-2` | `none` | `primary-dark` | `modal` | `shadcn-Button` |  |

components/profile/guests/ShareCollectionModal.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 443 | `<Button>` | `rounded-xl` | `implicit` | `none` | `none` | `other` | `modal` | `shadcn-Button` | composed; no explicit color-role rule match; color-rule fallback |
| 466 | `<button>` | `none` | `implicit` | `none` | `text-sm` | `ghost` | `modal` | `native-button-inline` |  |
| 477 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `native-button-inline` |  |
| 506 | `<Button>` | `rounded-xl` | `implicit` | `none` | `none` | `other` | `modal` | `shadcn-Button` | composed; no explicit color-role rule match; color-rule fallback |
| 529 | `<button>` | `none` | `implicit` | `none` | `text-sm` | `ghost` | `modal` | `native-button-inline` |  |
| 587 | `<Button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `shadcn-Button` |  |
| 595 | `<Button>` | `none` | `implicit` | `none` | `none` | `primary-dark` | `modal` | `shadcn-Button` |  |
| 622 | `<Button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `shadcn-Button` |  |
| 637 | `<Button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `shadcn-Button` |  |
| 651 | `<Button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `shadcn-Button` |  |
| 671 | `<div>` | `rounded-xl` | `implicit` | `none` | `none` | `other` | `modal` | `div-role-button` | no explicit color-role rule match; color-rule fallback |
| 736 | `<Button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `shadcn-Button` |  |
| 744 | `<Button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `shadcn-Button` |  |
| 752 | `<Button>` | `none` | `implicit` | `none` | `none` | `primary-dark` | `modal` | `shadcn-Button` |  |
| 766 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `native-button-inline` |  |

components/profile/orders/AddressForm.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 335 | `<Button>` | `none` | `implicit` | `none` | `none` | `primary-dark` | `profile-inline` | `shadcn-Button` |  |
| 352 | `<Button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `shadcn-Button` |  |

components/profile/orders/AddressManagement.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 176 | `<Button>` | `none` | `implicit` | `none` | `none` | `primary-dark` | `profile-inline` | `shadcn-Button` |  |
| 246 | `<Button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `shadcn-Button` |  |
| 264 | `<Button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `shadcn-Button` |  |
| 275 | `<Button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `shadcn-Button` |  |
| 302 | `<Button>` | `none` | `implicit` | `none` | `none` | `primary-dark` | `profile-inline` | `shadcn-Button` |  |

components/profile/orders/OrderHistory.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 78 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 139 | `<button>` | `rounded-md` | `implicit` | `px-4 py-2` | `text-sm font-medium` | `primary-dark` | `profile-inline` | `native-button-inline` |  |
| 142 | `<button>` | `rounded-md` | `implicit` | `px-4 py-2` | `text-sm font-medium` | `other` | `profile-inline` | `native-button-inline` | no explicit color-role rule match; color-rule fallback |
| 165 | `<button>` | `rounded-md` | `implicit` | `px-4 py-2` | `text-sm font-medium` | `primary-dark` | `profile-inline` | `native-button-inline` |  |

components/profile/recipes/AddRecipeModal.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 467 | `<Button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `shadcn-Button` |  |
| 480 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `native-button-inline` |  |
| 497 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `native-button-inline` |  |
| 514 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `native-button-inline` |  |
| 564 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `native-button-inline` |  |
| 579 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `native-button-inline` |  |
| 715 | `<Button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `shadcn-Button` |  |
| 728 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `native-button-inline` |  |
| 745 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `native-button-inline` |  |
| 762 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `native-button-inline` |  |
| 812 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `native-button-inline` |  |
| 827 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `native-button-inline` |  |
| 947 | `<Button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `shadcn-Button` |  |
| 954 | `<Button>` | `none` | `implicit` | `none` | `none` | `primary-dark` | `modal` | `shadcn-Button` |  |
| 992 | `<Button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `shadcn-Button` |  |
| 999 | `<Button>` | `none` | `implicit` | `none` | `none` | `primary-dark` | `modal` | `shadcn-Button` |  |

components/profile/recipes/BulkActionsBar.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 38 | `<button>` | `none` | `implicit` | `none` | `text-sm` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 48 | `<Button>` | `none` | `implicit` | `none` | `text-sm` | `ghost` | `profile-inline` | `shadcn-Button` |  |
| 58 | `<Button>` | `none` | `implicit` | `none` | `text-sm` | `ghost` | `profile-inline` | `shadcn-Button` |  |

components/profile/recipes/BulkAddToCookbookModal.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 207 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `native-button-inline` |  |
| 224 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `native-button-inline` |  |
| 273 | `<Button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `shadcn-Button` |  |
| 280 | `<Button>` | `none` | `implicit` | `none` | `none` | `primary-dark` | `modal` | `shadcn-Button` |  |

components/profile/recipes/DeleteRecipeModal.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 36 | `<Button>` | `none` | `implicit` | `none` | `none` | `primary-dark` | `modal` | `shadcn-Button` |  |
| 43 | `<Button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `shadcn-Button` |  |

components/profile/recipes/MobileRecipeCard.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 88 | `<div>` | `rounded-lg` | `implicit` | `none` | `none` | `outline` | `profile-inline` | `div-role-button` |  |
| 126 | `<div>` | `none` | `implicit` | `none` | `none` | `other` | `profile-inline` | `div-role-button` | no explicit color-role rule match; color-rule fallback |
| 129 | `<Button>` | `none` | `h-8` | `none` | `none` | `ghost` | `profile-inline` | `shadcn-Button` |  |
| 146 | `<button>` | `none` | `implicit` | `px-3 py-2` | `text-sm` | `ghost` | `profile-inline` | `native-button-inline` |  |

components/profile/recipes/RecipeDetailsModal.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 273 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `native-button-inline` |  |
| 362 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `native-button-inline` |  |
| 588 | `<Button>` | `rounded-full` | `implicit` | `py-3` | `none` | `primary-dark` | `modal` | `shadcn-Button` |  |
| 595 | `<Button>` | `rounded-full` | `implicit` | `py-3` | `none` | `other` | `modal` | `shadcn-Button` | no explicit color-role rule match; color-rule fallback |
| 626 | `<Button>` | `rounded-full` | `implicit` | `none` | `none` | `other` | `modal` | `shadcn-Button` | no explicit color-role rule match; color-rule fallback |
| 634 | `<Button>` | `rounded-full` | `implicit` | `none` | `none` | `primary-dark` | `modal` | `shadcn-Button` |  |

components/profile/recipes/RecipeImageUpload.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 149 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 192 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 227 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |

components/profile/recipes/RecipeTable.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 196 | `<Button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `shadcn-Button` |  |
| 368 | `<Button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `shadcn-Button` |  |
| 380 | `<Button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `shadcn-Button` |  |

components/profile/recipes/RecipeTableColumns.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 166 | `<Button>` | `none` | `implicit` | `px-3 py-1` | `text-sm font-medium` | `ghost` | `profile-inline` | `shadcn-Button` |  |
| 188 | `<Button>` | `none` | `h-10` | `none` | `none` | `ghost` | `profile-inline` | `shadcn-Button` |  |
| 210 | `<button>` | `none` | `implicit` | `px-3 py-2` | `text-sm` | `ghost` | `profile-inline` | `native-button-inline` |  |

components/profile/recipes/RecipeTableControls.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 57 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 67 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 77 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 87 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 119 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 130 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 138 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 146 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |
| 154 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `profile-inline` | `native-button-inline` |  |

components/recipe-journey/RecipeJourneyWrapper.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 668 | `<button>` | `rounded-full` | `implicit` | `px-5 py-3` | `none` | `other` | `icon-only` | `native-button-inline` | no explicit color-role rule match; color-rule fallback |
| 680 | `<button>` | `rounded-full` | `implicit` | `px-4 py-2.5` | `text-sm` | `primary-honey` | `icon-only` | `native-button-inline` |  |
| 688 | `<button>` | `rounded-full` | `implicit` | `px-4 py-2.5` | `text-sm` | `other` | `icon-only` | `native-button-inline` | no explicit color-role rule match; color-rule fallback |
| 698 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `other` | `native-button-inline` |  |
| 733 | `<button>` | `rounded-full` | `implicit` | `px-8 py-3` | `none` | `primary-honey` | `icon-only` | `native-button-inline` |  |

components/recipe-journey/RecipeTipsModal.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 84 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `native-button-inline` |  |
| 117 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `modal` | `native-button-inline` |  |
| 202 | `<button>` | `rounded-xl` | `implicit` | `none` | `none` | `other` | `modal` | `native-button-inline` | no explicit color-role rule match; color-rule fallback |

components/recipe-journey/steps/ImageUploadStep.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 149 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `other` | `native-button-inline` |  |
| 170 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `other` | `native-button-inline` |  |
| 188 | `<button>` | `rounded-2xl` | `implicit` | `none` | `none` | `other` | `icon-only` | `native-button-inline` | no explicit color-role rule match; color-rule fallback |
| 233 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `other` | `native-button-inline` |  |
| 268 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `other` | `native-button-inline` |  |

components/recipe-journey/steps/RecipeFormStep.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 46 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `form` | `native-button-inline` |  |
| 104 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `form` | `native-button-inline` |  |
| 110 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `form` | `native-button-inline` |  |

components/recipe-journey/steps/RecipeTypeStep.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 76 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `other` | `native-button-inline` |  |

components/recipe-journey/steps/SuccessStep.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 121 | `<button>` | `rounded-full` | `implicit` | `px-3 py-2` | `text-sm` | `other` | `icon-only` | `native-button-inline` | no explicit color-role rule match; color-rule fallback |

components/recipe-journey/steps/SummaryStep.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 22 | `<button>` | `rounded-lg` | `implicit` | `px-4 py-2` | `text-sm` | `other` | `other` | `native-button-inline` | no explicit color-role rule match; color-rule fallback |

components/recipe-journey/steps/UploadMethodStep.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 49 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `other` | `native-button-inline` |  |

components/recipe-journey/steps/WelcomeStep.tsx
| Line | Element | Shape | Size | Padding | Text | Color role | Context | Impl | Comment |
|---:|---|---|---|---|---|---|---|---|---|
| 44 | `<button>` | `none` | `implicit` | `none` | `none` | `ghost` | `other` | `native-button-inline` |  |

#### Section 3 — Signature clusters

Cluster 1 — [242 members]
Signature: none | implicit | none | none | ghost
Contexts present: modal (70), other (19), icon-only (3), profile-inline (116), profile-primary (4), form (7), landing-inline (7), onboarding (16)
Impls present: native-button-inline (179), btn-primary (1), btn-secondary (3), shadcn-Button (59)
Member files (up to 10 examples):
- `app/(admin)/admin/books/components/CreateCompedBookDialog.tsx:120`
- `app/(admin)/admin/books/components/CreateCompedBookDialog.tsx:130`
- `app/(admin)/admin/books/components/CreateCompedBookDialog.tsx:193`
- `app/(auth)/activate/[token]/page.tsx:157`
- `app/(auth)/activate/[token]/page.tsx:224`
- `app/(auth)/activate/[token]/page.tsx:354`
- `app/(auth)/onboarding/page.tsx:199`
- `app/(auth)/onboarding/page.tsx:310`
- `app/(auth)/reset-password/page.tsx:312`
- `app/(auth)/reset-password/page.tsx:357`

Cluster 2 — [24 members]
Signature: none | implicit | none | none | primary-dark
Contexts present: profile-inline (9), modal (15)
Impls present: div-role-button (7), shadcn-Button (17)
Member files (up to 10 examples):
- `app/(platform)/profile/groups/page.tsx:701`
- `app/(platform)/profile/groups/page.tsx:763`
- `app/(platform)/profile/recipes/page.tsx:276`
- `components/auth/LoginModal.tsx:93`
- `components/landing/BookDetailsModal.tsx:51`
- `components/landing/RecipeModal.tsx:47`
- `components/profile/EmptyStateBanner.tsx:33`
- `components/profile/FirstRecipeModal.tsx:143`
- `components/profile/account/PersonalInfoForm.tsx:202`
- `components/profile/groups/AddFriendToGroupModal.tsx:239`

Cluster 3 — [13 members]
Signature: none | implicit | px-3 py-2 | text-sm | ghost
Contexts present: profile-inline (13)
Impls present: native-button-inline (13)
Member files (up to 10 examples):
- `components/profile/OnboardingResume.tsx:55`
- `components/profile/cookbook/CookbookActionsDropdown.tsx:117`
- `components/profile/cookbook/CookbookActionsDropdown.tsx:128`
- `components/profile/cookbook/CookbookMembersDropdown.tsx:440`
- `components/profile/cookbook/CookbookMembersDropdown.tsx:452`
- `components/profile/cookbook/CookbookTableColumns.tsx:155`
- `components/profile/cookbook/MobileCookbookCard.tsx:174`
- `components/profile/groups/GroupActionsDropdown.tsx:120`
- `components/profile/groups/GroupActionsDropdown.tsx:131`
- `components/profile/guests/GuestTableColumns.tsx:242`

Cluster 4 — [11 members]
Signature: none | implicit | none | text-sm | ghost
Contexts present: icon-only (1), profile-inline (8), modal (2)
Impls present: native-button-inline (9), shadcn-Button (2)
Member files (up to 10 examples):
- `components/pricing/PricingPage.tsx:170`
- `components/profile/groups/ExtraCopyPurchase.tsx:127`
- `components/profile/groups/ExtraCopyPurchase.tsx:381`
- `components/profile/groups/PostCloseFlow.tsx:242`
- `components/profile/groups/review/PrintDetailsWizard.tsx:166`
- `components/profile/groups/review/PrintDetailsWizard.tsx:217`
- `components/profile/guests/ShareCollectionModal.tsx:466`
- `components/profile/guests/ShareCollectionModal.tsx:529`
- `components/profile/recipes/BulkActionsBar.tsx:38`
- `components/profile/recipes/BulkActionsBar.tsx:48`

Cluster 5 — [9 members]
Signature: none | implicit | px-4 py-2 | text-sm | ghost
Contexts present: profile-inline (9)
Impls present: native-button-inline (9)
Member files (up to 10 examples):
- `components/profile/ProfileDropdown.tsx:69`
- `components/profile/ProfileDropdown.tsx:79`
- `components/profile/ProfileDropdown.tsx:89`
- `components/profile/ProfileDropdown.tsx:99`
- `components/profile/ProfileDropdown.tsx:109`
- `components/profile/ProfileDropdown.tsx:119`
- `components/profile/ProfileDropdown.tsx:129`
- `components/profile/ProfileDropdown.tsx:139`
- `components/profile/ProfileDropdown.tsx:150`

Cluster 6 — [8 members]
Signature: none | implicit | none | none | other
Contexts present: profile-inline (4), modal (4)
Impls present: shadcn-Button (6), div-role-button (2)
Member files (up to 10 examples):
- `components/profile/account/EmailChangeForm.tsx:170`
- `components/profile/account/PasswordChangeForm.tsx:269`
- `components/profile/cookbook/MobileCookbookCard.tsx:137`
- `components/profile/groups/AddFriendToGroupModal.tsx:199`
- `components/profile/guests/GuestDetailsModal.tsx:335`
- `components/profile/guests/GuestDetailsModal.tsx:344`
- `components/profile/guests/GuestDetailsModal.tsx:352`
- `components/profile/recipes/MobileRecipeCard.tsx:126`

Cluster 7 — [8 members]
Signature: rounded-full | implicit | py-4 | text-base font-medium | primary-dark
Contexts present: icon-only (2), profile-inline (6)
Impls present: native-button-inline (8)
Member files (up to 10 examples):
- `app/copy/[bookId]/CopyOrderClient.tsx:327`
- `app/copy/[bookId]/CopyOrderClient.tsx:495`
- `components/profile/groups/ExtraCopyPurchase.tsx:120`
- `components/profile/groups/ExtraCopyPurchase.tsx:373`
- `components/profile/groups/PostCloseFlow.tsx:231`
- `components/profile/groups/PostCloseFlow.tsx:560`
- `components/profile/groups/review/PrintDetailsWizard.tsx:130`
- `components/profile/groups/review/PrintDetailsWizard.tsx:208`

Cluster 8 — [7 members]
Signature: rounded-full | implicit | none | none | ghost
Contexts present: icon-only (1), onboarding (1), profile-inline (3), modal (2)
Impls present: shadcn-Button (1), native-button-inline (6)
Member files (up to 10 examples):
- `app/(public)/collect/[token]/review/page.tsx:200`
- `components/onboarding/DatePickerStep.tsx:229`
- `components/profile/groups/PostCloseFlow.tsx:652`
- `components/profile/groups/ReviewRecipesModal.tsx:172`
- `components/profile/groups/ReviewRecipesModal.tsx:185`
- `components/profile/groups/review/PrintDetailsSidebar.tsx:106`
- `components/profile/groups/review/ReviewRecipesPage.tsx:115`

Cluster 9 — [6 members]
Signature: none | h-8 | none | none | ghost
Contexts present: profile-inline (6)
Impls present: shadcn-Button (6)
Member files (up to 10 examples):
- `app/(platform)/profile/cookbook/page.tsx:272`
- `components/profile/cookbook/CookbookActionsDropdown.tsx:94`
- `components/profile/cookbook/MobileCookbookCard.tsx:157`
- `components/profile/groups/GroupActionsDropdown.tsx:97`
- `components/profile/guests/MobileGuestCard.tsx:228`
- `components/profile/recipes/MobileRecipeCard.tsx:129`

Cluster 10 — [6 members]
Signature: rounded-lg | implicit | none | none | ghost
Contexts present: profile-inline (3), icon-only (3)
Impls present: shadcn-Button (6)
Member files (up to 10 examples):
- `app/(platform)/profile/how-it-works/page.tsx:280`
- `app/(platform)/profile/how-it-works/page.tsx:284`
- `app/(platform)/profile/how-it-works/page.tsx:288`
- `app/(public)/how-it-works/page.tsx:298`
- `app/(public)/how-it-works/page.tsx:302`
- `app/(public)/how-it-works/page.tsx:306`

Cluster 11 — [5 members]
Signature: rounded-full | h-10 | px-4 py-2 | none | ghost
Contexts present: form (3), icon-only (2)
Impls present: shadcn-Button (5)
Member files (up to 10 examples):
- `app/(public)/collect/[token]/CollectionForm.tsx:472`
- `app/(public)/collect/[token]/CollectionForm.tsx:512`
- `app/(public)/collect/[token]/CollectionForm.tsx:600`
- `app/(public)/preview-recipe-journey/page.tsx:219`
- `app/(public)/preview-recipe-journey/page.tsx:266`

Cluster 12 — [5 members]
Signature: rounded-full | implicit | py-3 | none | primary-dark
Contexts present: modal (5)
Impls present: shadcn-Button (5)
Member files (up to 10 examples):
- `components/profile/CustomizeCollectorModal.tsx:274`
- `components/profile/cookbook/AddNoteModal.tsx:159`
- `components/profile/cookbook/AddNoteModal.tsx:188`
- `components/profile/groups/CreateGroupModal.tsx:168`
- `components/profile/recipes/RecipeDetailsModal.tsx:588`

Cluster 13 — [4 members]
Signature: none | implicit | none | text-xs | ghost
Contexts present: profile-inline (4)
Impls present: native-button-inline (2), shadcn-Button (2)
Member files (up to 10 examples):
- `components/profile/groups/review/PrintDetailsSidebar.tsx:182`
- `components/profile/groups/review/ReviewRecipeCard.tsx:77`
- `components/profile/guests/MobileGuestCard.tsx:193`
- `components/profile/guests/MobileGuestCard.tsx:210`

Cluster 14 — [4 members]
Signature: rounded-full | implicit | none | none | other
Contexts present: modal (2), profile-inline (2)
Impls present: native-button-inline (3), shadcn-Button (1)
Member files (up to 10 examples):
- `components/landing/RecipeModal.tsx:56`
- `components/profile/groups/review/ReviewRecipesPage.tsx:133`
- `components/profile/groups/review/ReviewRecipesPage.tsx:144`
- `components/profile/recipes/RecipeDetailsModal.tsx:626`

Cluster 15 — [4 members]
Signature: rounded-full | implicit | px-8 py-4 | text-lg font-medium | primary-honey
Contexts present: landing-cta (4)
Impls present: native-button-inline (4)
Member files (up to 10 examples):
- `components/landing/BooksPrinted.tsx:225`
- `components/landing/Hero.tsx:73`
- `components/landing/TheBook.tsx:227`
- `components/landing/TheSolution.tsx:94`

Cluster 16 — [4 members]
Signature: rounded-lg | implicit | px-8 py-6 | text-lg font-medium | primary-dark
Contexts present: profile-inline (2), icon-only (2)
Impls present: shadcn-Button (4)
Member files (up to 10 examples):
- `app/(platform)/profile/how-it-works/page.tsx:242`
- `app/(platform)/profile/how-it-works/page.tsx:347`
- `app/(public)/how-it-works/page.tsx:263`
- `app/(public)/how-it-works/page.tsx:359`

Cluster 17 — [4 members]
Signature: rounded-xl | implicit | none | none | other
Contexts present: modal (4)
Impls present: shadcn-Button (2), div-role-button (1), native-button-inline (1)
Member files (up to 10 examples):
- `components/profile/guests/ShareCollectionModal.tsx:443`
- `components/profile/guests/ShareCollectionModal.tsx:506`
- `components/profile/guests/ShareCollectionModal.tsx:671`
- `components/recipe-journey/RecipeTipsModal.tsx:202`

Cluster 18 — [3 members]
Signature: rounded-2xl | implicit | none | none | other
Contexts present: modal (1), landing-inline (1), icon-only (1)
Impls present: div-role-button (2), native-button-inline (1)
Member files (up to 10 examples):
- `components/auth/LoginModal.tsx:97`
- `components/landing/BooksPrinted.tsx:251`
- `components/recipe-journey/steps/ImageUploadStep.tsx:188`

Cluster 19 — [3 members]
Signature: rounded-full | implicit | px-6 py-2 | none | primary-dark
Contexts present: modal (3)
Impls present: shadcn-Button (3)
Member files (up to 10 examples):
- `components/profile/CustomizeCollectorModal.tsx:303`
- `components/profile/guests/EditRecipeModal.tsx:161`
- `components/profile/guests/SendMessageModal.tsx:111`

Cluster 20 — [3 members]
Signature: rounded-lg | implicit | none | none | outline
Contexts present: profile-inline (3)
Impls present: div-role-button (3)
Member files (up to 10 examples):
- `components/profile/cookbook/MobileCookbookCard.tsx:87`
- `components/profile/guests/MobileGuestCard.tsx:147`
- `components/profile/recipes/MobileRecipeCard.tsx:88`

Cluster 21 — [2 members]
Signature: none | h-10 | none | none | ghost
Contexts present: profile-inline (2)
Impls present: shadcn-Button (2)
Member files (up to 10 examples):
- `components/profile/cookbook/CookbookTableColumns.tsx:133`
- `components/profile/recipes/RecipeTableColumns.tsx:188`

Cluster 22 — [2 members]
Signature: none | h-12 | none | none | ghost
Contexts present: profile-inline (2)
Impls present: shadcn-Button (2)
Member files (up to 10 examples):
- `components/profile/guests/GuestTableColumns.tsx:190`
- `components/profile/guests/GuestTableColumns.tsx:221`

Cluster 23 — [2 members]
Signature: none | implicit | none | none | primary-honey
Contexts present: icon-only (2)
Impls present: shadcn-Button (2)
Member files (up to 10 examples):
- `app/(public)/collect/[token]/review/page.tsx:177`
- `app/(public)/collect/[token]/review/page.tsx:303`

Cluster 24 — [2 members]
Signature: none | implicit | none | text-sm font-medium | ghost
Contexts present: modal (1), profile-inline (1)
Impls present: native-button-inline (2)
Member files (up to 10 examples):
- `components/profile/CustomizeCollectorModal.tsx:92`
- `components/profile/groups/RedesignedGroupsSection.tsx:417`

Cluster 25 — [2 members]
Signature: none | implicit | none | text-sm | other
Contexts present: onboarding (2)
Impls present: native-button-inline (2)
Member files (up to 10 examples):
- `components/onboarding/FirstRecipeExperience.tsx:66`
- `components/onboarding/OnboardingCards.tsx:104`

Cluster 26 — [2 members]
Signature: none | implicit | none | text-xs font-medium | ghost
Contexts present: profile-inline (2)
Impls present: native-button-inline (2)
Member files (up to 10 examples):
- `components/profile/groups/review/PrintDetailsSidebar.tsx:137`
- `components/profile/groups/review/ReviewRecipeCard.tsx:93`

Cluster 27 — [2 members]
Signature: none | implicit | px-3 py-1 | text-sm font-medium | ghost
Contexts present: profile-inline (2)
Impls present: shadcn-Button (2)
Member files (up to 10 examples):
- `components/profile/guests/GuestTableColumns.tsx:205`
- `components/profile/recipes/RecipeTableColumns.tsx:166`

Cluster 28 — [2 members]
Signature: none | implicit | px-6 py-3 | font-medium | ghost
Contexts present: icon-only (2)
Impls present: native-button-inline (2)
Member files (up to 10 examples):
- `app/(auth)/onboarding/page.tsx:43`
- `app/(auth)/onboarding/page.tsx:281`

Cluster 29 — [2 members]
Signature: rounded-full | implicit | none | none | primary-dark
Contexts present: modal (2)
Impls present: shadcn-Button (2)
Member files (up to 10 examples):
- `components/profile/groups/ReviewRecipesModal.tsx:196`
- `components/profile/recipes/RecipeDetailsModal.tsx:634`

Cluster 30 — [2 members]
Signature: rounded-full | implicit | px-10 py-4 | text-lg font-medium | primary-honey
Contexts present: landing-cta (1), icon-only (1)
Impls present: native-button-inline (2)
Member files (up to 10 examples):
- `components/landing/EmotionalClose.tsx:121`
- `components/pricing/PricingPage.tsx:163`

Cluster 31 — [2 members]
Signature: rounded-full | implicit | px-5 py-3 | font-semibold | other
Contexts present: profile-inline (2)
Impls present: native-button-inline (2)
Member files (up to 10 examples):
- `components/profile/ProfileHeader.tsx:101`
- `components/profile/ProfileHeader.tsx:111`

Cluster 32 — [2 members]
Signature: rounded-full | implicit | py-3 | font-medium | primary-dark
Contexts present: modal (2)
Impls present: native-button-inline (2)
Member files (up to 10 examples):
- `components/profile/groups/CloseBookModal.tsx:57`
- `components/profile/groups/CloseBookModal.tsx:64`

Cluster 33 — [2 members]
Signature: rounded-md | implicit | px-4 py-2 | text-sm font-medium | primary-dark
Contexts present: profile-inline (2)
Impls present: native-button-inline (2)
Member files (up to 10 examples):
- `components/profile/orders/OrderHistory.tsx:139`
- `components/profile/orders/OrderHistory.tsx:165`

Cluster 34 — [2 members]
Signature: rounded-xl | implicit | none | font-medium | primary-honey
Contexts present: icon-only (1), modal (1)
Impls present: native-button-inline (2)
Member files (up to 10 examples):
- `app/welcome/page.tsx:216`
- `components/profile/groups/CoupleNamesModal.tsx:341`

Cluster 35 — [2 members]
Signature: rounded-xl | implicit | py-3 | font-semibold | ghost
Contexts present: icon-only (2)
Impls present: native-button-inline (2)
Member files (up to 10 examples):
- `app/(auth)/activate/[token]/page.tsx:332`
- `app/(auth)/reset-password/page.tsx:449`

Singleton clusters (1 member each): 57 total
- `none | h-8 | px-2 | none | ghost` → `components/profile/cookbook/CookbookTableColumns.tsx:390`
- `none | h-8 | px-3 py-2 | text-sm font-medium | primary-dark` → `components/profile/guests/RecipeCollectorLink.tsx:133`
- `none | h-8 | px-3 | text-xs | destructive` → `components/profile/guests/GuestDetailsModal.tsx:305`
- `none | implicit | none | font-medium | ghost` → `components/profile/groups/BookPreviewPanel.tsx:63`
- `none | implicit | none | none | destructive` → `components/profile/account/DangerZone.tsx:197`
- `none | implicit | none | text-base font-medium | ghost` → `components/profile/guests/SendInvitationsPage.tsx:315`
- `none | implicit | none | text-sm font-light | ghost` → `components/onboarding/DatePickerStep.tsx:316`
- `none | implicit | px-6 py-2 | text-sm | other` → `components/profile/OnboardingResume.tsx:49`
- `none | implicit | px-8 py-4 | text-lg | primary-dark` → `components/onboarding/FirstRecipeExperience.tsx:87`
- `none | implicit | py-2 | none | ghost` → `app/welcome/page.tsx:226`
- `none | implicit | py-3 | none | primary-dark` → `components/onboarding/StepSuccess.tsx:70`
- `none | implicit | py-3 | text-sm font-medium | primary-dark` → `components/profile/guests/RecipeCollectorLink.tsx:99`
- `none | implicit | py-3 | text-sm font-semibold | primary-dark` → `components/groups/GroupJoinForm.tsx:434`
- `none | implicit | py-4 | text-lg | primary-dark` → `components/onboarding/FirstRecipeExperience.tsx:203`
- `rounded | implicit | px-2 py-1 | text-lg font-light | ghost` → `components/landing/Hero.tsx:83`
- `rounded-[10px | implicit | px-5 | none | other` → `components/onboarding/SetupChecklist.tsx:304`
- `rounded-full | h-10 | none | none | ghost` → `components/profile/ProfileHeader.tsx:78`
- `rounded-full | h-8 | none | none | ghost` → `components/onboarding/SetupChecklist.tsx:363`
- `rounded-full | implicit | px-10 py-3 | text-base font-medium | primary-dark` → `components/onboarding/WelcomeOverlay.tsx:54`
- `rounded-full | implicit | px-3 py-2 | text-sm | other` → `components/recipe-journey/steps/SuccessStep.tsx:121`
- `rounded-full | implicit | px-4 py-2 | none | ghost` → `components/profile/guests/EditRecipeModal.tsx:154`
- `rounded-full | implicit | px-4 py-2 | text-sm font-medium | other` → `components/profile/account/SetupGuidePreferences.tsx:34`
- `rounded-full | implicit | px-4 py-2 | text-xs font-medium | other` → `components/profile/groups/BookClosedStatus.tsx:26`
- `rounded-full | implicit | px-4 py-2.5 | text-sm | other` → `components/recipe-journey/RecipeJourneyWrapper.tsx:688`
- `rounded-full | implicit | px-4 py-2.5 | text-sm | primary-honey` → `components/recipe-journey/RecipeJourneyWrapper.tsx:680`
- `rounded-full | implicit | px-5 py-3 | font-semibold | primary-dark` → `components/profile/ProfileHeader.tsx:121`
- `rounded-full | implicit | px-5 py-3 | none | other` → `components/recipe-journey/RecipeJourneyWrapper.tsx:668`
- `rounded-full | implicit | px-6 py-3 | text-sm font-medium | other` → `components/onboarding/SetupChecklist.tsx:384`
- `rounded-full | implicit | px-8 py-3 | none | primary-honey` → `components/recipe-journey/RecipeJourneyWrapper.tsx:733`
- `rounded-full | implicit | px-8 py-3 | text-base font-semibold | primary-honey` → `components/landing/NewsletterSignup.tsx:112`
- `rounded-full | implicit | py-3 | font-medium | other` → `components/profile/groups/CloseBookModal.tsx:50`
- `rounded-full | implicit | py-3 | none | other` → `components/profile/recipes/RecipeDetailsModal.tsx:595`
- `rounded-full | implicit | py-3 | text-sm font-medium | other` → `components/profile/guests/SendInvitationsPage.tsx:845`
- `rounded-full | implicit | py-3 | text-sm font-medium | primary-dark` → `components/profile/groups/BookClosedStatus.tsx:627`
- `rounded-full | implicit | py-3 | text-sm font-medium | primary-honey` → `components/profile/guests/SendInvitationsPage.tsx:851`
- `rounded-full | implicit | py-3.5 | font-medium | primary-honey` → `components/profile/guests/SendInvitationsPage.tsx:899`
- `rounded-lg | h-12 | px-3 | text-base font-medium | outline` → `components/profile/groups/GroupMembersDropdown.tsx:192`
- `rounded-lg | implicit | px-12 py-6 | text-xl font-medium | other` → `app/(public)/how-it-works/page.tsx:546`
- `rounded-lg | implicit | px-12 py-6 | text-xl font-medium | primary-dark` → `app/(platform)/profile/how-it-works/page.tsx:586`
- `rounded-lg | implicit | px-3 py-1.5 | text-sm font-medium | primary-honey` → `app/(admin)/admin/books/components/CreateCompedBookDialog.tsx:88`
- `rounded-lg | implicit | px-4 py-2 | font-medium | ghost` → `components/profile/groups/BookClosedStatus.tsx:84`
- `rounded-lg | implicit | px-4 py-2 | none | other` → `components/auth/LoginModal.tsx:258`
- `rounded-lg | implicit | px-4 py-2 | text-sm | other` → `components/recipe-journey/steps/SummaryStep.tsx:22`
- `rounded-lg | implicit | px-4 py-2 | text-xs font-medium | primary-honey` → `components/profile/guests/ImportGuestsModal.tsx:545`
- `rounded-lg | implicit | px-8 py-3 | text-base font-medium | other` → `app/(platform)/profile/recipes/page.tsx:201`
- `rounded-lg | implicit | px-8 py-3 | text-base font-medium | primary-honey` → `app/(platform)/profile/cookbook/page.tsx:292`
- `rounded-lg | implicit | py-2.5 | text-sm font-medium | primary-honey` → `app/(admin)/admin/books/components/CreateCompedBookDialog.tsx:231`
- `rounded-lg | implicit | py-3 | font-semibold | primary-dark` → `components/auth/LoginModal.tsx:216`
- `rounded-md | implicit | px-4 py-2 | text-sm font-medium | other` → `components/profile/orders/OrderHistory.tsx:142`
- `rounded-md | implicit | px-4 py-2 | text-sm font-medium | outline` → `app/(public)/collect/[token]/recipe/page.tsx:146`
- `rounded-md | implicit | py-1 | none | outline` → `components/profile/cookbook/CookbookMembersDropdown.tsx:431`
- `rounded-sm | implicit | px-8 py-3 | font-semibold | ghost` → `app/(auth)/onboarding/page.tsx:46`
- `rounded-sm | implicit | px-8 py-3.5 | font-semibold | ghost` → `app/(auth)/onboarding/page.tsx:270`
- `rounded-xl | implicit | px-6 py-3 | font-medium | outline` → `components/landing/BookPreview/BookPreviewModal.tsx:63`
- `rounded-xl | implicit | px-6 py-3 | font-medium | primary-honey` → `components/landing/BookPreview/BookPreviewModal.tsx:69`
- `rounded-xl | implicit | px-8 py-3 | font-semibold | ghost` → `components/onboarding/DatePickerStep.tsx:351`
- `rounded-xl | implicit | py-3 | font-semibold | primary-dark` → `app/(auth)/reset-password/page.tsx:297`

#### Section 4 — Cross-cuts

**4.1 — By context**
| Context | Total buttons | Distinct signatures |
|---|---:|---:|
| `profile-inline` | 223 | 43 |
| `modal` | 125 | 25 |
| `icon-only` | 34 | 24 |
| `onboarding` | 28 | 12 |
| `other` | 20 | 2 |
| `form` | 11 | 3 |
| `landing-inline` | 10 | 4 |
| `landing-cta` | 5 | 2 |
| `profile-primary` | 4 | 1 |

**4.2 — By implementation**
| Impl | Count |
|---|---:|
| `native-button-inline` | 292 |
| `shadcn-Button` | 148 |
| `div-role-button` | 16 |
| `btn-secondary` | 3 |
| `btn-primary` | 1 |

**4.3 — By shape**
| Shape | Count |
|---|---:|
| `none` | 347 |
| `rounded-full` | 64 |
| `rounded-lg` | 25 |
| `rounded-xl` | 12 |
| `rounded-md` | 5 |
| `rounded-2xl` | 3 |
| `rounded-sm` | 2 |
| `rounded` | 1 |
| `rounded-[10px` | 1 |

#### Section 5 — Ambiguous / skipped
| Case | Reason |
|---|---|
| `components/profile/ProfileNavigation.tsx:81` | inside <nav>/<header> context — skipped per scope |
| `components/profile/ProfileNavigation.tsx:82` | inside <nav>/<header> context — skipped per scope |
| `components/profile/ProfileNavigation.tsx:83` | inside <nav>/<header> context — skipped per scope |
| `components/profile/ProfileNavigation.tsx:84` | inside <nav>/<header> context — skipped per scope |
| `components/profile/ProfileTabs.tsx:48` | inside <nav>/<header> context — skipped per scope |
| `components/profile/ProfileTabs.tsx:49` | inside <nav>/<header> context — skipped per scope |
| `components/profile/ProfileTabs.tsx:50` | inside <nav>/<header> context — skipped per scope |
| `components/profile/ProfileTabs.tsx:51` | inside <nav>/<header> context — skipped per scope |
| `components/profile/orders/OrderHistory.tsx:67` | inside <nav>/<header> context — skipped per scope |
| `components/profile/orders/OrderHistory.tsx:68` | inside <nav>/<header> context — skipped per scope |

#### Section 6 — Execution notes
- Native inline `<button>` implementations observed: 292.
- `<Button>` consumer occurrences observed: 148.
- Brand `.btn-*` usages observed: 4 (primary 1, secondary 3, tertiary 0).
- Multiple signatures include `rounded-full` with different size/padding/color combinations.
