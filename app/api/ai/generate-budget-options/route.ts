import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { startingFrom, destination, duration, travelers } = await request.json();

    const prompt = `Generate 3 budget options for a couple (2 travelers) traveling from ${startingFrom || "their home location"} to ${destination} for ${duration} days.

IMPORTANT CONTEXT:
- This is for a couple (me and my wife) who want comfortable, enjoyable travel
- "Comfortable" = Still comfortable and pleasant, just more budget-conscious. Not backpacking/hostels. Clean hotels, good local food, public transport when convenient.
- "Balanced" = The sweet spot - nice hotels, mix of local and nicer restaurants, convenient transport, planned activities
- "Luxury" = Still affordable luxury - 4-star hotels, fine dining experiences, private transport, premium activities, but not ultra-luxury

Generate 3 options with these exact levels: "comfortable", "balanced", "luxury"

For each option provide:
1. Total budget in USD for 2 PEOPLE TOTAL (not per person) for ${duration} days
2. Per person per day cost (totalBudget / 2 / ${duration})
3. Brief description (one sentence)
4. Breakdown totals for 2 people (accommodation, food, transportation including round-trip flights from ${startingFrom || "origin"} to ${destination}, activities)
5. Currency conversions:
   - USD (same as total)
   - Local currency with currency code
   - CNY (Chinese Yuan)

IMPORTANT REQUIREMENTS:
1. All amounts are for 2 people TOTAL for entire ${duration} day trip
2. perPersonPerDay must equal: totalBudget ÷ 2 ÷ ${duration}
3. accommodation + food + transportation + activities must equal totalBudget
4. Transportation must include realistic round-trip flights from ${startingFrom || "origin"} to ${destination} (2 tickets) plus local transport
5. Local currency: Use ACTUAL currency for ${destination}:
   - Puerto Rico, Ecuador, Panama = USD
   - Europe (most) = EUR
   - UK = GBP
   - Japan = JPY
   - Thailand = THB
   - etc.
6. If destination uses USD, set local.code to "USD" and local.amount same as usd
7. Use realistic 2024/2025 market rates for flights, hotels, food

Respond ONLY with valid JSON in this exact format:
{
  "options": [
    {
      "level": "comfortable",
      "totalBudget": 2400,
      "perPersonPerDay": 240,
      "description": "Comfortable stay with local experiences",
      "breakdown": {
        "flights": 600,
        "accommodation": 700,
        "food": 600,
        "localTransport": 150,
        "activities": 250,
        "shopping": 50,
        "insurance": 30,
        "miscellaneous": 20
      },
      "detailedBreakdown": {
        "flights": {
          "economy": 550,
          "bags": 50
        },
        "accommodation": {
          "perNight": 140,
          "total": 700,
          "type": "3-star hotel or good Airbnb"
        },
        "food": {
          "breakfast": 100,
          "lunch": 200,
          "dinner": 250,
          "snacks": 50
        },
        "localTransport": {
          "taxi": 50,
          "public": 80,
          "rental": 20
        },
        "activities": {
          "attractions": 120,
          "tours": 80,
          "experiences": 50
        }
      },
      "savings": {
        "amount": 300,
        "tips": [
          "Book flights 6-8 weeks in advance",
          "Use public transport instead of taxis",
          "Eat at local restaurants"
        ]
      },
      "splurges": {
        "amount": 200,
        "recommendations": [
          "Premium sunset tour",
          "Fine dining experience at local hotspot"
        ]
      },
      "highlights": [
        "Great value accommodations",
        "Authentic local food experiences",
        "Mix of free and paid attractions"
      ],
      "warnings": [
        "Budget may be tight if you plan many tours",
        "Limited shopping allowance"
      ],
      "currency": {
        "usd": 2400,
        "local": { "amount": 2400, "code": "USD" },
        "cny": 17000
      }
    },
    {
      "level": "balanced",
      "totalBudget": 3800,
      "perPersonPerDay": 380,
      "description": "Perfect balance of comfort and experiences",
      "breakdown": {
        "flights": 800,
        "accommodation": 1200,
        "food": 900,
        "localTransport": 250,
        "activities": 500,
        "shopping": 100,
        "insurance": 30,
        "miscellaneous": 20
      },
      "detailedBreakdown": {
        "flights": { "economy": 700, "bags": 100 },
        "accommodation": { "perNight": 240, "total": 1200, "type": "4-star hotel or premium Airbnb" },
        "food": { "breakfast": 150, "lunch": 300, "dinner": 400, "snacks": 50 },
        "localTransport": { "taxi": 120, "public": 80, "rental": 50 },
        "activities": { "attractions": 200, "tours": 200, "experiences": 100 }
      },
      "savings": {
        "amount": 200,
        "tips": ["Book combo tickets for attractions", "Visit during shoulder season"]
      },
      "splurges": {
        "amount": 400,
        "recommendations": ["Helicopter tour", "Michelin-star tasting menu"]
      },
      "highlights": ["Quality hotels in great locations", "Premium dining options", "Popular tours included"],
      "warnings": ["High season may require more budget"],
      "currency": {
        "usd": 3800,
        "local": { "amount": 3800, "code": "USD" },
        "cny": 27000
      }
    },
    {
      "level": "luxury",
      "totalBudget": 6000,
      "perPersonPerDay": 600,
      "description": "Premium comfort with exceptional experiences",
      "breakdown": {
        "flights": 1200,
        "accommodation": 2000,
        "food": 1500,
        "localTransport": 400,
        "activities": 700,
        "shopping": 150,
        "insurance": 30,
        "miscellaneous": 20
      },
      "detailedBreakdown": {
        "flights": { "economy": 1000, "bags": 200 },
        "accommodation": { "perNight": 400, "total": 2000, "type": "5-star hotel or luxury resort" },
        "food": { "breakfast": 200, "lunch": 500, "dinner": 700, "snacks": 100 },
        "localTransport": { "taxi": 200, "public": 50, "rental": 150 },
        "activities": { "attractions": 250, "tours": 300, "experiences": 150 }
      },
      "savings": {
        "amount": 150,
        "tips": ["Use hotel concierge for deals", "Book experiences early"]
      },
      "splurges": {
        "amount": 800,
        "recommendations": ["Private yacht charter", "VIP guided experience", "Luxury spa day"]
      },
      "highlights": ["Best hotels with amazing views", "Fine dining experiences", "VIP tours and skip-the-line access", "Private transport"],
      "warnings": ["May still need extra for luxury shopping"],
      "currency": {
        "usd": 6000,
        "local": { "amount": 6000, "code": "USD" },
        "cny": 42000
      }
    }
  ]
}

IMPORTANT: Provide ALL fields shown above. Be creative and specific to ${destination}. Use realistic 2024/2025 prices. All numbers integers (no decimals).`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a travel budget expert. Always respond with valid JSON only, no markdown formatting."
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const responseText = completion.choices[0].message.content || "{}";

    // Parse JSON from response
    let budgetData;
    try {
      budgetData = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse AI response:", responseText);
      throw new Error("Invalid response format from AI");
    }

    return NextResponse.json(budgetData);
  } catch (error) {
    console.error("Error generating budget options:", error);
    return NextResponse.json(
      { error: "Failed to generate budget options" },
      { status: 500 }
    );
  }
}
