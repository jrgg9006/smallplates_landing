# Report Templates — How to Report Back

*The user (Ricardo) will bring your report to another Claude instance (his strategic consultant in claude.ai) for interpretation. A structured report makes that interpretation fast. A free-form narrative report wastes a round-trip.*

*Follow the structure exactly. If a section doesn't apply, include it and write "none" — don't delete it. Ricardo's eye scans for the same headers every time.*

---

## The canonical report structure

Every report you produce follows this five-section format:

```
## 1. EXECUTIVE SUMMARY
## 2. WHAT I DID
## 3. DECISIONS I MADE
## 4. FLAGS — NEEDS FOUNDER ATTENTION
## 5. DIFFS
```

Nothing before section 1. Nothing after section 5. No preamble. No "hope this helps." No "let me know if you have questions." The report ends when section 5 ends.

---

## Section 1 — Executive Summary

Two to four sentences maximum. What was the task, what did you do, what's the most important thing Ricardo needs to know.

This section should be readable in ten seconds. If Ricardo reads only this section, he should know whether the work was straightforward or whether something requires his attention.

**Good example:**

> Audited four brand docs in `/brand-weddings/` for consistency with the canonical system. Compressed `tone-of-voice.md` from 2,100 words to 340. Archived three redundant docs. Two flags: one message in `messaging-framework.md` references the old enemy framing ("Tuesday after wedding" instead of "one-day problem") — I did not rewrite this because it appeared in copy already approved for live use. Recommend discussion with your consultant before editing.

**Bad example:**

> I worked on the brand docs! I looked at a bunch of things and tried to make them better. I think overall it went well but there were some tricky moments. Let me know what you think.

---

## Section 2 — What I Did

Bulleted. Concrete. Verbs. Past tense.

List every meaningful action taken, in the order taken. If something is trivial (fixed a typo), combine it into "minor cleanup" rather than listing. If something is significant (compressed a doc, archived a file, restructured a section), list it individually.

**Format:**

```
- Compressed `margot.md` from 4,500 words to 500. Archived full version at `/archive/margot-character-study.md`.
- Updated the `foundation.md` filter section to point to the single north-star question.
- Audited `messaging-framework.md` for banned vocabulary. Found three instances of "memories" and two of "special." Rewrote those lines.
- Reorganized `/brand-weddings/` folder structure: active docs at root, superseded versions in `/archive/`.
- Minor cleanup: typos, formatting inconsistencies, version footer updates.
```

---

## Section 3 — Decisions I Made

This is the critical section. Every non-trivial decision you made *without* asking Ricardo goes here, with brief justification.

The purpose is so Ricardo can quickly spot any decision he disagrees with and reverse it, without having to read all the diffs to find them.

**Format:**

```
**Decision 1:** Archived `brand-pov.md` rather than compressing it.
**Why:** 95% of its content was redundant with the compressed `foundation.md` (same enemy framing, same audience, same promise). Keeping a compressed version would have created a third doc saying the same thing as two others.

**Decision 2:** Rewrote the opening line of `messaging-framework.md` from "Small Plates helps you cherish the people who matter" to "Small Plates keeps the people who showed up present in your life."
**Why:** "Cherish" is banned vocabulary. The rewrite preserves meaning while removing the banned word.

**Decision 3:** Changed a reference from "Tuesday after the wedding" to "the one-day problem" in three places.
**Why:** The system canonically uses "the one-day problem" as enemy (per `foundation.md` v1.4). "Tuesday after the wedding" is retained only as mental image in the filter section. These three references were descriptive, not filter-invocations, so they should use the canonical enemy framing.
```

If you made zero decisions without asking — i.e., you only followed explicit instructions — write "None. All actions were explicitly requested."

---

## Section 4 — Flags — Needs Founder Attention

Everything that needs Ricardo's strategic call goes here. These are the items he should bring to his consultant in claude.ai for discussion before the next execution round.

Types of things that belong as flags:

- **Contradictions you can't resolve from the system.** E.g., "The tagline doc lists two variants of the acquisition line. Only one is in the foundation. Which one is canonical?"
- **Strategic shifts the system seems to imply but hasn't been stated.** E.g., "Three docs reference a pricing tier ($299) that doesn't appear in the foundation pricing notes. Confirm canonical."
- **Decisions you chose not to make because they're founder-level.** E.g., "The copy in `hero-section.html` reads as Saturday (wedding-day) framing. I did not rewrite because it's live marketing copy and the shift to Tuesday framing may need staged rollout."
- **Questions about the canonical system itself.** E.g., "The Margot doc says she's 28. The old brand-personality.md says she's 26. Which is canonical?"

**Format:**

```
**Flag 1:** [describe the issue]
**Why it needs you:** [why this is founder-level, not editor-level]
**What I'd recommend discussing with your consultant:** [specific question or framing]
```

If nothing needs flagging: "None. All decisions were within the editorial lane."

---

## Section 5 — Diffs

The actual line-by-line changes. This is the last section because it's the longest and the least Ricardo reads directly — he scans sections 1–4 for understanding and only goes to diffs when he wants to verify a specific change.

**Format:**

For each file that changed:

```
### `path/to/file.md`

**Before:**
> [original text]

**After:**
> [new text]

**Reason:** [one-line reason — usually maps to a decision or a banned-word fix]
```

If the change is mechanical (typos, formatting, banned word substitution), list it in a table at the top of the section:

```
### Mechanical changes

| File | Change | Reason |
|---|---|---|
| `tone-of-voice.md` | "cherish" → "keep present" (3 instances) | Banned vocabulary |
| `manifesto.md` | Fixed typo "thier" → "their" | Typo |
| `positioning.md` | Added version footer | Versioning consistency |
```

Then list substantive changes (structural rewrites, section deletions, reorganizations) with the before/after format.

---

## Additional guidance

### On tone of the report itself

The report is a functional document, not a conversation. Don't write in Margot voice. Don't write in Schoolcraft voice. Write in *consultant-to-consultant voice* — clear, concise, specific. The report is a tool for Ricardo and his other Claude instance. Both of them will process it faster if the tone is plain.

### On length

A report for a small task (one file, a few edits) should be under 300 words. A report for a substantial task (multi-file audit, compression pass) can reach 1,500 words — but section 5 does most of the work, sections 1–4 stay tight.

### On what NOT to include

- No apology if something went wrong. Report what happened, propose a fix.
- No flourishes or voice performance. This is not brand copy.
- No summaries of other reports or prior context. Assume Ricardo remembers.
- No recommendations for next steps unless he asked. The consultant (in claude.ai) decides next steps.

### On final sanity check

Before delivering, reread your report through this filter:

1. *Could Ricardo bring this report to his consultant and get actionable advice within one response?*
2. *Is every decision I made visible in section 3, or hidden in the diffs?*
3. *Does the executive summary capture the single most important thing?*

If any answer is no, revise before delivering.

---

*This report format is the interface between you (the executor) and the consultant-founder loop. Good reports make that loop fast. Bad reports make Ricardo do translation work. Translation work is friction. Friction compounds. Keep it clean.*
