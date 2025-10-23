# Launch Checklist

Use this checklist before starting your AI Travel Planner for the first time.

## Pre-Launch Checklist

### 1. API Keys Setup ✓

- [ ] **Anthropic API Key** (Required)
  - Go to [console.anthropic.com](https://console.anthropic.com)
  - Create account / Sign in
  - Generate API key
  - Add to `.env` as `ANTHROPIC_API_KEY`

- [ ] **UploadThing** (Optional - for receipt uploads)
  - Go to [uploadthing.com](https://uploadthing.com)
  - Create free account
  - Create new app
  - Copy App ID and Secret
  - Add to `.env` as `UPLOADTHING_SECRET` and `UPLOADTHING_APP_ID`
  - *Skip this if you don't need receipt uploads*

- [ ] **ExchangeRate API** (Optional - for live currency rates)
  - Go to [exchangerate-api.com](https://www.exchangerate-api.com)
  - Sign up for free tier
  - Copy API key
  - Add to `.env` as `EXCHANGE_RATE_API_KEY`
  - *Skip this - fallback rates will work*

### 2. Environment Setup ✓

- [ ] Check `.env` file exists
- [ ] Verify all required keys are added
- [ ] Generate secure `NEXTAUTH_SECRET` (run: `openssl rand -base64 32`)
- [ ] Confirm `NEXTAUTH_URL="http://localhost:3002"`
- [ ] Confirm `DATABASE_URL="file:./dev.db"`

### 3. Database Setup ✓

```bash
# Run these commands in order:

# 1. Install dependencies
npm install

# 2. Create database and apply schema
npx prisma db push

# 3. Create initial user accounts
npm run seed
```

- [ ] Dependencies installed
- [ ] Database created (`prisma/dev.db` exists)
- [ ] Schema applied (no errors)
- [ ] Users seeded successfully

### 4. Verify Installation ✓

```bash
# Optional: Check database
npx prisma studio
# Opens browser at localhost:5555 to view data
```

- [ ] Can access Prisma Studio
- [ ] See 2 users in database
- [ ] No errors in terminal

### 5. Start the App ✓

```bash
npm run dev
```

- [ ] Dev server starts without errors
- [ ] Opens at http://localhost:3002
- [ ] No compilation errors in terminal

### 6. First Login ✓

- [ ] Navigate to http://localhost:3002
- [ ] Login page appears
- [ ] Try logging in with:
  - Email: `you@example.com`
  - Password: `password123`
- [ ] Successfully redirected to dashboard

### 7. Test Core Features ✓

#### Test Trip Creation
- [ ] Click "Plan New Trip"
- [ ] Click "✨ AI Destination Ideas" (verify AI working)
- [ ] Fill in trip details
- [ ] Create trip successfully

#### Test Itinerary
- [ ] Open created trip
- [ ] Go to "📅 Itinerary" tab
- [ ] Click "✨ AI Generate Itinerary"
- [ ] Wait for AI to generate activities
- [ ] Verify activities appear
- [ ] Try dragging an activity to reorder

#### Test Expenses
- [ ] Go to "💰 Budget & Expenses" tab
- [ ] Click "Add Expense"
- [ ] Fill in expense details
- [ ] (Optional) Upload a receipt photo
- [ ] Add expense successfully
- [ ] Click "✨ Analyze Spending"
- [ ] Verify AI insights appear

### 8. Test Second User (Optional) ✓

- [ ] Sign out
- [ ] Login with:
  - Email: `wife@example.com`
  - Password: `password123`
- [ ] Create a trip for second user
- [ ] Add some expenses

## Troubleshooting

### AI Features Not Working
**Problem**: Clicking AI buttons does nothing or shows errors

**Solutions**:
- [ ] Check `.env` has `ANTHROPIC_API_KEY`
- [ ] Verify API key is correct (starts with `sk-ant-`)
- [ ] Restart dev server: Stop (Ctrl+C) and run `npm run dev` again
- [ ] Check console for errors (F12 in browser)
- [ ] Check terminal for API errors

### Receipt Upload Fails
**Problem**: Can't upload receipt photos

**Solutions**:
- [ ] Check `.env` has both `UPLOADTHING_SECRET` and `UPLOADTHING_APP_ID`
- [ ] Verify keys are correct from uploadthing.com dashboard
- [ ] Check file size is under 4MB
- [ ] Restart dev server
- [ ] **Alternative**: Skip receipt uploads (optional feature)

### Database Errors
**Problem**: Errors about database or Prisma

**Solutions**:
- [ ] Delete `prisma/dev.db` file
- [ ] Run `npx prisma db push` again
- [ ] Run `npm run seed` again
- [ ] Restart dev server

### Port Already in Use
**Problem**: Port 3002 is already in use

**Solutions**:
- [ ] Kill process on port 3002: `lsof -ti:3002 | xargs kill`
- [ ] Or change port in `package.json` dev script
- [ ] Update `NEXTAUTH_URL` in `.env` if you change port

### Build Errors
**Problem**: TypeScript or build errors

**Solutions**:
- [ ] Delete `.next` folder
- [ ] Delete `node_modules` folder
- [ ] Run `npm install` again
- [ ] Run `npm run build` to check for errors
- [ ] Check GitHub issues if problem persists

## Quick Command Reference

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run production server
npm run start

# Reset database
rm prisma/dev.db && npx prisma db push && npm run seed

# View database
npx prisma studio

# Check for errors
npm run build
```

## Ready to Launch!

Once all items above are checked, you're ready to use your AI Travel Planner!

**Default Login Credentials:**
- Your Account: `you@example.com` / `password123`
- Wife's Account: `wife@example.com` / `password123`

**Change passwords** by updating the `prisma/seed.ts` file and re-running `npm run seed`.

## Post-Launch Tasks

- [ ] Change default passwords in seed file
- [ ] Add your real names in seed file
- [ ] Update email addresses in seed file
- [ ] Customize budget categories (optional)
- [ ] Test on mobile device
- [ ] Bookmark http://localhost:3002

## Need Help?

1. Check [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed instructions
2. Check [README.md](README.md) for full documentation
3. Check [FEATURES.md](FEATURES.md) for feature explanations
4. Check browser console (F12) for errors
5. Check terminal for server errors

---

**Happy Travels! 🌍✈️**
