# Bank Integration Setup Guide

This guide will help you set up bank connections for your app using Plaid (Bank of America) and Wise API.

## Prerequisites

1. **Plaid Account** (for Bank of America)
   - Sign up at https://dashboard.plaid.com/signup
   - Get your Client ID and Secret keys

2. **Wise API Token** (for Wise account)
   - Log in to Wise: https://wise.com
   - Go to Settings → API tokens: https://wise.com/settings/personal-tokens
   - Create a new token with "Read" permissions

## Environment Variables

Add the following variables to your `.env` file:

```bash
# Plaid Configuration
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_sandbox_secret
PLAID_ENV=sandbox  # Use 'production' for live data

# Wise Configuration (optional - users can enter their token in the UI)
WISE_ENV=sandbox  # Use 'production' for live data

# Existing variables (make sure these are set)
DATABASE_URL=your_database_url
NEXTAUTH_URL=http://localhost:3002
NEXTAUTH_SECRET=your_nextauth_secret
```

## Setup Steps

### 1. Get Plaid Credentials

1. Sign up for Plaid at https://dashboard.plaid.com/signup
2. After signing up, you'll be in Sandbox mode (free for development)
3. Go to Keys → Copy your Client ID and Sandbox Secret
4. Add them to your `.env` file

**Plaid Sandbox Mode:**
- Free for development and testing
- Uses test credentials to simulate bank connections
- Test credentials: https://plaid.com/docs/sandbox/test-credentials/

**Plaid Development/Production:**
- After testing, apply for Development access (free for up to 100 items)
- For production, pricing starts at $0.25 per item/month
- More info: https://plaid.com/pricing/

### 2. Get Wise API Token

1. Log in to your Wise account: https://wise.com
2. Go to Settings → API tokens: https://wise.com/settings/personal-tokens
3. Click "Add a new token"
4. Give it a name (e.g., "MyApp Finance Tracker")
5. Select permissions: **Read only** (sufficient for transaction sync)
6. Copy the token (you won't be able to see it again!)
7. Keep it safe - you'll enter it in the app UI when connecting

**Note:** Wise API tokens are personal and should not be shared. Each user needs their own token.

### 3. Update Database Schema

Run the following command to update your database with the new bank connection tables:

```bash
npx prisma db push
```

If that fails due to network issues, try:

```bash
PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma db push
```

Then regenerate the Prisma client:

```bash
npx prisma generate
```

### 4. Start Your App

```bash
npm run dev
```

Visit http://localhost:3002/finance/banks to manage your bank connections.

## Using Bank Connections

### Connecting Bank of America (via Plaid)

1. Navigate to `/finance/banks`
2. Click "Connect Bank of America"
3. In Sandbox mode, use these test credentials:
   - Username: `user_good`
   - Password: `pass_good`
   - MFA: `1234`
4. Select the accounts you want to connect
5. Click "Continue"

Your Bank of America accounts will be connected and transactions will sync automatically!

### Connecting Wise

1. Navigate to `/finance/banks`
2. Click "Connect Wise Account"
3. Enter your Wise API token (from step 2 above)
4. Click "Connect"

Your Wise account will be connected and transactions will sync!

### Syncing Transactions

**Manual Sync:**
- Click "Sync" button next to any connected bank
- Or click "Sync All Banks" to sync all at once

**Automatic Sync:**
You can set up automatic syncing by:
1. Creating a cron job that calls `/api/bank/sync-all`
2. Using Vercel Cron (if deployed on Vercel)
3. Using a service like EasyCron to hit your sync endpoint daily

Example cron job (add to crontab):
```bash
# Sync banks daily at 6 AM
0 6 * * * curl -X POST http://localhost:3002/api/bank/sync-all
```

## Security Notes

⚠️ **Important:** This implementation stores API tokens in plain text in the database. For production use, you should:

1. **Encrypt access tokens** using a library like `@aws-sdk/client-kms` or `crypto`
2. **Add proper error handling** for expired tokens
3. **Implement token refresh** for Plaid (tokens can expire)
4. **Use environment variables** for sensitive data
5. **Enable HTTPS** in production
6. **Set up Plaid webhooks** for real-time transaction updates

## Troubleshooting

### Plaid Link not opening
- Make sure `PLAID_CLIENT_ID` and `PLAID_SECRET` are set in `.env`
- Restart your dev server after adding environment variables
- Check browser console for errors

### Wise connection fails
- Verify your API token is correct
- Make sure token has "Read" permissions
- Check that your Wise account is fully verified

### Transactions not syncing
- Check the "Last synced" timestamp
- Look at server logs for error messages
- Verify your bank connection is still active

### Database errors
- Make sure you ran `npx prisma db push`
- Verify `DATABASE_URL` is set correctly in `.env`

## API Endpoints

- `POST /api/plaid/link-token` - Get Plaid Link token
- `POST /api/plaid/exchange-token` - Exchange public token for access token
- `POST /api/plaid/sync` - Sync Plaid transactions
- `POST /api/wise/connect` - Connect Wise account
- `POST /api/wise/sync` - Sync Wise transactions
- `POST /api/bank/sync-all` - Sync all connected banks
- `GET /api/bank/connections` - Get all bank connections
- `DELETE /api/bank/connections?id=xxx` - Delete a bank connection

## Next Steps

1. Test with Plaid sandbox credentials
2. Connect your actual Bank of America account (in production)
3. Get your Wise API token and connect
4. Set up automatic daily syncing
5. Explore transaction categorization and rules
6. Link transactions to trips for travel expense tracking

## Support

- Plaid Documentation: https://plaid.com/docs/
- Wise API Documentation: https://docs.wise.com/api-docs/
- Plaid Support: https://dashboard.plaid.com/support

## Cost Summary

**Plaid:**
- Sandbox: Free forever
- Development: Free for first 100 items
- Production: $0.25-0.60 per item/month (depending on plan)

**Wise API:**
- Free for personal use
- No fees for reading transaction data

For just 2 users with 3 cards, Plaid's free Development tier should be sufficient!
