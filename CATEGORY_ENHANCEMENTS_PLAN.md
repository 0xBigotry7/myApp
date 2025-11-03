# Category-Specific Expense Enhancements Plan

## Current State
- ✅ **Transportation**: fromLocation, toLocation, transportationMethod
- ✅ **Accommodation**: Full hotel booking with Google Places (separate flow)
- ⚠️ **Food & Dining**: Basic tip calculator
- ❌ **Activities**: No specific fields
- ❌ **Shopping**: No specific fields
- ❌ **Other**: No specific fields

## Enhanced Categories

### 1. **Food & Dining** 🍽️
**Current:** Tip calculator (15%, 18%, 20%, 22%)
**Enhancements:**
- ✅ Keep tip calculator
- ➕ **Party size** (number of people)
- ➕ **Meal type** (Breakfast, Lunch, Dinner, Snacks, Drinks)
- ➕ **Cuisine type** (Italian, Japanese, Mexican, etc.) - optional
- ➕ **Restaurant name** (via location autocomplete)
- ➕ **Reservation?** (Yes/No toggle)
- ➕ **Rating** (1-5 stars) - optional, post-meal

**Schema additions:**
```prisma
partySize          Int?      // Number of people
mealType           String?   // "Breakfast", "Lunch", "Dinner", "Snacks", "Drinks"
cuisineType        String?   // "Italian", "Japanese", "Mexican", etc.
restaurantName     String?   // From location or manual
hasReservation     Boolean?  // Had reservation
expenseRating      Float?    // 1-5 stars for the experience
```

---

### 2. **Transportation** 🚗
**Current:** transportationMethod, fromLocation, toLocation
**Enhancements:**
- ✅ Keep existing fields
- ➕ **Transportation type icons** (Flight ✈️, Train 🚆, Bus 🚌, Taxi 🚕, Uber 🚗, Metro 🚇, Ferry ⛴️, Bike 🚲, Walk 🚶, Rental Car 🚗)
- ➕ **Distance** (km/miles) - optional
- ➕ **Duration** (hours/minutes) - optional
- ➕ **Ticket/booking reference** - optional
- ➕ **Number of passengers** - optional

**Schema additions:**
```prisma
transportationDistance  Float?   // in kilometers
transportationDuration  Int?     // in minutes
ticketReference        String?  // Booking reference
numberOfPassengers     Int?     // Number of people
```

---

### 3. **Activities** 🎭
**New category with specific fields:**
- **Activity type** (Sightseeing, Museum, Theme Park, Tour, Concert, Sports, Adventure, etc.)
- **Activity name** (e.g., "Eiffel Tower", "Louvre Museum")
- **Duration** (hours)
- **Number of tickets/people**
- **Booking reference** - optional
- **Guide included?** (Yes/No)
- **Rating** (1-5 stars) - optional, post-activity

**Schema additions:**
```prisma
activityType       String?  // "Museum", "Tour", "Concert", etc.
activityName       String?  // Name of attraction/activity
activityDuration   Float?   // Duration in hours
numberOfTickets    Int?     // Number of tickets
activityReference  String?  // Booking/ticket reference
hasGuide          Boolean? // Guided tour?
```

---

### 4. **Shopping** 🛍️
**New category with specific fields:**
- **Store/shop name**
- **Shopping category** (Clothing, Souvenirs, Electronics, Groceries, Gifts, Local Crafts, etc.)
- **Number of items** - optional
- **Return policy** (Yes/No) - optional
- **Gift for someone?** - optional

**Schema additions:**
```prisma
storeName          String?  // Name of store
shoppingCategory   String?  // "Clothing", "Souvenirs", "Electronics", etc.
numberOfItems      Int?     // How many items purchased
hasReturnPolicy    Boolean? // Can return?
isGift            Boolean? // Bought as gift?
giftRecipient     String?  // Who is it for (if gift)
```

---

### 5. **Other** 📦
**Keep minimal:**
- **Sub-category** (optional dropdown: Tips, Fees, Insurance, Medical, Emergency, Misc)
- **Description** (note field - already exists)

**Schema additions:**
```prisma
otherSubcategory   String?  // "Tips", "Fees", "Insurance", etc.
```

---

## Implementation Strategy

### Phase 1: Database Schema
1. Extend Expense model in Prisma schema
2. Run migration: `npx prisma db push`
3. Regenerate client: `npx prisma generate`

### Phase 2: API Updates
1. Update POST `/api/expenses` - accept new fields
2. Update PATCH `/api/expenses/[id]` - update new fields
3. Update timeline transformation to include new metadata

### Phase 3: UI Components
1. Create `CategorySpecificFields.tsx` component with conditional rendering
2. Update `ExpenseInputForm.tsx` to include category-specific fields
3. Update `EditExpenseForm.tsx` to include category-specific fields
4. Create helper functions for field visibility logic

### Phase 4: Display Components
1. Update `ExpenseList.tsx` to show category-specific info
2. Create category-specific compact cards (similar to AccommodationExpenseCardCompact)
3. Update timeline display to show relevant metadata

---

## UI/UX Considerations

### Form Layout
- **Collapsible sections** for category-specific fields (appear below amount/date/location)
- **Progressive disclosure** - only show when category selected
- **Smart defaults** - pre-fill common values
- **Mobile-friendly** - larger touch targets, appropriate input types

### Visual Design
- **Category color coding** - each category gets a color theme
- **Icons** - visual indicators for field types
- **Inline help** - small hints for optional fields
- **Validation** - smart validation (e.g., party size > 0)

### Data Entry Optimization
- **Quick selects** - button groups for common values
- **Autocomplete** - restaurant/activity names via Google Places
- **Number pickers** - stepper for quantities
- **Rating stars** - visual star selection

---

## Benefits

1. **Better expense tracking** - Capture more context per category
2. **Improved insights** - Analyze spending patterns (avg party size, popular cuisines, etc.)
3. **Complete records** - Booking references, ticket numbers for reference
4. **Trip memories** - Ratings and details help remember experiences
5. **Budget planning** - Better data for future trip planning

---

## Examples

### Food & Dining Expense
```
Amount: $85.00
+ Tip (18%): $15.30
= Total: $100.30

Party size: 4 people ($25.08/person)
Meal type: Dinner
Cuisine: Japanese
Restaurant: Sushi Dai
Reservation: Yes
Rating: ⭐⭐⭐⭐⭐
```

### Activity Expense
```
Amount: $120.00

Activity: Museum Visit
Name: Louvre Museum
Duration: 3 hours
Tickets: 2 adults
Booking ref: LV-2025-1234
Guide: Yes
Rating: ⭐⭐⭐⭐½
```

### Shopping Expense
```
Amount: $45.00

Store: Local Market
Category: Souvenirs
Items: 5
Gift: Yes (for Mom)
Return policy: No
```

---

**Implementation Priority:**
1. Food & Dining (most common, already has tip)
2. Activities (high value, memorable)
3. Shopping (frequent, good for memories)
4. Transportation (already good, minor enhancements)
5. Other (keep simple)
