# ✈️ TravelAI - AI-Powered Travel Planner & Expense Tracker

A comprehensive travel planning and expense tracking app with AI-powered features, social media-style trip sharing, and interactive world map.

**Built for personal/household use** - Perfect for couples and families who travel together.

> **🚀 Ready for Production**: This app is configured for deployment to Vercel with PostgreSQL. See [DEPLOYMENT.md](DEPLOYMENT.md) for setup instructions.

## Features

### 🤖 AI-Powered Features
- **AI Receipt Scanning**: Upload receipt photos and automatically extract amount, date, merchant, and category using Groq Llama Vision
- **AI Trip Image Generation**: Auto-generate beautiful trip cover images with DALL-E
- **Smart Tip Calculator**: Automatically suggests 15-22% tips for food/dining expenses with real-time calculations
- **AI Expense Insights**: Real-time spending analysis with smart recommendations and budget alerts

### 📸 Social Media-Style Trip Timeline
- **Photo Upload**: Upload multiple trip photos with captions and location tags to your Google Drive
- **Trip Posts**: Share moments with photos, notes, and check-ins
- **Timeline Feed**: Social media-style feed merging expenses and posts chronologically
- **Household Sharing**: All household members can view and contribute to trip timelines
- **User Attribution**: Color-coded badges showing who posted each item

### 🗺️ Interactive World Travel Map
- **Visual World Map**: Interactive, zoomable world map showing all your travels
- **350+ City Database**: Pre-loaded with cities across all continents with coordinates
- **Visit Tracking**: Mark cities as visited or future trips
- **Personal/Shared Destinations**: Control visibility - share with household or keep private
- **Travel Statistics**: Track countries visited, places rated, and future trips
- **Destination Details**: Add ratings, photos, highlights, and notes to each destination

### 💰 Expense Tracking & Budget
- **Quick Expense Entry**: Fast, mobile-optimized expense recording during trips
- **Receipt Photos**: Attach receipt photos stored in your Google Drive
- **AI Receipt Scanning**: Extract expense details automatically from receipt photos
- **Smart Tip Calculator**: Auto-detects food expenses and suggests tips (15%, 18%, 20%, 22%)
- **Category Budgeting**: Set and track budgets across multiple categories
- **Real-time Analytics**: Visual charts and spending breakdowns
- **Multi-Currency Support**: USD, EUR, GBP, JPY, CNY with real-time conversion

### 🌍 Travel Features
- **Multi-User Household**: Separate accounts with shared trip visibility
- **Trip Timeline**: Social feed combining expenses and photo posts
- **Location Tracking**: GPS coordinates and location names for expenses and posts
- **Budget Alerts**: Visual warnings when approaching budget limits
- **Trip Dashboard**: Overview of all trips with spending status
- **Expense Editing**: Edit expenses anytime and attach photos retroactively

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS with custom animations
- **Database**: PostgreSQL with Prisma ORM (hosted on Neon)
- **Authentication**: NextAuth.js v5 (Auth.js)
- **AI & Vision**:
  - Groq API with Llama 3.2 Vision (90B) for receipt scanning
  - OpenAI DALL-E for trip image generation
- **Storage**: Google Drive API (for trip photos, receipts, and AI-generated images)
- **UI Components**:
  - Maps: react-simple-maps for interactive world map
  - Charts: Recharts for expense analytics
  - Icons: Lucide React
- **APIs**:
  - Currency Conversion: Real-time exchange rates
  - Google Drive: OAuth2 for photo storage
  - Date Handling: date-fns

## Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database (e.g., Neon, Supabase, or local)
- Groq API key (get free at [console.groq.com](https://console.groq.com))
- OpenAI API key (for DALL-E trip images at [platform.openai.com](https://platform.openai.com))
- Google Cloud project with Drive API enabled (see [GOOGLE_DRIVE_SETUP.md](GOOGLE_DRIVE_SETUP.md))

### Installation

1. Clone the repository and install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env` (see `.env.example`):
```bash
# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@host/database"

# Authentication
NEXTAUTH_SECRET="your-secret-key-change-this-in-production"
NEXTAUTH_URL="http://localhost:3002"

# Required for AI features
GROQ_API_KEY="your-groq-api-key"
OPENAI_API_KEY="your-openai-api-key"

# Required for photo uploads
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3002/api/auth/google-drive/callback"

# Optional: For bank sync
PLAID_CLIENT_ID="your-plaid-client-id"
PLAID_SECRET="your-plaid-secret"
PLAID_ENV="sandbox"

WISE_API_TOKEN="your-wise-api-token"
```

3. Set up the database:
```bash
npx prisma db push
```

4. Seed the database with initial users:
```bash
npm run seed
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3002](http://localhost:3002) in your browser

### Login Credentials

After seeding, you can log in with:

**Account 1:**
- Email: `you@example.com`
- Password: `password123`

**Account 2:**
- Email: `wife@example.com`
- Password: `password123`

## Usage

### Planning a Trip

1. **Create Trip**: Fill in trip details, dates, and budget on the new trip page
2. **Set Category Budgets**: Allocate your budget across different expense categories
3. **Generate Cover Image**: Auto-generate beautiful AI cover image with DALL-E

### Tracking Expenses

1. **Quick Add**: Use the expense form on the Budget tab
2. **Scan Receipt**: Upload receipt photo for automatic data extraction with AI
3. **Smart Tips**: Auto-calculates suggested tips (15-22%) for food/dining expenses
4. **Attach Photos**: Add receipt photos stored in your Google Drive
5. **Multi-Currency**: Add expenses in USD, EUR, GBP, JPY, or CNY
6. **Track Location**: Record where each expense occurred

### Sharing Trip Moments

1. **Upload Photos**: Click "Add Photo" to upload trip photos with captions
2. **Tag Locations**: Add location names to photos and posts
3. **View Timeline**: See chronological feed of expenses and photos
4. **Household Sharing**: All household members see and contribute to timeline

### Exploring the Travel Map

1. **View Map**: Navigate to the Map page to see interactive world map
2. **Add Destinations**: Mark cities as visited or future trips from 350+ city database
3. **Personal/Shared**: Choose to share destinations with household or keep private
4. **Add Details**: Rate places (1-5 stars), add photos, notes, and highlights
5. **Track Statistics**: See countries visited, total places, and future trip count

### Getting Insights

1. **AI Analysis**: View real-time spending insights with personalized recommendations
2. **View Charts**: Visual breakdown of spending by category
3. **Budget Alerts**: Get warnings when approaching limits
4. **Daily Budget**: See how much you can spend per remaining day

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── ai/
│   │   │   ├── scan-receipt/        # AI receipt scanning (Groq Llama Vision)
│   │   │   └── generate-image/      # DALL-E trip image generation
│   │   ├── auth/
│   │   │   └── google-drive/        # Google OAuth for Drive access
│   │   ├── currency/                # Currency conversion
│   │   ├── destinations/            # Travel destination CRUD
│   │   ├── expenses/                # Expense tracking
│   │   ├── trips/                   # Trip management & posts
│   │   ├── upload-photo/            # Photo upload to Google Drive
│   │   └── image-proxy/             # Proxy for Google Drive images
│   ├── trips/
│   │   ├── [id]/                    # Trip detail with timeline
│   │   └── new/                     # New trip page
│   ├── map/                         # Interactive world travel map
│   ├── settings/                    # User settings & Google Drive
│   ├── finance/                     # Personal finance dashboard
│   └── page.tsx                     # Dashboard
├── components/
│   ├── AddPhotoModal.tsx            # Photo upload modal
│   ├── AddExpenseForm.tsx           # Expense form with tip calculator
│   ├── EditExpenseForm.tsx          # Edit expense with photo attach
│   ├── TripTimeline.tsx             # Social feed timeline
│   ├── WorldMap.tsx                 # Interactive world map
│   ├── TravelMapClient.tsx          # Map filtering & controls
│   ├── AddDestinationFormSmart.tsx  # 350+ city database
│   └── ...
├── lib/
│   ├── auth.ts                      # NextAuth config
│   ├── prisma.ts                    # Prisma client
│   ├── google-drive.ts              # Google Drive integration
│   └── currency.ts                  # Currency conversion
└── prisma/
    └── schema.prisma                # Database schema
```

## Database Schema

**Core Models:**
- **User**: User accounts with Google Drive credentials and preferences
- **Trip**: Travel trips with budget, date ranges, and AI-generated images
- **BudgetCategory**: Budget allocations by category
- **Expense**: Expense records with receipt photos, location, and tips

**Social & Sharing:**
- **TripPost**: Timeline posts (photos, notes, check-ins) with Google Drive URLs
- **TravelDestination**: Map of places visited with coordinates, ratings, and photos

**Finance:**
- **Account**: Financial accounts (checking, savings, credit cards)
- **Transaction**: Bank transactions synced from Plaid/Wise
- **Budget**: Monthly budgets for non-trip expenses
- **BudgetItem**: Budget category allocations

## Development

- `npm run dev` - Start development server on port 3002
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run seed` - Seed database with initial users
- `npx prisma studio` - Open Prisma Studio to view/edit database
- `npx prisma db push` - Push schema changes to database

## API Endpoints

### AI Endpoints
- `POST /api/ai/scan-receipt` - Scan receipt with Groq Llama Vision (extracts amount, date, merchant, category)
- `POST /api/ai/generate-image` - Generate trip cover image with DALL-E

### Trip & Timeline
- `GET/POST /api/trips` - Trip management
- `GET/POST /api/trips/[id]/posts` - Trip posts (photos, notes, check-ins)
- `GET /api/trips/[id]/timeline` - Combined timeline of expenses and posts

### Expense Tracking
- `GET/POST /api/expenses` - Expense CRUD
- `PATCH /api/expenses/[id]` - Update expense
- `POST /api/upload-photo` - Upload photo to Google Drive

### Travel Map
- `GET/POST /api/destinations` - Travel destination management
- `PATCH /api/destinations/[id]` - Update destination
- `DELETE /api/destinations/[id]` - Remove destination

### Utilities
- `POST /api/currency/convert` - Currency conversion
- `GET /api/currency/convert?base=USD` - Get exchange rates
- `GET /api/image-proxy` - Proxy Google Drive images for CORS
- `GET/POST /api/auth/google-drive/*` - Google OAuth flow

## Key Features Explained

### AI Receipt Scanning
Upload a receipt photo and Groq's Llama Vision model automatically extracts:
- Total amount (including tax)
- Date of purchase
- Merchant/store name
- Item description
- Suggested category (Food, Transport, Shopping, etc.)
- **Free & Fast** - Groq API is free with generous limits

### Smart Tip Calculator
When adding food/dining expenses:
- Auto-detects food-related categories
- Shows 4 quick tip buttons: 15%, 18%, 20%, 22%
- Real-time calculation of tip amount
- Displays total with tip included
- One-tap to apply suggested tip

### Interactive World Map
Visual representation of your travels:
- **350+ cities** pre-loaded with coordinates across all continents
- Color-coded countries (green=visited, orange=tourism hotspots, gray=other)
- City markers with checkmarks (visited) or stars (future)
- Connection lines between visited destinations
- Filter by: All, Visited Only, Future Trips
- Map or list view toggle
- Travel statistics dashboard

### Social Timeline Feed
Instagram-style feed combining:
- Trip photos with captions and locations
- Expense records with amounts and categories
- Check-ins and notes
- User attribution with color-coded badges
- Chronological ordering by timestamp
- Household-wide sharing (all members contribute)

### Google Drive Integration
Secure photo storage in users' personal Google Drive:
- OAuth2 authentication flow
- Automatic folder creation ("Travel App Photos")
- High-resolution photo storage
- Privacy maintained (photos in user's own Drive)
- Image proxy for seamless loading

## Notes

- **Free AI** - Groq API offers free receipt scanning with generous limits
- **Google Drive** - Photos stored in users' own Drive (full privacy control)
- **Multi-user** - Perfect for couples and families (2-6 household members)
- **PostgreSQL** - Production-ready database (not SQLite)
- **Real-time** - Live currency conversion and budget updates
- **Mobile-first** - Optimized for on-the-go expense tracking

## What Makes This Special

✨ **AI Receipt Scanning** - Just snap a photo, AI does the rest (free with Groq)

🗺️ **Visual Travel Map** - See all your travels on an interactive world map with 350+ cities

📸 **Social Timeline** - Instagram-style feed combining photos and expenses

💡 **Smart Tip Calculator** - Auto-suggests tips for food expenses

🔒 **Privacy First** - Photos in your own Google Drive, control what you share

🏠 **Household App** - Perfect for couples/families traveling together

## Future Enhancements

- PDF export for trip summaries and expense reports
- Mobile PWA with offline support
- Weather integration for trip planning
- Flight and hotel booking tracking
- Packing list generator
- Trip collaboration (real-time editing)
- Push notifications for budget alerts
- Trip templates for popular destinations
