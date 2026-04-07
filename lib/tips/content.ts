import type { Category, Article } from './types'

export const CATEGORIES: Category[] = [
  {
    id: 'setup',
    name: 'Getting started',
    shortDesc: 'Three things to do before you invite anyone. They make everything easier.',
    iconType: 'layers',
    colorVariant: 'amber',
    articleIds: ['setup-1', 'setup-2', 'setup-3'],
  },
  {
    id: 'recipes',
    name: 'Getting more recipes',
    shortDesc: 'The difference between 20 recipes and 80 is method, not luck.',
    iconType: 'users',
    colorVariant: 'terra',
    articleIds: ['rec-1', 'rec-2', 'rec-3', 'rec-4'],
  },
  {
    id: 'captains',
    name: 'Your captains',
    shortDesc: "You can't follow up with 80 people alone. You don't have to.",
    iconType: 'people',
    colorVariant: 'sage',
    articleIds: ['cap-1', 'cap-2'],
  },
  {
    id: 'reminders',
    name: 'Reminders',
    shortDesc: "Most recipes arrive after the second or third reminder. One isn't enough.",
    iconType: 'bell',
    colorVariant: 'blue',
    articleIds: ['rem-1', 'rem-2', 'rem-3'],
  },
  {
    id: 'closing',
    name: 'Closing the book',
    shortDesc: 'What to check before you click that button — and what happens next.',
    iconType: 'book',
    colorVariant: 'slate',
    articleIds: ['close-1', 'close-2'],
  },
]

