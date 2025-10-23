# 🚀 TravelAI Deployment Guide

This guide will help you deploy your TravelAI app to production with persistent data storage.

## ✅ What's Been Prepared

Your app is now ready for PostgreSQL deployment:
- ✅ Prisma schema updated to PostgreSQL
- ✅ PostgreSQL dependencies installed
- ✅ Build scripts configured
- ✅ Environment variables documented

---

## 📋 Deployment Steps (15 minutes)

### Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Create a new repository (e.g., "travel-planner")
3. Don't initialize with README (we already have code)

4. In your terminal, run:
```bash
cd /Users/juxaxis/code/myApp
git init
git add .
git commit -m "Initial commit - TravelAI app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

---

### Step 2: Create Free PostgreSQL Database (Neon)

1. Go to https://neon.tech
2. Sign up with GitHub (it's free)
3. Click "Create a project"
   - Name: `travelai-db`
   - Region: Choose closest to you
4. Copy the connection string that looks like:
   ```
   postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
5. Save this - you'll need it in Step 4!

**Free Tier Includes**:
- 0.5 GB storage (plenty for personal use)
- 1 project
- Always-on database

---

### Step 3: Deploy to Vercel

1. Go to https://vercel.com
2. Sign up with GitHub
3. Click "Add New..." → "Project"
4. Import your GitHub repository
5. **DON'T click Deploy yet!** Go to Step 4 first.

---

### Step 4: Configure Environment Variables

In Vercel, before deploying:

1. Click "Environment Variables"
2. Add these variables one by one:

| Name | Value | Notes |
|------|-------|-------|
| `DATABASE_URL` | `postgresql://...` | Paste from Neon (Step 2) |
| `NEXTAUTH_SECRET` | Generate with: `openssl rand -base64 32` | Or use any random 32+ char string |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | Will be shown after first deploy |
| `OPENAI_API_KEY` | `sk-proj-...` | Your OpenAI API key |

3. Click "Deploy"

---

### Step 5: Run Database Migration

After your first deployment succeeds:

1. In Vercel, go to your project
2. Click "Settings" → "Functions" → "Console"
3. Or use Vercel CLI:

```bash
npm install -g vercel
vercel login
vercel link
vercel env pull .env.production
```

4. Run migration on production:
```bash
npx prisma migrate deploy
```

Or manually in Neon dashboard → SQL Editor:
- Copy your schema and create tables manually

---

### Step 6: Create Your Accounts

#### Option A: Via Script (Easiest)
1. Update `scripts/update-users.ts` with DATABASE_URL from production
2. Run: `DATABASE_URL="postgresql://..." npx tsx scripts/update-users.ts`

#### Option B: Via Prisma Studio
1. Run: `DATABASE_URL="postgresql://..." npx prisma studio`
2. Manually create users in the GUI

#### Option C: Via Sign-up Page
Just use the app's sign-up flow!

---

### Step 7: Update NEXTAUTH_URL

After first deployment, Vercel gives you a URL like `https://travel-planner-abc123.vercel.app`

1. Go to Vercel → Your Project → Settings → Environment Variables
2. Update `NEXTAUTH_URL` to your actual URL
3. Redeploy (click "Deployments" → "..." → "Redeploy")

---

## 🎉 Done! Your App is Live

Your app is now:
- ✅ Deployed and accessible 24/7
- ✅ Using persistent PostgreSQL database
- ✅ Auto-deploys when you push to GitHub
- ✅ Free tier (no credit card needed initially)

Access your app at: `https://your-app.vercel.app`

---

## 💾 Local Development with PostgreSQL

If you want to use PostgreSQL locally too (optional):

### Option 1: Docker (Easiest)
```bash
docker run --name travelai-postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres
```

Then update your local `.env`:
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/travelai"
```

### Option 2: Use Neon for Development
Just use the same Neon database URL locally. It's free and always available!

---

## 🔧 Common Issues

### Issue: "Can't connect to database"
- Check DATABASE_URL is correct
- Ensure `?sslmode=require` is at the end of Neon URL
- Verify Neon database is active (free tier never sleeps)

### Issue: "prisma generate failed"
- Make sure `postinstall` script is in package.json
- Vercel should auto-run this

### Issue: "Login doesn't work"
- Check NEXTAUTH_URL matches your deployed URL
- Verify NEXTAUTH_SECRET is set
- Clear browser cookies and try again

---

## 💰 Costs

**Total Monthly Cost: $0** (free tier)

- Vercel: Free (100GB bandwidth, unlimited deployments)
- Neon PostgreSQL: Free (0.5GB storage, 1 project)
- GitHub: Free (unlimited public repos)

**When you might need to upgrade**:
- Vercel: If you get >100GB traffic/month (~$20/month Pro)
- Neon: If you need >0.5GB storage (~$19/month Scale)

For personal use, you'll likely never hit these limits!

---

## 🔄 Making Updates

After deployment, to update your app:

1. Make changes locally
2. Test with `npm run dev`
3. Commit and push:
```bash
git add .
git commit -m "Your update description"
git push
```
4. Vercel automatically deploys! (takes ~2 minutes)

---

## 📊 Monitoring

**Vercel Dashboard**:
- See deployments, logs, analytics
- Monitor API usage
- Check function execution times

**Neon Dashboard**:
- View database size
- See connection stats
- Run SQL queries directly

---

## 🆘 Need Help?

1. Check Vercel logs: Project → Deployments → Click deployment → "Building" or "Runtime Logs"
2. Check Neon connection: Neon Dashboard → Operations tab
3. Test locally first with same DATABASE_URL

---

## 🎯 Next Steps (Optional)

1. **Custom Domain**: Add your own domain in Vercel (free)
2. **Database Backups**: Neon has automatic backups, but you can export manually
3. **Monitoring**: Add Sentry for error tracking
4. **Analytics**: Vercel includes built-in analytics

Enjoy your deployed TravelAI app! 🎉✈️
