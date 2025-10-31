# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server (runs on port 3002 by default)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run seed` - Seed database with initial users (you@example.com and wife@example.com, password: password123)
- `npx prisma db push` - Sync database schema with Prisma schema
- `npx prisma generate` - Regenerate Prisma Client
- `npx prisma studio` - Open Prisma Studio for database GUI

## Architecture

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v5 (Auth.js)
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Storage**: Google Drive API (for trip photos)
- **AI**: Groq (Llama Vision), OpenAI (DALL-E)

### Key Directories
- `app/` - Next.js pages and API routes (App Router structure)
- `components/` - Reusable React components
- `lib/` - Utilities (auth.ts for NextAuth config, prisma.ts for DB client)
- `prisma/` - Database schema and seed scripts
- `types/` - TypeScript type definitions

### Database Schema
Key models:
- **User** - Authentication, user info, and Google Drive credentials
- **Trip** - Travel trips with budget totals, date ranges, and AI-generated images
- **BudgetCategory** - Budget allocations for each category within a trip
- **Expense** - Individual expense records linked to trips and users (includes tip calculation)
- **TripPost** - Timeline posts (photos, notes, check-ins) with Google Drive URLs
- **TravelDestination** - Map of places visited with coordinates and photos
- **Account** - Financial accounts (checking, savings, credit cards)
- **Transaction** - Bank transactions synced from Plaid/Wise

### Authentication Flow
- Uses NextAuth.js v5 with credentials provider
- Session stored as JWT
- Middleware protects all routes except `/login`
- User IDs are attached to trips and expenses for ownership

### Page Structure
- `/` - Dashboard showing all trips with budget summaries
- `/login` - Authentication page
- `/trips/new` - Create new trip with budget planning
- `/trips/[id]` - Trip detail with timeline, expense tracking, and analytics
- `/settings` - User settings and Google Drive connection
- `/map` - Interactive world map of travel destinations
- `/finance` - Personal finance dashboard with accounts and budgets
- `/expenses` - General expense tracking (non-trip expenses)

### Data Flow
- Server components fetch data directly using Prisma
- Client components use API routes for mutations (POST /api/trips, POST /api/expenses)
- After mutations, use `router.refresh()` to revalidate server components

### Important Notes
- PostgreSQL database hosted on Neon (connection string in `.env`)
- Environment variables are in `.env` (gitignored) - see `.env.example` for required vars
- NextAuth requires `NEXTAUTH_SECRET` and `NEXTAUTH_URL` in .env
- Google Drive API requires OAuth credentials - see `GOOGLE_DRIVE_SETUP.md`
- The app is designed for personal/household use (2-4 users sharing trips)

### Google Drive Integration
- Trip photos are stored in users' personal Google Drive accounts
- Each user connects their own Google Drive via OAuth
- Photos are saved to a "Travel App Photos" folder
- Users maintain full control over their photos
- See `GOOGLE_DRIVE_SETUP.md` for complete setup instructions

### Key Features
- **Trip Timeline**: Social media-style feed with photos, notes, and expenses
- **Budget Tracking**: Real-time budget vs actual spending with AI insights
- **Tip Calculator**: Auto-detects food expenses and suggests 15-22% tips
- **Travel Map**: Interactive world map showing visited destinations
- **AI Features**:
  - Receipt scanning with Llama Vision
  - Trip image generation with DALL-E
  - Expense insights and recommendations
- **Bank Sync**: Automatic transaction import via Plaid/Wise
- **Multi-currency**: Support for USD, EUR, CNY with real-time exchange rates