export const ARTICLES: Article[] = [
  // ── Getting started ──────────────────────────────────────────
  {
    id: 'setup-1',
    catId: 'setup',
    tag: 'essential',
    title: "Add the couple's photo to your invitation link",
    shortDesc: 'One photo makes the difference between a click and a skip.',
    body: [
      {
        type: 'paragraph',
        content:
          "When guests receive your invitation, the couple's photo tells them in one second what this is — and reminds them why it matters.",
      },
      {
        type: 'paragraph',
        content:
          'Without a photo, your link looks like a generic form. With a photo, it looks like someone put thought into it.',
      },
      {
        type: 'callout',
        calloutTitle: 'How to do it',
        content:
          "Go to Settings → Book cover → Couple's photo. Upload a high-quality image, ideally horizontal. It doesn't need to be a professional shot — any good photo of them together works.",
      },
      {
        type: 'imagePlaceholder',
        placeholderType: 'Screenshot',
        placeholderDesc:
          'Settings panel showing the "Cover photo" field. Empty state on the left, filled state with couple\'s photo on the right.',
      },
      {
        type: 'paragraph',
        content:
          'Once uploaded, every link you share will automatically show that photo as the preview — in WhatsApp, email, anywhere.',
      },
    ],
    relatedIds: ['setup-2', 'rec-1'],
  },
  {
    id: 'setup-2',
    catId: 'setup',
    tag: 'essential',
    title: 'Set your deadline two weeks earlier than you think',
    shortDesc: 'People always submit late. Those two weeks are yours.',
    body: [
      {
        type: 'paragraph',
        content:
          "People always submit late. Not because they don't want to — because life gets in the way. If you need the book by the 15th, tell guests the deadline is the 1st.",
      },
      {
        type: 'paragraph',
        content:
          'Those two weeks are yours. For the final reminder. For chasing the stragglers. For not stressing out.',
      },
      {
        type: 'callout',
        calloutTitle: 'The formula',
        content:
          "Real print date → subtract 5 production days → that's your close date. Subtract two more weeks → that's the date you tell guests.",
      },
      {
        type: 'imagePlaceholder',
        placeholderType: 'Diagram — Timeline',
        placeholderDesc:
          '"Guest deadline" (honey), "Your close date" two weeks later (terracotta), "Book delivery" (charcoal). Clean white background.',
      },
      {
        type: 'note',
        content:
          'The date field in your settings is what guests see. Set it with the buffer already built in — no need to explain anything to them.',
      },
    ],
    relatedIds: ['rem-1', 'close-1'],
  },
  {
    id: 'setup-3',
    catId: 'setup',
    tag: 'quick',
    title: 'Import your guest list from Zola or The Knot',
    shortDesc: 'If the couple has their list there, you can upload it in 30 seconds.',
    body: [
      {
        type: 'paragraph',
        content:
          "If the couple already has their guest list on Zola or The Knot, you don't have to type a single email address by hand. Export the file from their account and upload it here. Thirty seconds.",
      },
      {
        type: 'steps',
        steps: [
          'Ask the couple to download their guest list from Zola or The Knot as a CSV file.',
          'In your dashboard, go to Guests → Import list.',
          'Upload the file. The system reads names and emails automatically.',
          'Review for accuracy and confirm.',
        ],
      },
      {
        type: 'imagePlaceholder',
        placeholderType: 'Screenshot — Import screen',
        placeholderDesc:
          'Import area with drag-and-drop zone. Zola and The Knot logos shown below as compatible sources.',
      },
      {
        type: 'callout',
        calloutTitle: 'No Zola or The Knot?',
        content:
          "No problem. You can add guests one by one, or share the list in any format and we'll help you get it in.",
      },
    ],
    relatedIds: ['cap-1', 'rec-1'],
  },

  // ── Getting more recipes ─────────────────────────────────────
  {
    id: 'rec-1',
    catId: 'recipes',
    tag: 'essential',
    title: 'Share the link on WhatsApp — not just by email',
    shortDesc: 'Email gets lost. WhatsApp gets read.',
    body: [
      {
        type: 'paragraph',
        content:
          "Email gets lost. WhatsApp gets read. If you want people to respond, the link needs to be on their phones — not sitting in their inbox.",
      },
      {
        type: 'paragraph',
        content:
          "Copy your invitation link and paste it into every relevant group: the bridesmaids' chat, the family group, the work friends, the groom's crew. All of them.",
      },
      {
        type: 'callout',
        calloutTitle: 'The message that works',
        content:
          '"Hey everyone — I\'m putting together a surprise recipe book for [Name] and [Name]. It takes 5 minutes and the result is going to be incredible. [link]"\n\nShort, personal, link at the end.',
      },
      {
        type: 'imagePlaceholder',
        placeholderType: 'Mockup — WhatsApp message',
        placeholderDesc:
          "Chat bubble with sample message. Link preview shows couple's photo. Light gray WhatsApp-style background.",
      },
      {
        type: 'paragraph',
        content:
          "The couple's photo appears automatically in the link preview. That's why setting it up first matters.",
      },
    ],
    relatedIds: ['setup-1', 'rec-2'],
  },
  {
    id: 'rec-2',
    catId: 'recipes',
    tag: 'essential',
    title: 'Personalize the invitation message',
    shortDesc: 'Generic messages ask for recipes. Personal ones make people want to give them.',
    body: [
      {
        type: 'paragraph',
        content:
          'A generic message asks for recipes. A personal one makes people want to give them.',
      },
      {
        type: 'paragraph',
        content:
          'The difference is one sentence. Something specific about the couple — why this book matters for them, what kind of recipe would fit perfectly.',
      },
      {
        type: 'note',
        content:
          '"Sofia has cooked with her brothers since she was little. This book is so she never forgets."\n\n"Marco loves his mom\'s pasta more than anything. Imagine if they had it printed forever."',
      },
      {
        type: 'paragraph',
        content:
          'Specific unlocks. People respond to real stories, not generic forms.',
      },
      {
        type: 'callout',
        calloutTitle: 'Where to write it',
        content:
          'Settings → Invitation message. One or two personal sentences at the top make all the difference.',
      },
    ],
    relatedIds: ['rec-1', 'rec-3'],
  },
  {
    id: 'rec-3',
    catId: 'recipes',
    tag: 'quick',
    title: 'Tell them it takes 5 minutes',
    shortDesc: 'Because it does. And those two words change everything.',
    body: [
      {
        type: 'paragraph',
        content:
          "Because it's true. And those two words completely change how people perceive the task.",
      },
      {
        type: 'paragraph',
        content:
          "When someone receives an invitation with no sense of time, they assume it's complicated. They save it for later. Later never comes.",
      },
      {
        type: 'paragraph',
        content: '"5 minutes" removes that friction before it starts.',
      },
      {
        type: 'callout',
        calloutTitle: 'Where to say it',
        content:
          "In the WhatsApp message. In the email invite. In the reminder. Everywhere. Repeat it — it doesn't feel pushy, it feels reassuring.",
      },
    ],
    relatedIds: ['rec-4', 'rem-1'],
  },
  {
    id: 'rec-4',
    catId: 'recipes',
    tag: 'quick',
    title: 'Give them recipe ideas',
    shortDesc: "Most people don't know what to send. Give them permission.",
    body: [
      {
        type: 'paragraph',
        content:
          "Most guests don't know what to submit. Not because they don't have recipes — but because they're not sure if their recipe is good enough, special enough, appropriate enough.",
      },
      {
        type: 'paragraph',
        content: 'The answer is always yes. They just need permission.',
      },
      {
        type: 'note',
        content:
          'Examples that work well:\n\n— "The Sunday pasta"\n— "My grandmother\'s soup"\n— "What I\'d cook for them if they came to dinner"\n— "My favorite recipe right now"\n— "Something I learned on a trip"',
      },
      {
        type: 'paragraph',
        content:
          'Adding two or three examples to your invitation message almost always increases responses.',
      },
    ],
    relatedIds: ['rec-2', 'cap-1'],
  },

  // ── Your captains ────────────────────────────────────────────
  {
    id: 'cap-1',
    catId: 'captains',
    tag: null,
    title: 'What is a captain and why you need one',
    shortDesc: "You can't follow up with 80 people. You don't have to.",
    body: [
      {
        type: 'paragraph',
        content:
          "You can't follow up with 80 people alone. But you can ask 4 or 5 trusted people to do it within their own groups.",
      },
      {
        type: 'paragraph',
        content:
          'A captain is someone who takes responsibility for a specific group — his family, her work friends, their college crew. You give them the link and context; they move it from the inside.',
      },
      {
        type: 'imagePlaceholder',
        placeholderType: 'Diagram — Captain tree',
        placeholderDesc:
          'You at the center (honey node). 4 captains around you. Each captain with arrows to their group. Minimal, no photos.',
      },
      {
        type: 'paragraph',
        content:
          'A captain inside a family group gets 3× more recipes than a mass email to the same group. The trust is already there — you just need to activate it.',
      },
    ],
    relatedIds: ['cap-2', 'rec-1'],
  },
  {
    id: 'cap-2',
    catId: 'captains',
    tag: null,
    title: 'How to invite captains and what to ask them',
    shortDesc: 'Who to choose, what to say, and how to make sure they do it.',
    body: [
      {
        type: 'paragraph',
        content:
          "Choose people who are already at the center of their groups — the one who always organizes family dinners, the one who responds first in the work chat, the one who knows everyone.",
      },
      {
        type: 'steps',
        steps: [
          'From your dashboard, go to Captains → Invite captain.',
          "Add their name and email. They'll receive a message explaining their role.",
          'Tell them exactly which group is theirs: "You\'re in charge of her cousins."',
          'Share the invitation link and a sample message they can copy and paste.',
        ],
      },
      {
        type: 'callout',
        calloutTitle: 'What to ask them — exactly',
        content:
          '"Send the link to your group and remind them a week before the deadline. That\'s it."\n\nDon\'t ask for more. Simple things get done. Complicated things get postponed.',
      },
    ],
    relatedIds: ['cap-1', 'rem-3'],
  },

  // ── Reminders ────────────────────────────────────────────────
  {
    id: 'rem-1',
    catId: 'reminders',
    tag: 'essential',
    title: 'The 3-reminder plan that actually works',
    shortDesc: "Sending one and waiting doesn't work. Three does.",
    body: [
      {
        type: 'paragraph',
        content:
          "Sending one reminder and waiting doesn't work. Not because people don't care — but because life interrupts. The first reminder gets missed. The second comes at a bad time. The third is the one that lands.",
      },
      {
        type: 'note',
        content:
          '<strong>Week 1 — Soft launch.</strong>\nRemind them the book exists. Tone: warm, no pressure. "Just in case it slipped your mind, here\'s the link."\n\n<strong>3 days before — Countdown.</strong>\nName the date. "We close on Thursday." Specificity activates. Most late recipes arrive after this one.\n\n<strong>Last day — Today\'s the day.</strong>\n"It only takes 5 minutes and today is the last day." Short, direct. No drama.',
      },
      {
        type: 'paragraph',
        content:
          "This isn't nagging. It's how you build the book you promised.",
      },
    ],
    relatedIds: ['rem-2', 'rem-3'],
  },
  {
    id: 'rem-2',
    catId: 'reminders',
    tag: 'quick',
    title: "Use the 'Remind' button — don't do it by hand",
    shortDesc: "The system knows who responded. You don't have to check.",
    body: [
      {
        type: 'paragraph',
        content:
          "You don't have to figure out who responded and who didn't. The system already knows.",
      },
      {
        type: 'paragraph',
        content:
          'From your guest list, the "Remind" button sends a follow-up automatically — only to guests who haven\'t submitted yet. No duplicates. No manual tracking. No extra work.',
      },
      {
        type: 'imagePlaceholder',
        placeholderType: 'Screenshot — Remind button',
        placeholderDesc:
          'Guest list view with "Pending" rows highlighted. "Send reminder" button in the top right, active in honey gold.',
      },
      {
        type: 'callout',
        calloutTitle: 'When to use it',
        content:
          "One week before. Three days before. And the day of close. Three clicks — that's all you need to do.",
      },
    ],
    relatedIds: ['rem-1', 'rem-3'],
  },
  {
    id: 'rem-3',
    catId: 'reminders',
    tag: null,
    title: 'Message the key people directly',
    shortDesc: "There are always 3 or 4 recipes you really want. Don't leave them to chance.",
    body: [
      {
        type: 'paragraph',
        content:
          'There are always 3 or 4 recipes you really want in the book. The grandmother. The best friend. The aunt who cooks like no one else.',
      },
      {
        type: 'paragraph',
        content:
          "Don't wait for them to respond to the mass email. A personal message has a different weight — and it works almost every time.",
      },
      {
        type: 'note',
        content:
          "Example:\n\n\"Hi Maria — I'm putting together a recipe book for Ana and Pablo's wedding. Your mole is legendary. Can you send it to me? It takes 5 minutes and it would be perfect in the book.\"",
      },
      {
        type: 'paragraph',
        content: "Specific. Personal. With context. That's all it needs.",
      },
    ],
    relatedIds: ['rem-1', 'cap-2'],
  },

  // ── Closing the book ─────────────────────────────────────────
  {
    id: 'close-1',
    catId: 'closing',
    tag: 'essential',
    title: 'Review your progress before closing',
    shortDesc: 'Two minutes now saves you from regret later.',
    body: [
      {
        type: 'paragraph',
        content:
          'Before you click "Close book," take two minutes to make sure everything is how you want it.',
      },
      {
        type: 'steps',
        steps: [
          'Check the total number of recipes. Are you happy with it?',
          'Verify that names are spelled correctly — exactly as you want them to appear in print.',
          'Read through at least one recipe from each group. If something important is missing, you still have time.',
          'Confirm the delivery address and production details.',
        ],
      },
      {
        type: 'callout',
        calloutTitle: "Once you close, it can't be edited.",
        content:
          "There's no rush. If you need one more day to get the last few recipes, take it.",
      },
    ],
    relatedIds: ['close-2', 'rem-1'],
  },
  {
    id: 'close-2',
    catId: 'closing',
    tag: null,
    title: 'What happens after you close the book',
    shortDesc: 'The production process, the timeline, and what to expect.',
    body: [
      {
        type: 'paragraph',
        content:
          "Once you close the book, production begins. Here's everything to expect:",
      },
      {
        type: 'steps',
        steps: [
          "You'll receive a confirmation email with your order summary.",
          "Within 24–48 hours, you'll receive a digital proof for approval.",
          'Once you approve, it goes to print. Production time varies by book size.',
          'The book is shipped to the address you provided.',
        ],
      },
      {
        type: 'note',
        content:
          'Estimated production times — before placing your order, confirm the exact timeline with your coordinator. Orders close to the wedding date require advance planning.',
      },
    ],
    relatedIds: ['close-1', 'setup-2'],
  },
]

