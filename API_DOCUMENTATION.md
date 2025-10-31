# TravelAI - API Documentation

Complete API reference for all backend endpoints.

---

## 🔐 Authentication

All API routes (except `/api/auth/*`) require authentication via NextAuth.js session.

**Session Check**:
```typescript
const session = await auth()
if (!session?.user) {
  return new Response('Unauthorized', { status: 401 })
}
```

---

## 🤖 AI Endpoints

### POST /api/ai/scan-receipt

Scan receipt photo and extract expense data using Groq Llama Vision.

**Request Body** (multipart/form-data):
```typescript
{
  image: File // Receipt photo (JPEG, PNG, WebP, GIF)
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "amount": 45.50,
    "currency": "USD",
    "date": "2025-10-31",
    "merchant": "Starbucks Coffee",
    "category": "Food & Dining",
    "description": "Coffee and pastry"
  }
}
```

**Error Response**:
```json
{
  "error": "Failed to scan receipt",
  "details": "Error message here"
}
```

**Implementation**: `app/api/ai/scan-receipt/route.ts`

**Technology**: Groq API with Llama 3.2 Vision (90B)

---

### POST /api/ai/generate-image

Generate trip cover image using OpenAI DALL-E.

**Request Body**:
```json
{
  "destination": "Tokyo, Japan",
  "description": "Cherry blossom season trip"
}
```

**Response**:
```json
{
  "success": true,
  "imageUrl": "https://oaidalleapiprodscus.blob.core.windows.net/..."
}
```

**Implementation**: `app/api/ai/generate-image/route.ts`

**Technology**: OpenAI DALL-E 3

---

## 🗺️ Trip Endpoints

### GET /api/trips

Get all trips for authenticated user's household.

**Query Parameters**: None

**Response**:
```json
{
  "trips": [
    {
      "id": "trip_123",
      "destination": "Tokyo, Japan",
      "startDate": "2025-11-01T00:00:00Z",
      "endDate": "2025-11-07T00:00:00Z",
      "totalBudget": 3000,
      "currency": "USD",
      "imageUrl": "https://...",
      "userId": "user_123",
      "budgetCategories": [...],
      "expenses": [...],
      "createdAt": "2025-10-31T12:00:00Z"
    }
  ]
}
```

---

### POST /api/trips

Create new trip.

**Request Body**:
```json
{
  "destination": "Tokyo, Japan",
  "startDate": "2025-11-01",
  "endDate": "2025-11-07",
  "totalBudget": 3000,
  "currency": "USD",
  "imageUrl": "https://...",
  "budgetCategories": [
    { "name": "Accommodation", "amount": 1000 },
    { "name": "Food & Dining", "amount": 800 },
    { "name": "Transportation", "amount": 500 },
    { "name": "Activities", "amount": 400 },
    { "name": "Shopping", "amount": 200 },
    { "name": "Other", "amount": 100 }
  ]
}
```

**Response**:
```json
{
  "trip": {
    "id": "trip_123",
    ...
  }
}
```

---

### GET /api/trips/[id]

Get single trip by ID.

**Response**: Same as trip object in GET /api/trips

---

### PATCH /api/trips/[id]

Update trip details.

**Request Body**: Partial trip object (only fields to update)

**Response**: Updated trip object

---

### DELETE /api/trips/[id]

Delete trip (cascades to expenses, posts, etc.).

**Response**:
```json
{
  "success": true,
  "message": "Trip deleted successfully"
}
```

---

### GET /api/trips/[id]/posts

Get all trip posts (photos, notes, check-ins).

**Response**:
```json
{
  "posts": [
    {
      "id": "post_123",
      "tripId": "trip_123",
      "userId": "user_123",
      "type": "photo",
      "content": "Amazing view from Tokyo Tower!",
      "photos": ["https://drive.google.com/..."],
      "location": "Tokyo Tower",
      "latitude": 35.6586,
      "longitude": 139.7454,
      "timestamp": "2025-11-02T14:30:00Z",
      "createdAt": "2025-11-02T15:00:00Z",
      "user": {
        "id": "user_123",
        "email": "you@example.com",
        "name": "You"
      }
    }
  ]
}
```

---

### POST /api/trips/[id]/posts

Create trip post.

**Request Body**:
```json
{
  "type": "photo", // "photo", "note", "checkin"
  "content": "Caption text here",
  "photos": ["https://drive.google.com/file/d/..."],
  "location": "Tokyo Tower",
  "latitude": 35.6586,
  "longitude": 139.7454,
  "timestamp": "2025-11-02T14:30:00Z"
}
```

