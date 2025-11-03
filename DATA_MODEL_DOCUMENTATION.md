# Data Model Documentation: Events, Expenses, and Timeline

This document explains the relationships between different data models in the app, particularly focusing on how **Expenses**, **TripPosts**, **LifeEvents**, and the **Timeline** system work together.

---

## 📊 Core Data Models

### 1. **Expense** Model
**Purpose:** Track financial expenses within a trip (trip-specific spending)

**Location:** `prisma/schema.prisma` lines 75-108

**Key Fields:**
```prisma
model Expense {
  id                    String   @id @default(cuid())
  tripId                String   // REQUIRED: Must belong to a trip
  userId                String   // Who created this expense
  amount                Float
  category              String   // "Food & Dining", "Transportation", "Activities", etc.
  currency              String   @default("USD")
  date                  DateTime // When the expense occurred
  note                  String?
  receiptUrl            String?
  location              String?

  // Transportation-specific fields
  transportationMethod  String?  // "Flight", "Train", "Uber", etc.
  fromLocation          String?
  toLocation            String?

  // Accommodation-specific fields (added for hotel bookings)
  accommodationName     String?
  accommodationType     String?
  checkInDate           DateTime?
  checkOutDate          DateTime?
  numberOfNights        Int?
  googlePlaceId         String?
  hotelAddress          String?
  hotelPhone            String?
  hotelWebsite          String?
  hotelRating           Float?
  hotelPhotos           String[]
  latitude              Float?
  longitude             Float?
  confirmationNumber    String?

  // Relations
  trip                  Trip     @relation(...)
  user                  User     @relation(...)
}
```

**Key Characteristics:**
- ✅ **Trip-scoped**: Always belongs to a specific trip
- ✅ **User-attributed**: Tracks who created the expense
- ✅ **Category-based**: Different categories enable different features (tips for food, time for transportation)
- ✅ **Accommodation support**: Extended fields for hotel bookings with Google Places integration

---

### 2. **TripPost** Model
**Purpose:** Timeline posts within a trip (photos, notes, check-ins)

**Location:** `prisma/schema.prisma` lines 151-169

**Key Fields:**
```prisma
model TripPost {
  id          String   @id @default(cuid())
  tripId      String   // REQUIRED: Must belong to a trip
  userId      String   // Who created this post
  type        String   // "photo", "note", "checkin"
  content     String?  // Text content/caption
  photos      String[] // Array of photo URLs (Google Drive)
  location    String?
  latitude    Float?
  longitude   Float?
  timestamp   DateTime // When this moment happened (can be backdated)
  createdAt   DateTime @default(now())

  // Relations
  trip        Trip     @relation(...)
  user        User     @relation(...)

  @@index([tripId, timestamp])
}
```

**Key Characteristics:**
- ✅ **Trip-scoped**: Always belongs to a specific trip
- ✅ **Multi-media**: Supports photos from Google Drive
- ✅ **Backdatable**: `timestamp` can differ from `createdAt` for adding past moments
- ✅ **Location-aware**: Optional lat/long for mapping

---

### 3. **LifeEvent** Model
**Purpose:** Personal life timeline events (NOT trip-specific)

**Location:** `prisma/schema.prisma` lines 452-472

**Key Fields:**
```prisma
model LifeEvent {
  id          String   @id @default(cuid())
  userId      String   // NOT trip-scoped, belongs to user
  type        String   // "milestone", "achievement", "memory", "note", etc.
  title       String
  content     String?
  photos      String[]
  location    String?
  latitude    Float?
  longitude   Float?
  tags        String[] // ["family", "career", "celebration"]
  mood        String?  // "happy", "excited", "grateful", etc.
  isPrivate   Boolean  @default(false) // Hide from household
  date        DateTime // When this event happened

  // Relations
  user        User     @relation(...)

  @@index([userId, date])
}
```

**Key Characteristics:**
- ❌ **NOT trip-scoped**: General life events, not tied to trips
- ✅ **Privacy control**: Can be marked private
- ✅ **Mood tracking**: Optional mood field
- ✅ **Tagging system**: Flexible categorization

---

### 4. **Activity** Model
**Purpose:** Planned itinerary activities within a trip

**Location:** `prisma/schema.prisma` lines 110-130