export const MOST_HELPFUL_IDS = ['setup-1', 'setup-2', 'rec-1', 'rem-1', 'cap-1']

// Reason: Featured hero cards on TipsHome. Custom display copy (title/hook)
// optimized for the card — more action-oriented than the source article's own
// title. Points to existing articles by articleId. Order here is the order shown.
export const FEATURED_TIPS: Array<{
  articleId: string
  number: string
  title: string
  hook: string
}> = [
  {
    articleId: 'cap-1',
    number: '01',
    title: 'Pick your captains',
    hook: "You can't chase 80 people alone. Four trusted friends can.",
  },
  {
    articleId: 'rec-1',
    number: '02',
    title: 'Build a big WhatsApp group',
    hook: 'Email gets lost. WhatsApp gets read — every single time.',
  },
  {
    articleId: 'setup-2',
    number: '03',
    title: 'Set a closure date',
    hook: 'People submit late. Build in two weeks of buffer, and relax.',
  },
  {
    articleId: 'setup-3',
    number: '04',
    title: 'Import from Zola or The Knot',
    hook: 'Upload the guest list in 30 seconds. No typing required.',
  },
]

// Helper lookups
export function getCategory(id: string): Category | undefined {
  return CATEGORIES.find((c) => c.id === id)
}

export function getArticle(id: string): Article | undefined {
  return ARTICLES.find((a) => a.id === id)
}

export function getArticlesForCategory(catId: string): Article[] {
  const cat = getCategory(catId)
  if (!cat) return []
  return cat.articleIds
    .map((id) => getArticle(id))
    .filter((a): a is Article => a !== undefined)
}
