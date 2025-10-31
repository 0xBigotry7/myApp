# TravelAI - Troubleshooting Guide

Common issues and solutions for TravelAI.

---

## 🔐 Authentication Issues

### Cannot Login / "Invalid credentials" error

**Symptoms**:
- Login fails with valid credentials
- "Invalid credentials" message appears

**Solutions**:
1. **Check if users exist**:
   ```bash
   npx prisma studio
   ```
   - Open User table
   - Verify users exist

2. **Re-seed database**:
   ```bash
   npm run seed
   ```

3. **Check NEXTAUTH_SECRET**:
   - Ensure `.env` has `NEXTAUTH_SECRET` set
   - Generate new secret:
     ```bash
     openssl rand -base64 32
     ```

4. **Verify NEXTAUTH_URL**:
   - Should be `http://localhost:3002` for local dev
   - Update in `.env` if different

---

### Session Expires Immediately

**Symptoms**:
- Logged in but immediately logged out
- Redirected to login page repeatedly

**Solutions**:
1. **Clear cookies**:
   - Clear browser cookies for localhost:3002
   - Try incognito/private mode

2. **Check NextAuth configuration**:
   ```typescript
   // lib/auth.ts
   session: {
     strategy: "jwt",
     maxAge: 30 * 24 * 60 * 60, // 30 days
   }
   ```

3. **Restart dev server**:
   ```bash
   # Kill server (Ctrl+C)
   npm run dev
   ```

---

## 📸 Photo Upload Issues

### "Google Drive not connected" Error

**Symptoms**:
- Cannot upload photos
- Error message about Google Drive

**Solutions**:
1. **Connect Google Drive**:
   - Go to Settings
   - Click "Connect Google Drive"
   - Complete OAuth flow

2. **Check Google OAuth credentials**:
   - Verify `.env` has:
     ```
     GOOGLE_CLIENT_ID="...apps.googleusercontent.com"
     GOOGLE_CLIENT_SECRET="GOCSPX-..."
     GOOGLE_REDIRECT_URI="http://localhost:3002/api/auth/google-drive/callback"
     ```

3. **Re-authorize**:
   - Settings → Disconnect Google Drive
   - Reconnect again

4. **Check Google Cloud Console**:
   - Ensure Drive API is enabled
   - Verify OAuth consent screen is configured
   - Check authorized redirect URIs include your callback URL

---

### Photos Not Displaying

**Symptoms**:
- Photos uploaded successfully but don't show
- Broken image icons
- CORS errors in console

**Solutions**:
1. **Check image proxy**:
   - Photos should load through `/api/image-proxy?url=...`
   - Check browser console for errors

2. **Verify Drive permissions**:
   - Go to Google Drive
   - Check "Travel App Photos" folder exists
   - Verify photos are there

3. **Refresh tokens**:
   - Disconnect and reconnect Google Drive
   - Uploads new refresh token

4. **Check photo URLs**:
   - URLs should start with `https://drive.google.com/`
   - Not local file paths

---

## 🤖 AI Features Issues

### Receipt Scanning Not Working

**Symptoms**:
- "Failed to scan receipt" error
- No data extracted from receipt

