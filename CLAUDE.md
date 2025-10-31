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
- **Database**: PostgreSQL with Prisma ORM (Neon serverless)
- **Authentication**: NextAuth.js v5 (Auth.js)
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Maps**: react-simple-maps for interactive world map
- **Storage**: Google Drive API (for trip photos and receipts)
- **AI**:
  - Groq (Llama 3.2 Vision 90B) for receipt scanning (FREE)
  - OpenAI (DALL-E 3) for trip image generation

### Key Directories
- `app/` - Next.js pages and API routes (App Router structure)
- `components/` - Reusable React components
- `lib/` - Utilities (auth.ts for NextAuth config, prisma.ts for DB client)
- `prisma/` - Database schema and seed scripts
- `types/` - TypeScript type definitions

### Database Schema
Key models:
- **User** - Authentication, user info, Google Drive OAuth tokens
- **Trip** - Travel trips with budget, dates, AI-generated cover images
- **BudgetCategory** - Budget allocations by category per trip
- **Expense** - Expense records with receipt photos, location, tips
- **TripPost** - Timeline posts (photos, notes, check-ins) stored in Google Drive
- **TravelDestination** - Map markers with coordinates, ratings, personal/shared visibility (350+ cities database)
- **Account** - Financial accounts (checking, savings, credit cards)
- **Transaction** - Bank transactions synced from Plaid/Wise
- **Budget** - Monthly budgets for non-trip expenses
- **BudgetItem** - Category allocations for monthly budgets

### Authentication Flow
- Uses NextAuth.js v5 with credentials provider
- Session stored as JWT
- Middleware protects all routes except `/login`
- User IDs are attached to trips and expenses for ownership

### Page Structure
- `/` - Dashboard showing all trips with budget summaries
- `/login` - Authentication page
- `/trips/new` - Create new trip with budget planning and DALL-E image generation
- `/trips/[id]` - Trip detail with:
  - **Timeline Tab**: Instagram-style feed of photos and expenses
  - **Budget Tab**: Expense tracking with AI receipt scanning and tip calculator
- `/map` - Interactive world map with 350+ cities, visit tracking, personal/shared filtering
- `/settings` - User settings and Google Drive OAuth connection
- `/finance` - Personal finance dashboard with Plaid/Wise integration

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
- **Photo Timeline**: Instagram-style feed combining photos and expenses with user attribution
- **AI Receipt Scanning**: Groq Llama Vision extracts amount, date, merchant, category (FREE)
- **Smart Tip Calculator**: Auto-detects food expenses, suggests 15-22% tips with one-tap application
- **Interactive World Map**: react-simple-maps with 350+ cities, color-coded countries, connection lines
- **Personal/Shared Destinations**: Control visibility of travel destinations (household vs private)
- **Google Drive Integration**: OAuth2 photo storage in users' personal Drive accounts
- **AI Trip Images**: DALL-E 3 generated cover images based on destination
- **Multi-currency**: USD, EUR, GBP, JPY, CNY with real-time conversion
- **Bank Sync**: Plaid/Wise for transaction import (optional)
- **Household Sharing**: Multi-user with color-coded attribution badges