**Key Fields:**
```prisma
model Activity {
  id            String   @id @default(cuid())
  tripId        String   // REQUIRED: Must belong to a trip
  title         String
  description   String?
  date          DateTime
  startTime     String?
  endTime       String?
  location      String?
  latitude      Float?
  longitude     Float?
  category      String?
  estimatedCost Float?  // Planned cost
  actualCost    Float?  // Actual cost (can link to Expense)
  notes         String?
  order         Int      @default(0) // For ordering in itinerary
  isAiGenerated Boolean  @default(false)

  // Relations
  trip          Trip     @relation(...)
}
```

**Key Characteristics:**
- ✅ **Trip-scoped**: Planning tool for trips
- ✅ **Time-based**: Can have start/end times
- ✅ **Cost tracking**: Both estimated and actual
- ⚠️ **Not directly linked to Expense**: No foreign key, but can match via date/amount

---

## 🔗 Relationships & Data Flow

### Parent-Child Hierarchy

```
User
 ├── Trip (owns or member of)
 │   ├── Expense (trip spending)
 │   ├── TripPost (trip moments)
 │   ├── Activity (trip plans)
 │   ├── BudgetCategory (trip budget)
 │   └── TripMember (access control)
 │
 ├── LifeEvent (personal timeline, NOT trip-related)
 ├── Transaction (general finance, NOT trip-related)
 └── DailyLog (health tracking, NOT trip-related)
```

### Key Relationships

#### 1. Trip → Expense
**Type:** One-to-Many
**Foreign Key:** `Expense.tripId` → `Trip.id`
**Cascade:** Delete expenses when trip is deleted

**Access Control:**
- User must be trip owner OR trip member to view/create expenses
- User who created expense can edit/delete it

#### 2. Trip → TripPost
**Type:** One-to-Many
**Foreign Key:** `TripPost.tripId` → `Trip.id`
**Cascade:** Delete posts when trip is deleted

**Access Control:**
- User must be trip owner OR trip member to view/create posts
- User who created post can edit/delete it

#### 3. User → LifeEvent
**Type:** One-to-Many
**Foreign Key:** `LifeEvent.userId` → `User.id`
**Cascade:** Delete events when user is deleted

**Access Control:**
- Only user can view/edit their own life events
- `isPrivate` controls household visibility

#### 4. Trip → Activity
**Type:** One-to-Many
**Foreign Key:** `Activity.tripId` → `Trip.id`
**Cascade:** Delete activities when trip is deleted

**Loose Coupling:**
- Activities are plans, Expenses are actual spending
- No direct link, but can be matched by date/category/amount

---

## 🎯 Timeline Aggregation System

The `/timeline` page aggregates data from **5 different sources** into a unified chronological view.

### Timeline API
**Location:** `/app/api/timeline/route.ts`

**Data Sources:**
1. **TripPost** (travel moments)
2. **Expense** (travel spending)
3. **Transaction** (general finance)
4. **DailyLog** (health tracking)
5. **LifeEvent** (life milestones)

### Unified Timeline Format

```typescript
{
  id: string,           // Prefixed: "post-123", "expense-456", "life-789"
  originalId: string,   // Original database ID
  source: string,       // "trip_post", "expense", "transaction", "health", "life_event"
  type: string,         // Category/type from original model
  date: DateTime,       // When it happened
  title: string,        // Display title
  content: string?,     // Description/note
  photos: string[],     // Photo URLs
  location: string?,    // Location name
  metadata: object,     // Source-specific data
  user: object,         // User info
  isEditable: boolean,  // Can user edit this?
}
```

### Timeline Item Transformations

#### TripPost → Timeline Item
```typescript
{
  id: `post-${post.id}`,
  source: "trip_post",
  type: post.type, // "photo", "note", "checkin"
  date: post.timestamp,
  title: post.content || "Travel moment",
  photos: post.photos, // From Google Drive
  metadata: {
    tripId: post.tripId,
    tripName: post.trip?.name,
    tripDestination: post.trip?.destination,
  },
  isEditable: true, // User can edit their own posts
}
```

