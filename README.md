# SmallPlates & Company

*The wedding recipe book made by the people who love you.*

## 📖 Overview

SmallPlates creates collaborative recipe books where wedding guests contribute their favorite recipes, which are then professionally designed and printed as premium hardcover books for the couple. 

More than a cookbook — it's a meaningful gift that carries the presence of loved ones into the kitchen, where marriage actually happens.

**"Still at the table."** Every time they cook a recipe, every time they read a name — their loved ones are still there, still part of their life together.

## ✨ How It Works

1. **Create** - An organizer (bridesmaid, family member) starts a recipe collection
2. **Collect** - Share a unique link with wedding guests to contribute recipes
3. **Design** - We professionally format and design every submission
4. **Print** - Receive beautiful hardcover books ready to gift

## 🎯 Key Features

### For Organizers
- **Easy Setup**: Create a collection in minutes
- **Guest Management**: Track who's contributed, send gentle reminders
- **Real-time Progress**: Watch the book come together
- **Multiple Book Options**: Premium for the couple, Classic editions for family

### For Contributors
- **Simple Submission**: Add recipes via web, no app needed
- **Personal Touch**: Include notes and memories with each recipe
- **Multiple Formats**: Upload photos, type directly, or share links

### For Couples
- **Meaningful Gift**: A book made by everyone who loves them
- **Daily Use**: Lives in the kitchen, not on a shelf
- **Growing Value**: Becomes more meaningful over time

## 🛠️ Tech Stack

- **Frontend**: Next.js 15.5.7, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Payments**: Stripe
- **Email**: Resend
- **AI**: OpenAI API (recipe enhancement)
- **Deployment**: Vercel

## 📋 Prerequisites

- Node.js 18.17 or later
- npm or yarn
- Supabase account
- Stripe account (for payments)
- Resend account (for emails)
- OpenAI API key (optional, for AI features)

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd smallplates_landing
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

   Configure the following variables:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # Stripe
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_webhook_secret

   # Email (Resend)
   RESEND_API_KEY=your_resend_api_key
   RESEND_DOMAIN=your_verified_domain

   # OpenAI (optional)
   OPENAI_API_KEY=your_openai_api_key
   ANTHROPIC_API_KEY=your_anthropic_api_key

   # App Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Run database migrations**
   
   Apply the Supabase migrations from the `supabase/migrations` folder in your Supabase dashboard.

5. **Start the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
smallplates_landing/
├── app/                     # Next.js App Router
│   ├── (admin)/            # Admin dashboard
│   ├── (landing)/          # Public pages
│   ├── (onboarding)/       # User onboarding flow
│   ├── (platform)/         # Main application
│   │   └── profile/        # User dashboard
│   ├── (recipe-journey)/   # Recipe submission flow
│   └── api/                # API routes
├── components/             # React components
│   ├── auth/              # Authentication
│   ├── landing/           # Landing page sections
│   ├── onboarding/        # Onboarding steps
│   ├── profile/           # Dashboard components
│   │   ├── cookbook/      # Cookbook management
│   │   ├── groups/        # Group/event management
│   │   ├── guests/        # Guest management
│   │   └── recipes/       # Recipe management
│   ├── recipe-journey/    # Recipe submission flow
│   └── ui/               # Reusable UI components
├── lib/                   # Utilities
│   ├── supabase/         # Database client & queries
│   ├── stripe/           # Payment integration
│   └── types/            # TypeScript definitions
├── public/               # Static assets
├── supabase/             # Database schema
├── brand_wedding/        # Brand guidelines
├── business_plan/        # Business documentation
└── CLAUDE.md            # AI assistant instructions
```

## 🗄️ Database Schema

Main tables:
- **profiles** - User accounts and preferences
- **groups** - Recipe collections (weddings/events)
- **group_members** - Group participants and permissions
- **guests** - Recipe contributors
- **recipes** - Submitted recipes with metadata
- **waitlist** - Early access signups
- **email_logs** - Email delivery tracking

## 🔐 Security & Authentication

- **Supabase Auth** for user authentication
- **Row Level Security (RLS)** policies for data protection
- **Email verification** for new accounts
- **Invitation system** for group members
- **Secure API routes** with proper authorization

## 💳 Pricing Tiers

| Tier | Name | Contents | Price |
|------|------|----------|-------|
| 1 | The Book | 1 Premium | $149 |
| 2 | The Family Collection | 1 Premium + 2 Classic | $279 |
| 3 | The Kitchen Table | 1 Premium + 5 Classic | $449 |
| Custom | Contact Us | Flexible configurations | Quote |

## 🔧 Development Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run typecheck    # TypeScript type checking

# Database
npm run db:types     # Generate TypeScript types from Supabase
```

## 🚀 Deployment

Optimized for Vercel deployment:

1. Push code to GitHub
2. Import project in Vercel
3. Add all environment variables
4. Deploy

Production checklist:
- [ ] Configure Supabase RLS policies
- [ ] Set up Stripe webhooks
- [ ] Verify email domain in Resend
- [ ] Enable proper CORS settings
- [ ] Set production environment variables

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Follow the guidelines in `CLAUDE.md`
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## 📝 Development Guidelines

See `CLAUDE.md` for:
- Code structure and organization
- Testing requirements
- Style conventions
- AI assistant instructions

## 🎨 Brand Guidelines

See `brand_wedding/` for:
- Brand positioning and voice
- Visual identity
- Messaging framework
- Photography style

## 📊 Business Context

See `business_plan/` for:
- Executive summary
- Market analysis
- Customer segments
- Competitive landscape

## 📧 Support

- Email: support@smallplates.company
- Website: [smallplates.company](https://smallplates.company)

---

*Built with love in the kitchen.*

Small Plates & Company © 2024. All rights reserved.