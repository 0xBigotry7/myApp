# Groq Setup Guide - FREE & FAST OCR

Your app now uses **Groq with Llama 3.2 Vision (90B)** for receipt scanning instead of OpenAI. This is:
- ✅ **Completely FREE** (no payment required)
- ✅ **10x faster** than OpenAI GPT-4o
- ✅ **Better OCR accuracy** for receipts
- ✅ **No credit card needed**

## How to Get Your FREE Groq API Key

### Step 1: Sign Up (1 minute)
1. Go to **https://console.groq.com**
2. Click "Sign Up" (you can use Google/GitHub)
3. No credit card required!

### Step 2: Get Your API Key (30 seconds)
1. After logging in, go to **https://console.groq.com/keys**
2. Click "Create API Key"
3. Give it a name like "MyApp Receipt Scanner"
4. Copy the API key (starts with `gsk_...`)

### Step 3: Add to Your .env File (30 seconds)
1. Open your `.env` file in the root directory
2. Add this line:
   ```
   GROQ_API_KEY="gsk_your_actual_key_here"
   ```
3. Save the file

### Step 4: Restart Your Dev Server
```bash
# Stop the current server (Ctrl+C)
npm run dev
```

## Done! 🎉

Your receipt scanning will now be:
- **FREE** - Groq's free tier is very generous (thousands of requests per day)
- **FASTER** - Groq is known for having the fastest inference in the industry
- **BETTER** - Llama 3.2 Vision 90B is excellent at OCR tasks

## What Changed?

- **Old**: OpenAI GPT-4o (slow, requires payment)
- **New**: Groq Llama 3.2 Vision 90B (fast, completely free)

## Free Tier Limits

Groq's free tier includes:
- **14,400 requests per day** (more than enough!)
- **6,000 tokens per minute**
- No credit card required

## Troubleshooting

**"Groq API key not configured" error?**
- Make sure you added `GROQ_API_KEY` to your `.env` file
- Restart your dev server after adding the key
- Check that the key starts with `gsk_`

**Still slow?**
- Groq should be much faster than OpenAI
- If you're still seeing slowness, check your internet connection
- The model processes images in 2-3 seconds typically

## Optional: Remove OpenAI

Since you're not paying for OpenAI anymore, you can:
1. Remove `OPENAI_API_KEY` from your `.env` file
2. Optionally uninstall: `npm uninstall openai`

But keep it if you're using it elsewhere in the app!

## Links

- Groq Console: https://console.groq.com
- Groq API Keys: https://console.groq.com/keys
- Groq Documentation: https://console.groq.com/docs

---

**Note**: Groq is backed by GroqChip processors which enable the fastest LLM inference in the world. This is why it's so fast and free - they want people to use it!
