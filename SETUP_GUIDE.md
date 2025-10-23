# Quick Setup Guide

This guide will help you get your AI-powered travel planner up and running in minutes.

## Step 1: Get Your API Keys

### Anthropic API Key (Required for AI features)
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up or log in
3. Click "Get API Keys" or navigate to API Keys section
4. Create a new key
5. Copy the key (starts with `sk-ant-...`)

### UploadThing (Optional - for receipt uploads)
1. Go to [uploadthing.com](https://uploadthing.com)
2. Sign up for free
3. Create a new app
4. Copy your App ID and Secret

### ExchangeRate API (Optional - for live currency rates)
1. Go to [exchangerate-api.com](https://www.exchangerate-api.com)
2. Sign up for free tier (1,500 requests/month)
3. Copy your API key

## Step 2: Set Up Your Environment

1. Copy `.env` file and fill in your keys:

```bash
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="generate-a-random-secret-here"
NEXTAUTH_URL="http://localhost:3002"

# REQUIRED: Get from console.anthropic.com
ANTHROPIC_API_KEY="sk-ant-your-key-here"

# OPTIONAL: Get from uploadthing.com
UPLOADTHING_SECRET="sk_live_your-secret"
UPLOADTHING_APP_ID="your-app-id"

# OPTIONAL: Get from exchangerate-api.com
EXCHANGE_RATE_API_KEY="your-key-here"
```

2. Generate a secure secret for NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

## Step 3: Initialize the Database

```bash
# Install dependencies
npm install

# Create database and tables
npx prisma db push

# Create initial user accounts
npm run seed
```

## Step 4: Start the App

```bash
npm run dev
```

Open [http://localhost:3002](http://localhost:3002) in your browser.

## Step 5: Log In

Use one of the seeded accounts:

**Your Account:**
- Email: `you@example.com`
- Password: `password123`

**Your Wife's Account:**
- Email: `wife@example.com`
- Password: `password123`

## Step 6: Create Your First Trip

1. Click **"Plan New Trip"**
2. Click **"✨ AI Destination Ideas"** to get suggestions
3. Fill in trip details
4. Set your budget and category allocations
5. Click **"Create Trip"**

## Step 7: Build Your Itinerary

1. Open your trip
2. Click the **"📅 Itinerary"** tab
3. Click **"✨ AI Generate Itinerary"**
4. Wait for AI to create your day-by-day plan
5. Drag and drop to reorder activities
6. Edit or delete activities as needed

## Step 8: Track Expenses

1. Go to the **"💰 Budget & Expenses"** tab
2. Click **"Add Expense"**
3. Fill in details
4. (Optional) Upload a receipt photo
5. Click **"Add Expense"**

## Step 9: Get AI Insights

1. After adding some expenses, click **"✨ Analyze Spending"**
2. Review AI-powered insights and recommendations
3. Adjust your spending based on suggestions

## Tips

- **No API keys?** The app will work but AI features will be disabled
- **Fallback rates**: Currency conversion works without API key using static rates
- **Receipt uploads**: Works without UploadThing but you won't be able to upload photos
- **Mobile-friendly**: Use on your phone during trips for quick expense entry

## Troubleshooting

### AI features not working
- Check that `ANTHROPIC_API_KEY` is set correctly in `.env`
- Restart the dev server after adding the key
- Check the console for API errors

### Receipt upload fails
- Verify `UPLOADTHING_SECRET` and `UPLOADTHING_APP_ID` are correct
- Make sure you've created an app on uploadthing.com
- Check file size is under 4MB

### Database errors
- Run `npx prisma db push` again
- Delete `prisma/dev.db` and run setup again
- Check `DATABASE_URL` in `.env`

## Next Steps

- **Customize categories**: Edit `CATEGORIES` array in code
- **Change port**: Update `NEXTAUTH_URL` in `.env` and package.json dev script
- **Deploy**: Deploy to Vercel, Railway, or your preferred host
- **Backup**: Regularly backup your `prisma/dev.db` file

## Support

For issues or questions:
1. Check the main [README.md](README.md)
2. Review the code in `lib/ai.ts` for AI features
3. Look at API routes in `app/api/` for endpoints

Enjoy your AI-powered travel planning! 🌍✈️
