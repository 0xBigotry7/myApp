# Google Maps Places API Setup

This app uses Google Maps Places Autocomplete API to provide smart location suggestions when adding transportation expenses.

## Setup Instructions

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Select or Create a Project**
   - Use the same project you created for Google Drive API
   - Or create a new project if needed

3. **Enable Places API**
   - Go to: https://console.cloud.google.com/apis/library/places-backend.googleapis.com
   - Click "Enable"

4. **Create API Key**
   - Go to: https://console.cloud.google.com/apis/credentials
   - Click "Create Credentials" → "API Key"
   - Copy the API key

5. **Restrict the API Key (Recommended)**
   - Click on the API key you just created
   - Under "Application restrictions":
     - Select "HTTP referrers (web sites)"
     - Add: `http://localhost:3002/*` (for development)
     - Add your production domain: `https://yourdomain.com/*`
   - Under "API restrictions":
     - Select "Restrict key"
     - Check "Places API"
   - Click "Save"

6. **Add to Environment Variables**
   - Open your `.env` file
   - Update the line:
     ```
     NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-actual-api-key-here"
     ```

7. **Restart Development Server**
   ```bash
   npm run dev
   ```

## Features

Once configured, the location autocomplete will work for:
- Transportation "From" and "To" locations in the "Add to Timeline" modal
- Editing existing transportation expenses with location fields

The autocomplete suggests:
- Cities and addresses
- Airports
- Train stations
- Transit stations
- Popular establishments

## Pricing

Google Maps Places API has a free tier:
- $200 monthly credit (covers ~28,000 requests)
- Places Autocomplete: ~$2.83 per 1000 requests

For personal use, this should be well within the free tier.

## Troubleshooting

If autocomplete isn't working:
1. Check that the API key is correct in `.env`
2. Make sure Places API is enabled in Google Cloud Console
3. Check browser console for any error messages
4. Verify API key restrictions allow your domain
5. Make sure you've restarted the dev server after changing `.env`
