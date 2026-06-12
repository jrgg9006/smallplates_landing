// All FAQ content for /faq. Copy was founder-reviewed (see
// docs/superpowers/specs/2026-06-11-faq-page-design.md) — edit there first.

export interface FaqItem {
  id: string;
  question: string;
  /** Paragraphs, rendered in order. May be empty when `list` is the sole content. */
  answer: string[];
  /** Optional ordered list rendered after the paragraphs. */
  list?: string[];
}

export interface FaqCategory {
  id: string;
  title: string;
  items: FaqItem[];
}

export const FAQ_CATEGORIES: FaqCategory[] = [
  {
    id: "about",
    title: "About Small Plates",
    items: [
      {
        id: "what-is-small-plates",
        question: "What is Small Plates?",
        answer: [
          "A hardcover cookbook written by the people who show up: to a wedding, a shower, a birthday, a graduation. Each guest sends a recipe and a note. We collect them, design the book, print it, and ship it.",
          "It lives in the kitchen and gets stained. That's the point.",
        ],
      },
      {
        id: "who-organizes",
        question: "Who organizes the book?",
        answer: [
          "Usually one person: the maid of honor, the sister, the mom, a friend. You don't need design skills or free time. You share a link and the rest happens on its own.",
          "You can also run one for your own occasion.",
        ],
      },
      {
        id: "how-it-works",
        question: "How does it work, start to finish?",
        answer: [],
        list: [
          "Share your collection link with the people you want in the book: WhatsApp, text, email, whatever you use.",
          "Each guest submits a recipe and a note. About five minutes each.",
          "We clean everything up and design the book.",
          "You review every page, then send it to print.",
          "The hardcover shows up at your door.",
        ],
      },
      {
        id: "guest-book",
        question: "Is this like a guest book?",
        answer: [
          "A guest book gets signed once and goes in a box. This one gets opened on a random Tuesday because someone wants the lasagna recipe.",
          "Same people, different shelf life.",
        ],
      },
    ],
  },
  {
    id: "pricing",
    title: "Pricing & payment",
    items: [
      {
        id: "how-much",
        question: "How much does it cost?",
        answer: [
          "Starting is free: creating the event, inviting people, collecting recipes, watching them come in. You pay only when you print.",
          "One copy is $169. The price per copy drops as your group orders more: $129 each for 2 copies, $113 for 3, $103 for 4, $95 for 5, and $89 each from 6 on. Shipping to one address is included.",
        ],
      },
      {
        id: "when-pay",
        question: "When do I pay?",
        answer: [
          "At the very end, when you close the book and send it to print. Not before.",
          "No deposit, no subscription, no card on file.",
        ],
      },
      {
        id: "whats-free",
        question: "What exactly is free?",
        answer: [
          "Everything except the printed book: the event page, the collection link, and reminders to guests. You collect everything first and decide about printing later.",
        ],
      },
      {
        id: "split-cost",
        question: "Can we split the cost as a group?",
        answer: [
          "That's how the price is built. The book is usually a group gift: several people chip in and each keeps a copy. The per-person number you see is exactly what each person puts in.",
          "One person checks out; the group settles up however it normally does.",
        ],
      },
      {
        id: "never-print",
        question: "What if we collect recipes and never print?",
        answer: [
          "Then you pay nothing. The recipes stay saved in your account in case you change your mind later.",
        ],
      },
      {
        id: "extra-copies",
        question: "Can I order more copies after the book is printed?",
        answer: [
          "Yes. Single copies later are $129 plus $14 shipping.",
          "It's cheaper to order them with the main print run, where copies drop to as low as $89 each.",
        ],
      },
    ],
  },
  {
    id: "collecting",
    title: "Collecting recipes",
    items: [
      {
        id: "dish-photos",
        question: "Do guests need to upload a photo of the dish, or do you create the images?",
        answer: [
          "We create them. Guests only send the recipe. Our recipe-to-image technology reads every component of the recipe (the ingredients, the technique, the dish itself) and builds an image as close to the real recipe as possible. It's not 100% perfect and it can miss a detail, but we work to get every image as true to the dish as we can.",
        ],
      },
      {
        id: "guests-submit",
        question: "How do guests send their recipe?",
        answer: [
          "A link arrives in their messages or inbox. From there, two ways: they type the recipe out, or they take a photo of it wherever it lives (the handwritten card, grandma's notebook, the back of an envelope) and upload that. They add a short note, and they're done. About five minutes.",
          "No app, no account, no password. It works on any phone, tablet, or computer.",
        ],
      },
      {
        id: "dont-cook",
        question: "What if some guests don't cook?",
        answer: [
          "Even better. They can send the takeout order they'd defend with their life, or the sandwich they get every single time.",
          "It's not about being a chef. It's about being in the book.",
        ],
      },
      {
        id: "dont-send",
        question: "What if people don't send their recipes?",
        answer: [
          "Some won't on the first ask. That's normal. Your dashboard shows who's in, and you can send a reminder to everyone who hasn't with one click.",
          "If it's a wedding, you can also import your guest list straight from Zola or The Knot, so nobody gets left out.",
        ],
      },
      {
        id: "run-alone",
        question: "What are captains, and how do they help me collect recipes?",
        answer: [
          "Captains are the people who collect with you: the sister, the cousin, the other bridesmaid, whoever's good at this. You invite them, and each captain gets the same dashboard you do and gathers recipes right alongside you.",
          "The work spreads out, so it never sits on one person.",
        ],
      },
      {
        id: "how-many-recipes",
        question: "How many recipes do we need?",
        answer: [
          "At least 25 to print, and 50 are included in the price. Most books land between 30 and 50.",
          "If your group goes over, you can add more.",
        ],
      },
      {
        id: "languages",
        question: "Can recipes be in other languages?",
        answer: [
          "Yes, any language. Abuela's recipe stays in Spanish if that's how she wrote it.",
        ],
      },
      {
        id: "add-myself",
        question: "Can I add recipes myself?",
        answer: [
          "Yes. If someone hands you a recipe at dinner or texts it to you, you can add it for them from your dashboard.",
        ],
      },
      {
        id: "fix-typos",
        question: "Can I fix typos or edit recipes before printing?",
        answer: [
          "Yes. You can edit every single recipe yourself from your dashboard, any time before the book prints. We also run our own clean-up pass (amounts, steps, typos), and you review every page before anything goes to print.",
        ],
      },
    ],
  },
  {
    id: "the-book",
    title: "The book",
    items: [
      {
        id: "book-look",
        question: "What does the finished book look like?",
        answer: [
          "A hardcover, 8″ × 10″, printed in full color on heavy satin paper, with a matte cover. Every recipe gets its own page with the contributor's name and note, plus an image we create for it.",
          "Built to live on a counter, not a shelf.",
        ],
      },
      {
        id: "personalize",
        question: "Can I personalize the book?",
        answer: [
          "Yes. The cover has two lines you can make yours: the headline (ours says “Recipes from the people who love you,” but you can write your own) and the title: the couple's names, the graduate, the birthday person, whatever the book is for.",
          "You can also add one photo of your own. It goes in the opening pages, inside the book.",
        ],
      },
      {
        id: "who-designs",
        question: "Who designs it?",
        answer: [
          "We do. Recipes arrive messy: half-remembered amounts, “a pinch of this.” We clean, edit, and format every single one to the same standard, so the whole thing reads like one professional cookbook instead of fifty different notes.",
        ],
      },
      {
        id: "recipes-change",
        question: "Will the recipes look exactly as guests sent them?",
        answer: [
          "They'll change a little, on purpose. We clean and standardize every recipe so the book looks professional and consistent, without losing the essence: the dish, the voice, the weird family steps all stay. You see every recipe before it prints.",
        ],
      },
      {
        id: "see-before",
        question: "Can I see the book before it prints?",
        answer: [
          "Yes. Before printing, you review the full book page by page, and you can edit any recipe from your dashboard. Nothing prints until you say so.",
        ],
      },
      {
        id: "incomplete-recipe",
        question: "What if a recipe comes in incomplete?",
        answer: [
          "Expected. Half of home cooking is “until it looks right.” We edit for clarity and keep the voice, and you can review every recipe yourself before printing. And some recipes just aren't perfect. That's the point of this book.",
        ],
      },
    ],
  },
  {
    id: "gifting",
    title: "Gifting",
    items: [
      {
        id: "gift-or-couple",
        question: "Is the book a gift, or something you make for yourself?",
        answer: [
          "Both happen. Most books are organized as a gift, by the maid of honor, the mom, the sister, the friend group. Some people make one for their own table.",
          "Same book either way.",
        ],
      },
      {
        id: "when-give",
        question: "When do people give it?",
        answer: [
          "The shower, the bachelorette, the rehearsal dinner, the graduation lunch, the birthday: any moment where the people are actually in the room.",
          "It lands harder when it can get passed around the table.",
        ],
      },
      {
        id: "how-far-ahead",
        question: "How far ahead should I start?",
        answer: [
          "Give yourself six to eight weeks before the day you want to hand it over. Collecting takes a few weeks (people need a nudge or two), and printing and shipping take about three more.",
          "Starting earlier never hurts.",
        ],
      },
      {
        id: "surprise",
        question: "Can we keep it a surprise?",
        answer: [
          "Yes. The link goes to the guests, not to the person the book is for. Whether it's a surprise is your call. Plenty of groups keep it quiet until the day they hand it over.",
        ],
      },
    ],
  },
  {
    id: "shipping",
    title: "Shipping & delivery",
    items: [
      {
        id: "where-ship",
        question: "Where do you ship?",
        answer: ["United States, all of the European Union, and Mexico."],
      },
      {
        id: "how-long",
        question: "How long does the whole thing take?",
        answer: [
          "Collecting is up to you. Most groups give it a few weeks. Once you close the book and send it to print, it's at your door in about three weeks.",
        ],
      },
      {
        id: "shipping-cost",
        question: "How much is shipping?",
        answer: [
          "Included for the main order, shipped to one address. Single copies ordered later ship for $14.",
        ],
      },
    ],
  },
  {
    id: "privacy",
    title: "Privacy & support",
    items: [
      {
        id: "who-sees",
        question: "Who can see the recipes?",
        answer: [
          "Only your group. The book isn't public, there's no feed, and we don't post anything.",
          "The only people who ever see it are the ones you invited.",
        ],
      },
      {
        id: "guest-emails",
        question: "What do you do with guests' emails?",
        answer: [
          "We use them to send the invitation and reminders for your book. That's it. No newsletter, no marketing.",
        ],
      },
      {
        id: "delete-event",
        question: "Can I delete my event and everything in it?",
        answer: ["Yes. Write to us and we'll delete the event and all its recipes."],
      },
      {
        id: "need-help",
        question: "What if I need help?",
        answer: ["Email team@smallplatesandcompany.com. A person answers."],
      },
    ],
  },
];

/**
 * The 6 questions shown in the "Most common questions" accordion, in order.
 * Each entry must match a `FaqItem.id` in FAQ_CATEGORIES — a typo here makes
 * `getFaqItem` return undefined and the question silently disappears.
 */
export const TOP_QUESTION_IDS = [
  "dish-photos",
  "how-much",
  "when-pay",
  "guests-submit",
  "dont-cook",
  "how-long",
];

export function getFaqItem(id: string): FaqItem | undefined {
  for (const category of FAQ_CATEGORIES) {
    const match = category.items.find((item) => item.id === id);
    if (match) return match;
  }
  return undefined;
}