**Response**: Created post object

---

### GET /api/trips/[id]/timeline

Get combined timeline of expenses and posts, sorted chronologically.

**Response**:
```json
{
  "items": [
    {
      "type": "post",
      "data": { /* post object */ },
      "timestamp": "2025-11-02T14:30:00Z"
    },
    {
      "type": "expense",
      "data": { /* expense object */ },
      "timestamp": "2025-11-02T12:15:00Z"
    }
  ]
}
```

---

## 💰 Expense Endpoints

### GET /api/expenses

Get expenses for a trip.

**Query Parameters**:
- `tripId` (required): Trip ID

**Response**:
```json
{
  "expenses": [
    {
      "id": "exp_123",
      "tripId": "trip_123",
      "userId": "user_123",
      "amount": 25.50,
      "currency": "USD",
      "category": "Food & Dining",
      "date": "2025-11-02T00:00:00Z",
      "location": "Shibuya, Tokyo",
      "notes": "Ramen dinner",
      "receiptUrl": "https://drive.google.com/...",
      "createdAt": "2025-11-02T19:00:00Z",
      "user": {
        "id": "user_123",
        "email": "you@example.com",
        "name": "You"
      }
    }
  ]
}
```

---

### POST /api/expenses

Create new expense.

**Request Body**:
```json
{
  "tripId": "trip_123",
  "amount": 25.50,
  "currency": "USD",
  "category": "Food & Dining",
  "date": "2025-11-02",
  "location": "Shibuya, Tokyo",
  "notes": "Ramen dinner",
  "receiptUrl": "https://drive.google.com/..."
}
```

**Response**: Created expense object

---

### PATCH /api/expenses/[id]

Update expense.

**Request Body**: Partial expense object

**Response**: Updated expense object

---

### DELETE /api/expenses/[id]

Delete expense.

**Response**:
```json
{
  "success": true,
  "message": "Expense deleted successfully"
}
```

---

## 📸 Photo Upload Endpoint

### POST /api/upload-photo

Upload photo to Google Drive.

**Request Body** (multipart/form-data):
```typescript
{
  file: File // Image file (JPEG, PNG, WebP, GIF)
}
```

**Response**:
```json
{
  "success": true,
  "fileId": "1abc123...",
  "webViewLink": "https://drive.google.com/file/d/1abc123/view",
  "thumbnailLink": "https://drive.google.com/..."
}
```

**Error Response**:
```json
{
  "error": "Google Drive not connected",
  "message": "Please connect Google Drive in settings"
}
```

**Implementation**: `app/api/upload-photo/route.ts`

**Requirements**:
- User must have connected Google Drive
- Valid OAuth2 tokens must be stored

---

## 🗺️ Destination Endpoints

### GET /api/destinations

Get all destinations for authenticated user's household.

**Query Parameters**:
- `filter` (optional): "all", "visited", "future"
- `personal` (optional): "true" to include only user's personal destinations

**Response**:
```json
{
  "destinations": [
    {
      "id": "dest_123",
      "userId": "user_123",
      "city": "Tokyo",
      "country": "Japan",
      "countryCode": "JP",
      "latitude": 35.6762,
      "longitude": 139.6503,
      "visitDate": "2025-11-01T00:00:00Z",
      "isFuture": false,
      "isPersonal": false,
      "tripId": "trip_123",
      "notes": "Amazing city!",
      "photos": ["https://..."],
      "rating": 5,
      "highlights": ["Shibuya Crossing", "Senso-ji Temple"],
      "createdAt": "2025-10-31T12:00:00Z"
    }
  ]
}
```

---

### POST /api/destinations

Create destination.

**Request Body**:
```json
{
  "city": "Tokyo",
  "country": "Japan",
  "countryCode": "JP",
  "latitude": 35.6762,
  "longitude": 139.6503,
  "visitDate": "2025-11-01",
  "isFuture": false,
  "isPersonal": false,
  "tripId": "trip_123",
  "notes": "Amazing city!",
  "photos": [],
  "rating": 5,
  "highlights": ["Shibuya Crossing", "Senso-ji Temple"]
}
```

**Response**: Created destination object

---

### PATCH /api/destinations/[id]

Update destination.

**Request Body**: Partial destination object

**Response**: Updated destination object

---

### DELETE /api/destinations/[id]

Delete destination.

**Response**:
```json
{
  "success": true
}
```

---

## 💱 Currency Endpoint

### POST /api/currency/convert

Convert amount between currencies.

**Request Body**:
```json
{
  "amount": 100,
  "from": "USD",
  "to": "JPY"
}
```

