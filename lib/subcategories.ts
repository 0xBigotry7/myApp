export const SUBCATEGORIES: Record<string, string[]> = {
  "Accommodation": [
    "Hotel",
    "Airbnb",
    "Hostel",
    "Resort",
    "Vacation Rental",
    "Camping",
    "Other"
  ],
  "Food & Dining": [
    "Restaurant",
    "Fast Food",
    "Cafe/Coffee",
    "Groceries",
    "Snacks",
    "Fine Dining",
    "Street Food",
    "Bar/Drinks",
    "Other"
  ],
  "Flights": [
    "Delta",
    "United",
    "American Airlines",
    "Southwest",
    "JetBlue",
    "International Carrier",
    "Budget Airline",
    "Other"
  ],
  "Transportation": [
    "Uber",
    "Lyft",
    "Taxi",
    "Metro/Subway",
    "Bus",
    "Train",
    "Car Rental",
    "Gas/Fuel",
    "Parking",
    "Ferry",
    "Other"
  ],
  "Activities": [
    "Museum",
    "Tour",
    "Show/Concert",
    "Theme Park",
    "Sports Event",
    "Adventure Activity",
    "Spa/Wellness",
    "Photography",
    "Other"
  ],
  "Shopping": [
    "Souvenirs",
    "Gifts",
    "Clothing",
    "Electronics",
    "Books",
    "Local Crafts",
    "Other"
  ],
  "Insurance & Health": [
    "Travel Insurance",
    "Health Insurance",
    "Pharmacy",
    "Doctor Visit",
    "Emergency",
    "Other"
  ],
  "Communication": [
    "SIM Card",
    "WiFi/Data Plan",
    "Phone Calls",
    "Roaming Charges",
    "Other"
  ],
  "Fees & Tips": [
    "Visa Fees",
    "Tips/Gratuity",
    "Service Charges",
    "Luggage Fees",
    "Entry Fees",
    "Booking Fees",
    "ATM Fees",
    "Other"
  ],
  "Other": [
    "Miscellaneous"
  ]
};

export function getSubcategoriesForCategory(category: string): string[] {
  return SUBCATEGORIES[category] || [];
}
