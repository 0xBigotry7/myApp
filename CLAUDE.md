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
- **Database**: SQLite with Prisma ORM
- **Authentication**: NextAuth.js v5 (Auth.js)
- **Styling**: Tailwind CSS
- **Charts**: Recharts

### Key Directories
- `app/` - Next.js pages and API routes (App Router structure)
- `components/` - Reusable React components
- `lib/` - Utilities (auth.ts for NextAuth config, prisma.ts for DB client)
- `prisma/` - Database schema and seed scripts
- `types/` - TypeScript type definitions

### Database Schema
The app uses four main models:
- **User** - Authentication and user info
- **Trip** - Travel trips with budget totals and date ranges
- **BudgetCategory** - Budget allocations for each category within a trip
- **Expense** - Individual expense records linked to trips and users

### Authentication Flow
- Uses NextAuth.js v5 with credentials provider
- Session stored as JWT
- Middleware protects all routes except `/login`
- User IDs are attached to trips and expenses for ownership

### Page Structure
- `/` - Dashboard showing all trips with budget summaries
- `/login` - Authentication page
- `/trips/new` - Create new trip with budget planning
- `/trips/[id]` - Trip detail with expense tracking and analytics

### Data Flow
- Server components fetch data directly using Prisma
- Client components use API routes for mutations (POST /api/trips, POST /api/expenses)
- After mutations, use `router.refresh()` to revalidate server components

### Important Notes
- Database file is `dev.db` in the root directory (gitignored)
- Environment variables are in `.env` (gitignored)
- NextAuth requires `NEXTAUTH_SECRET` and `NEXTAUTH_URL` in .env
- The app is designed for local use by two users (you and your wife)