**Response**:
```json
{
  "convertedAmount": 14925.50,
  "rate": 149.255,
  "from": "USD",
  "to": "JPY"
}
```

---

### GET /api/currency/convert

Get exchange rates for a base currency.

**Query Parameters**:
- `base` (required): Base currency code (USD, EUR, etc.)

**Response**:
```json
{
  "base": "USD",
  "rates": {
    "EUR": 0.92,
    "GBP": 0.79,
    "JPY": 149.26,
    "CNY": 7.24
  },
  "timestamp": "2025-10-31T12:00:00Z"
}
```

---

## 🔗 Google Drive OAuth

### GET /api/auth/google-drive/authorize

Initiate Google Drive OAuth flow.

**Response**: Redirects to Google OAuth consent screen

---

### GET /api/auth/google-drive/callback

OAuth callback endpoint.

**Query Parameters** (from Google):
- `code`: Authorization code

**Response**: Redirects to /settings with success/error message

---

### POST /api/auth/google-drive/disconnect

Disconnect Google Drive.

**Response**:
```json
{
  "success": true,
  "message": "Google Drive disconnected successfully"
}
```

---

## 🖼️ Image Proxy

### GET /api/image-proxy

Proxy Google Drive images for CORS.

**Query Parameters**:
- `url` (required): Google Drive file URL

**Response**: Image file with appropriate CORS headers

**Use Case**: Loading Google Drive images in the app without CORS issues

---

## 🏦 Finance Endpoints (Optional)

### Plaid Integration

#### POST /api/plaid/create-link-token

Create Plaid Link token for account connection.

**Response**:
```json
{
  "link_token": "link-sandbox-..."
}
```

---

#### POST /api/plaid/exchange-public-token

Exchange public token for access token.

**Request Body**:
```json
{
  "public_token": "public-sandbox-..."
}
```

**Response**:
```json
{
  "success": true,
  "account_id": "acc_123"
}
```

---

#### GET /api/plaid/transactions

Get Plaid transactions.

**Query Parameters**:
- `accountId` (required): Account ID
- `startDate` (optional): Start date (ISO)
- `endDate` (optional): End date (ISO)

**Response**:
```json
{
  "transactions": [
    {
      "id": "tx_123",
      "amount": 25.50,
      "date": "2025-10-31",
      "name": "Starbucks",
      "category": ["Food and Drink", "Restaurants"]
    }
  ]
}
```

---

### Wise Integration

#### GET /api/wise/accounts

Get Wise account balances.

**Response**:
```json
{
  "accounts": [
    {
      "id": "acc_123",
      "currency": "USD",
      "balance": 1250.00
    }
  ]
}
```

---

## 📊 Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (invalid input) |
| 401 | Unauthorized (not logged in) |
| 403 | Forbidden (not allowed) |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## 🔑 Environment Variables Required

```bash
# Database
DATABASE_URL="postgresql://..."

# Authentication
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3002"

# AI
GROQ_API_KEY="gsk_..."
OPENAI_API_KEY="sk-..."

# Google Drive
GOOGLE_CLIENT_ID="...apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-..."
GOOGLE_REDIRECT_URI="http://localhost:3002/api/auth/google-drive/callback"

# Plaid (Optional)
PLAID_CLIENT_ID="..."
PLAID_SECRET="..."
PLAID_ENV="sandbox"

# Wise (Optional)
WISE_API_TOKEN="..."
```

---

## 🛠️ API Client Example

### TypeScript/JavaScript

```typescript
// Add expense with tip
async function addExpenseWithTip(tripId: string, amount: number) {
  const response = await fetch('/api/expenses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tripId,
      amount: amount * 1.20, // 20% tip
      currency: 'USD',
      category: 'Food & Dining',
      date: new Date().toISOString(),
      notes: 'Includes 20% tip'
    }),
  })

  return await response.json()
}

// Scan receipt
async function scanReceipt(file: File) {
  const formData = new FormData()
  formData.append('image', file)

  const response = await fetch('/api/ai/scan-receipt', {
    method: 'POST',
    body: formData,
  })

  return await response.json()
}

// Upload photo to Google Drive
async function uploadPhoto(file: File) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch('/api/upload-photo', {
    method: 'POST',
    body: formData,
  })

  return await response.json()
}
```

---

## 📝 Notes

- All timestamps use ISO 8601 format
- All monetary amounts are numbers (not strings)
- All responses use JSON format
- Session required for all routes except `/api/auth/*`
- Rate limiting may apply to AI endpoints

---

**Last Updated**: October 31, 2025

**Version**: 1.0
