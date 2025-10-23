# ✈️ TravelAI - AI-Powered Travel Planner

A beautiful travel planning and expense tracking app with AI-powered features, anime-style visuals, and bilingual support (English/中文).

**Built for personal use by BABER and his wife.**

> **🚀 Ready for Production**: This app is configured for deployment to Vercel with PostgreSQL. See [DEPLOYMENT.md](DEPLOYMENT.md) for setup instructions.

## Features

### 🤖 AI-Powered Features
- **AI Destination Suggestions**: Get personalized destination recommendations based on your budget and interests
- **AI Itinerary Generation**: Automatically generate detailed day-by-day itineraries with activities, timing, and cost estimates
- **AI Expense Insights**: Real-time spending analysis with smart recommendations and budget alerts
- **Smart Recommendations**: AI-powered tips on attractions, restaurants, and activities

### 📅 Trip Planning & Itinerary
- **Interactive Itinerary Builder**: Drag-and-drop interface to organize your daily activities
- **Day-by-Day Planning**: Organize activities by date with start/end times
- **Activity Management**: Add, edit, and reorder activities with location and cost tracking
- **Customizable Plans**: Easy customization of AI-generated itineraries

### 💰 Expense Tracking & Budget
- **Quick Expense Entry**: Fast, mobile-optimized expense recording during trips
- **Receipt Upload**: Attach receipt photos to expenses for record-keeping
- **Category Budgeting**: Set and track budgets across 6 categories
- **Real-time Analytics**: Visual charts and spending breakdowns
- **Currency Support**: Multi-currency expenses with conversion support

### 🌍 Travel Features
- **Multi-User Support**: Separate accounts with shared trip visibility
- **Location Tracking**: Track where expenses occurred
- **Budget Alerts**: Get notified when approaching budget limits
- **Trip Dashboard**: Overview of all trips with spending status

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite with Prisma ORM
- **Authentication**: NextAuth.js v5 (Auth.js)
- **AI**: Anthropic Claude API (Claude 3.5 Sonnet)
- **UI Components**:
  - Drag-and-Drop: @dnd-kit
  - Charts: Recharts
  - File Upload: UploadThing
- **APIs**:
  - Currency Conversion: ExchangeRate-API
  - Date Handling: date-fns

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Anthropic API key (get one at [console.anthropic.com](https://console.anthropic.com))
- (Optional) UploadThing account for receipt uploads
- (Optional) ExchangeRate-API key for live currency rates

### Installation

1. Clone the repository and install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env`:
```bash
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-key-change-this-in-production"
NEXTAUTH_URL="http://localhost:3002"

# Required for AI features
ANTHROPIC_API_KEY="your-anthropic-api-key"

# Optional: For receipt uploads
UPLOADTHING_SECRET="your-uploadthing-secret"
UPLOADTHING_APP_ID="your-uploadthing-app-id"

# Optional: For live currency rates (fallback rates work without this)
EXCHANGE_RATE_API_KEY="your-exchange-rate-api-key"
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

1. **Get AI Destination Ideas**: Click "AI Destination Ideas" on the new trip page for personalized suggestions
2. **Create Trip**: Fill in trip details, dates, and budget
3. **Set Category Budgets**: Allocate your budget across different expense categories

### Building Your Itinerary

1. **Generate AI Itinerary**: Click "AI Generate Itinerary" on the Itinerary tab
2. **Customize Activities**: Drag and drop to reorder, edit details, or add custom activities
3. **View by Day**: See your activities organized by date with timing and locations

### Tracking Expenses

1. **Add Expenses**: Quick entry form on the Budget tab
2. **Upload Receipts**: Attach receipt photos to expenses
3. **Track Location**: Record where each expense occurred
4. **Multi-Currency**: Add expenses in different currencies

### Getting Insights

1. **AI Analysis**: Click "Analyze Spending" for AI-powered insights
2. **View Charts**: Visual breakdown of spending by category
3. **Budget Alerts**: Get warnings when approaching limits
4. **Daily Budget**: See how much you can spend per remaining day

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── ai/                    # AI endpoints
│   │   │   ├── generate-itinerary/  # AI itinerary generation
│   │   │   ├── analyze-expenses/    # AI expense analysis
│   │   │   └── suggest-destinations/# AI destination suggestions
│   │   ├── activities/            # Activity CRUD
│   │   ├── currency/              # Currency conversion
│   │   ├── uploadthing/           # File upload handler
│   │   ├── expenses/              # Expense tracking
│   │   └── trips/                 # Trip management
│   ├── trips/
│   │   ├── [id]/                  # Trip detail page
│   │   └── new/                   # New trip page
│   └── page.tsx                   # Dashboard
├── components/
│   ├── TripTabs.tsx              # Tab navigation
│   ├── ItineraryView.tsx         # Itinerary builder
│   ├── ExpenseInsights.tsx       # AI insights display
│   ├── ExpenseForm.tsx           # Expense entry form
│   └── ...
├── lib/
│   ├── ai.ts                     # AI service layer
│   ├── auth.ts                   # NextAuth config
│   ├── prisma.ts                 # Prisma client
│   └── uploadthing.ts            # Upload helpers
└── prisma/
    └── schema.prisma             # Database schema
```

## Database Schema

- **User**: User accounts with preferences
- **Trip**: Travel trips with budget and metadata
- **BudgetCategory**: Budget allocations by category
- **Expense**: Expense records with receipts and location
- **Activity**: Itinerary activities with timing and costs
- **Place**: Saved places and attractions
- **UserPreference**: User settings and preferences

## Development

- `npm run dev` - Start development server on port 3002
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run seed` - Seed database with initial users
- `npx prisma studio` - Open Prisma Studio to view/edit database
- `npx prisma db push` - Push schema changes to database

## API Endpoints

### AI Endpoints
- `POST /api/ai/generate-itinerary` - Generate AI itinerary
- `POST /api/ai/analyze-expenses` - Get spending insights
- `POST /api/ai/suggest-destinations` - Get destination ideas

### Data Endpoints
- `GET/POST /api/trips` - Trip management
- `GET/POST /api/activities` - Activity management
- `PATCH/DELETE /api/activities/[id]` - Update/delete activity
- `POST /api/activities/reorder` - Reorder activities
- `GET/POST /api/expenses` - Expense tracking
- `POST /api/currency/convert` - Currency conversion
- `GET /api/currency/convert?base=USD` - Get exchange rates

## Key Features Explained

### AI Itinerary Generation
The AI analyzes your destination, dates, budget, and interests to create a personalized day-by-day itinerary with:
- Specific activities and attractions
- Recommended timing (start/end times)
- Cost estimates per activity
- Mix of popular spots and hidden gems
- Balanced pacing with rest time

### Expense Insights
AI-powered analysis provides:
- Spending pattern detection
- Budget overspend warnings
- Category-specific recommendations
- Daily budget calculations
- Personalized saving tips

### Drag-and-Drop Itinerary
Built with @dnd-kit for smooth, accessible drag-and-drop:
- Reorder activities within a day
- Visual feedback while dragging
- Automatic save on drop
- Keyboard navigation support

## Notes

- The app uses **fallback exchange rates** if no API key is provided
- **UploadThing** is optional - the app works without receipt uploads
- All AI features require an **Anthropic API key**
- Perfect for **personal use** - optimized for 2 users (you and your wife)

## Future Enhancements

- Map visualization for itinerary locations
- Shared trip collaboration features
- Export trip data to PDF
- Mobile PWA version
- Push notifications for budget alerts
- Trip templates for popular destinations
- Weather integration
- Flight and hotel tracking