#### Expense → Timeline Item
```typescript
{
  id: `expense-${expense.id}`,
  source: "expense",
  type: expense.category,
  date: expense.date,
  title: `${expense.category}: $${expense.amount}`,
  photos: expense.receiptUrl ? [expense.receiptUrl] : [],
  metadata: {
    amount: expense.amount,
    currency: expense.currency,
    category: expense.category,
    tripId: expense.tripId,
    transportationMethod: expense.transportationMethod,
    fromLocation: expense.fromLocation,
    toLocation: expense.toLocation,
  },
  isEditable: true, // User can edit expenses
}
```

#### LifeEvent → Timeline Item
```typescript
{
  id: `life-${event.id}`,
  source: "life_event",
  type: event.type, // "milestone", "achievement", etc.
  date: event.date,
  title: event.title,
  photos: event.photos,
  metadata: {
    tags: event.tags,
    mood: event.mood,
    isPrivate: event.isPrivate,
  },
  isEditable: true, // User can edit their events
}
```

---

## 🔄 Where Changes Propagate

### When You Modify **Expense** Schema

**Affected Files:**

1. **Schema:**
   - ✅ `prisma/schema.prisma` - Add new fields
   - ✅ Run `npx prisma db push` to sync database
   - ✅ Run `npx prisma generate` to update types

2. **API Routes:**
   - ✅ `/app/api/expenses/route.ts` (POST) - Add field to create
   - ✅ `/app/api/expenses/[id]/route.ts` (PATCH) - Add field to update
   - ✅ `/app/api/timeline/route.ts` - Add field to timeline transformation (line 154-177)

3. **Components:**
   - ✅ `components/ExpenseInputForm.tsx` - Add input field
   - ✅ `components/EditExpenseForm.tsx` - Add input field (if separate)
   - ✅ `components/ExpenseList.tsx` - Display new field
   - ✅ `components/AccommodationExpenseCardCompact.tsx` - For accommodation-specific fields
   - ⚠️ `components/TimelineItem.tsx` - If field should show in timeline

4. **TypeScript Types:**
   - ✅ TypeScript will auto-update from Prisma Client
   - ⚠️ Check any manual type definitions in `/types/`

---

### When You Modify **TripPost** Schema

**Affected Files:**

1. **Schema:**
   - ✅ `prisma/schema.prisma`
   - ✅ Database sync

2. **API Routes:**
   - ✅ `/app/api/posts/route.ts` (POST)
   - ✅ `/app/api/posts/[id]/route.ts` (PATCH/DELETE)
   - ✅ `/app/api/timeline/route.ts` - Timeline transformation (line 135-152)

3. **Components:**
   - ✅ `components/AddToTimelineModal.tsx` - Add input field
   - ✅ `components/TripTimeline.tsx` - Display in trip timeline
   - ✅ `components/TimelineItem.tsx` - Display in unified timeline
   - ✅ `app/trips/[id]/page.tsx` - Timeline tab rendering

---

### When You Modify **LifeEvent** Schema

**Affected Files:**

1. **Schema:**
   - ✅ `prisma/schema.prisma`
   - ✅ Database sync

2. **API Routes:**
   - ✅ `/app/api/timeline/events/route.ts` (POST)
   - ✅ `/app/api/timeline/events/[id]/route.ts` (PATCH/DELETE)
   - ✅ `/app/api/timeline/route.ts` - Timeline transformation (line 220-237)

3. **Components:**
   - ✅ `components/AddLifeEventModal.tsx` - Add input field
   - ✅ `components/LifeTimeline.tsx` - Display life events
   - ✅ `components/TimelineItem.tsx` - Display in unified timeline
   - ✅ `app/timeline/page.tsx` - Main timeline page

---

### When You Add a **New Timeline Source**

**Steps:**

1. **Create Model** in `prisma/schema.prisma`
2. **Create API Routes** for CRUD operations
3. **Update Timeline API** (`/app/api/timeline/route.ts`):
   - Add to `sources` array
   - Add fetch query in `Promise.all`
   - Add transformation to unified format
4. **Update Components**:
   - Update `TimelineItem.tsx` to handle new source type
   - Add source filter to `TimelineViewSwitcher.tsx`

---

## 📝 Common Patterns

### 1. Creating an Expense with Special Fields