**Solutions**:
1. **Check Groq API key**:
   ```bash
   # In .env
   GROQ_API_KEY="gsk_..."
   ```
   - Get free key at [console.groq.com](https://console.groq.com)

2. **Image quality**:
   - Ensure receipt is clear and readable
   - Good lighting, no shadows
   - Receipt fully visible in frame
   - Try different image format (JPEG, PNG)

3. **Check API quota**:
   - Groq has generous free tier
   - Check console.groq.com for usage

4. **Try manual entry**:
   - If scan fails, manually enter data
   - Report issue if persistent

---

### Trip Image Generation Fails

**Symptoms**:
- Cannot generate trip cover image
- DALL-E error

**Solutions**:
1. **Check OpenAI API key**:
   ```bash
   # In .env
   OPENAI_API_KEY="sk-..."
   ```
   - Get key at [platform.openai.com](https://platform.openai.com)

2. **Check API credits**:
   - DALL-E 3 requires credits
   - Add payment method at OpenAI

3. **Use custom image**:
   - Upload your own trip image instead
   - Skip AI generation

---

## 🗺️ Map Issues

### Map Not Loading

**Symptoms**:
- Blank map area
- Map doesn't render

**Solutions**:
1. **Check console errors**:
   - Open browser DevTools
   - Look for JavaScript errors

2. **Verify react-simple-maps**:
   ```bash
   npm list react-simple-maps
   ```
   - Reinstall if needed:
     ```bash
     npm install react-simple-maps
     ```

3. **Clear cache**:
   - Hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
   - Clear browser cache

---

### Cities Not Found in Database

**Symptoms**:
- City you want not in dropdown

**Solutions**:
1. **Use custom entry**:
   - Type city name manually
   - Add coordinates from Google Maps

2. **Add to database**:
   - Edit `components/AddDestinationFormSmart.tsx`
   - Add city to appropriate region array:
     ```typescript
     { city: "Your City", country: "Country", countryCode: "CC", latitude: 0, longitude: 0 }
     ```

---

## 💰 Expense Tracking Issues

### Tip Calculator Not Showing

**Symptoms**:
- No tip buttons for food expenses

**Solutions**:
1. **Check category name**:
   - Must contain "food", "dining", or "restaurant" (case-insensitive)
   - Try different category names

2. **Refresh form**:
   - Re-select category
   - Check amount is entered

---

### Currency Conversion Fails

**Symptoms**:
- Expenses show wrong amounts
- Conversion errors

**Solutions**:
1. **Check internet connection**:
   - Currency API requires internet

2. **Fallback rates**:
   - App uses fallback rates if API unavailable
   - May be slightly outdated

3. **Manual conversion**:
   - Convert manually if needed
   - Enter amount in trip base currency

---

## 🗄️ Database Issues

### "PrismaClientInitializationError"

**Symptoms**:
- Cannot connect to database
- Prisma errors on startup

**Solutions**:
1. **Check DATABASE_URL**:
   ```bash
   # In .env
   DATABASE_URL="postgresql://user:password@host/database"
   ```

2. **Test connection**:
   ```bash
   npx prisma db push
   ```

3. **Regenerate Prisma Client**:
   ```bash
   npx prisma generate
   ```

4. **Check Neon dashboard**:
   - Verify database is running
   - Check connection string is correct

---

### Schema Out of Sync

**Symptoms**:
- "Column does not exist" errors
- Missing tables or fields

**Solutions**:
1. **Push schema changes**:
   ```bash
   npx prisma db push
   ```

2. **Reset database** (⚠️ DESTROYS DATA):
   ```bash
   npx prisma migrate reset
   npm run seed
   ```

3. **Check migrations**:
   ```bash
   npx prisma migrate status
   ```

---

## 🚀 Build & Deployment Issues

### TypeScript Errors on Build

**Symptoms**:
- `npm run build` fails
- Type errors in console

**Solutions**:
1. **Regenerate Prisma types**:
   ```bash
   npx prisma generate
   ```

2. **Clean build**:
   ```bash
   rm -rf .next
   npm run build
   ```

3. **Check TypeScript config**:
   - Verify `tsconfig.json` is correct
   - Check for type errors in code

---

### Environment Variables Not Loading

**Symptoms**:
- "undefined" errors for env vars
- Features not working in production

**Solutions**:
1. **Check .env file**:
   - Verify all required vars are set
   - No spaces around `=`
   - Strings don't need quotes

2. **Restart server**:
   ```bash
   # Kill and restart
   npm run dev
   ```

3. **Production env vars**:
   - Set in Vercel dashboard
   - Or hosting platform settings

4. **Verify variable names**:
   - Next.js only exposes vars starting with `NEXT_PUBLIC_` to client
   - Server-only vars don't need prefix

---

## 🌐 API Issues

### API Route Returns 401 Unauthorized

**Symptoms**:
- API calls fail with 401
- Not authenticated errors

**Solutions**:
1. **Check session**:
   - Ensure user is logged in
   - Session cookie exists

2. **Verify middleware**:
   ```typescript
   // middleware.ts should protect routes
   export { auth as middleware } from "@/lib/auth"
   ```

3. **Clear cookies and re-login**:
   - Clear browser cookies
   - Login again

---

### API Rate Limiting

**Symptoms**:
- "Too many requests" errors
- 429 status codes

**Solutions**:
1. **Groq API**:
   - Free tier: 30 requests/min
   - Upgrade if needed at console.groq.com

2. **OpenAI API**:
   - Check rate limits at platform.openai.com
   - Upgrade tier if needed

3. **Wait and retry**:
   - Wait a minute
   - Try request again

---

## 🏦 Bank Sync Issues (Plaid/Wise)

### Cannot Link Bank Account

**Symptoms**:
- Plaid Link fails
- Authorization errors

**Solutions**:
1. **Check Plaid credentials**:
   ```bash
   # In .env
   PLAID_CLIENT_ID="..."
   PLAID_SECRET="..."
   PLAID_ENV="sandbox"
   ```

2. **Use sandbox mode**:
   - For testing, use `PLAID_ENV="sandbox"`
   - Use test credentials from Plaid docs

3. **Production mode**:
   - Get production credentials
   - Set `PLAID_ENV="production"`

---

## 🔧 General Debugging

### Check Logs

**Browser Console**:
```
Right-click → Inspect → Console
```
- Look for red errors
- Check network tab for failed requests

**Server Logs**:
```bash
# Terminal running npm run dev
# Look for error messages
```

---

### Clear Everything and Start Fresh

**Nuclear option** (⚠️ DESTROYS DATA):
```bash
# 1. Stop server
# 2. Clear Next.js cache
rm -rf .next

# 3. Reset database
npx prisma migrate reset

# 4. Regenerate Prisma
npx prisma generate

# 5. Seed database
npm run seed

# 6. Restart
npm run dev
```

---

## 📞 Still Having Issues?

1. **Check documentation**:
   - [README.md](README.md) - Setup guide
   - [SETUP_GUIDE.md](SETUP_GUIDE.md) - Detailed setup
   - [FEATURES.md](FEATURES.md) - Feature descriptions
   - [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - API reference

2. **Check environment setup**:
   - Compare `.env` with `.env.example`
   - Ensure all required vars are set

3. **Check dependencies**:
   ```bash
   npm install
   ```

4. **Check Node version**:
   ```bash
   node --version  # Should be 18+
   ```

5. **Search error message**:
   - Copy exact error message
   - Search in GitHub issues
   - Search on Stack Overflow

---

## 🐛 Common Error Messages

| Error | Meaning | Solution |
|-------|---------|----------|
| `PrismaClientKnownRequestError` | Database query failed | Check database connection |
| `NEXT_NOT_FOUND` | Route/resource not found | Check URL/ID is correct |
| `ECONNREFUSED` | Cannot connect to service | Check service is running |
| `401 Unauthorized` | Not logged in | Login again |
| `403 Forbidden` | No permission | Check user owns resource |
| `500 Internal Server Error` | Server error | Check server logs |

---

**Last Updated**: October 31, 2025

**Need more help?** Open an issue on GitHub with:
- Error message (full text)
- What you were trying to do
- Steps to reproduce
- Environment (OS, Node version, etc.)