```typescript
// For Accommodation
POST /api/expenses
{
  tripId: "trip-123",
  amount: 500,
  category: "Accommodation",
  currency: "USD",
  date: "2025-01-15T12:00:00Z",

  // Accommodation-specific
  accommodationName: "Hilton Tokyo",
  accommodationType: "Hotel",
  checkInDate: "2025-01-15T15:00:00Z",
  checkOutDate: "2025-01-18T11:00:00Z",
  numberOfNights: 3,
  googlePlaceId: "ChIJ...",
  hotelAddress: "1-1-1 Shinjuku, Tokyo",
  hotelRating: 4.5,
  confirmationNumber: "HT123456",
}

// For Transportation
POST /api/expenses
{
  tripId: "trip-123",
  amount: 250,
  category: "Transportation",
  currency: "USD",
  date: "2025-01-15T08:00:00Z",

  // Transportation-specific
  transportationMethod: "Flight",
  fromLocation: "New York JFK",
  toLocation: "Tokyo Narita",
}
```

### 2. Fetching Timeline with Filters

```typescript
GET /api/timeline?source=travel&dateFrom=2025-01-01&limit=20

// Returns unified timeline items from TripPosts and Expenses
```

### 3. Trip Access Control Pattern

```typescript
// Check if user can access trip (owner or member)
const trip = await prisma.trip.findFirst({
  where: {
    id: tripId,
    OR: [
      { ownerId: userId },
      { members: { some: { userId } } }
    ]
  }
});

if (!trip) {
  return { error: "Access denied" };
}
```

---

## 🎨 UI Rendering Logic

### Expense List
**File:** `components/ExpenseList.tsx`

**Logic:**
1. Check if expense is accommodation: `expense.category === "Accommodation" || expense.accommodationName != null`
2. If accommodation → render `AccommodationExpenseCardCompact`
3. Else → render regular expense card
4. Edit button routes:
   - Accommodation: `/trips/[id]/edit-accommodation/[expenseId]`
   - Regular: `/trips/[id]/edit-expense/[expenseId]`

### Trip Timeline Tab
**File:** `components/TripPageTabs.tsx` → `TimelineTab`

**Displays:**
- TripPosts (photos, notes)
- Expenses (with receipts)
- Combined chronologically by date

### Unified Timeline Page
**File:** `app/timeline/page.tsx`

**Displays:**
- All 5 data sources merged
- Filterable by source type
- Searchable
- Paginated

---

## 🔍 Key Insights

### What's Connected?
- ✅ **Expense** and **TripPost** are both trip-scoped and appear in trip timeline
- ✅ **LifeEvent** is user-scoped and appears only in unified timeline
- ✅ **Activity** is trip-scoped but NOT in timeline (it's planning, not actual events)
- ✅ All 5 sources merge in `/timeline` API

### What's NOT Connected?
- ❌ **Expense** has no direct link to **Activity** (loose coupling by date/amount)
- ❌ **Transaction** is separate from **Expense** (general finance vs trip-specific)
- ❌ **LifeEvent** has no trip relationship (personal timeline only)

### Special Cases
- **Accommodation**: Uses same Expense model with extended fields
- **Transportation**: Uses same Expense model with extended fields
- **Receipt Photos**: Stored as `receiptUrl` in Expense, displayed in timeline
- **Trip Photos**: Stored in Google Drive, URLs in TripPost.photos array

---

## 📚 Quick Reference

| Model | Trip-Scoped? | In Timeline? | Editable? | Photo Support? |
|-------|-------------|--------------|-----------|----------------|
| **Expense** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Receipt URL |
| **TripPost** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Google Drive |
| **Activity** | ✅ Yes | ❌ No | ✅ Yes | ❌ No |
| **LifeEvent** | ❌ No | ✅ Yes | ✅ Yes | ✅ Array of URLs |
| **Transaction** | ❌ No | ✅ Yes | ❌ No | ✅ Receipt URL |
| **DailyLog** | ❌ No | ✅ Yes | ❌ No | ❌ No |

---

## 🚀 Best Practices

1. **Always cascade deletes** for trip-scoped data
2. **Check trip access** before any trip-related operation
3. **Use unified timeline format** when adding new sources
4. **Prefix timeline IDs** to avoid collisions (`post-`, `expense-`, `life-`)
5. **Validate user ownership** before edit/delete operations
6. **Use optional fields** for category-specific data (accommodation, transportation)
7. **Keep Activity separate** from Expense (planning vs actuals)

---

**Last Updated:** 2025-11-03
**Version:** 1.0
