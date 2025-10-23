import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export interface ItineraryRequest {
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  interests?: string[];
  travelStyle?: string;
  numberOfPeople?: number;
}

export interface ActivitySuggestion {
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  category: string;
  estimatedCost: number;
  notes?: string;
}

export interface ExpenseInsight {
  message: string;
  severity: "info" | "warning" | "alert";
  category?: string;
  recommendation?: string;
}

export async function generateItinerary(
  request: ItineraryRequest
): Promise<ActivitySuggestion[]> {
  const prompt = `You are a travel planning assistant. Create a detailed day-by-day itinerary for a trip to ${request.destination}.

Trip Details:
- Destination: ${request.destination}
- Start Date: ${request.startDate}
- End Date: ${request.endDate}
- Total Budget: $${request.budget}
- Interests: ${request.interests?.join(", ") || "General tourism"}
- Travel Style: ${request.travelStyle || "Balanced"}
- Number of People: ${request.numberOfPeople || 2}

Please provide a realistic itinerary with specific activities, timings, and cost estimates. Include:
- Popular attractions and hidden gems
- Restaurants and food experiences
- Transportation between locations
- Time for rest and flexibility
- Estimated costs for each activity

Return ONLY a valid JSON array of activities with this exact structure:
[
  {
    "title": "Activity name",
    "description": "Detailed description",
    "date": "YYYY-MM-DD",
    "startTime": "HH:MM",
    "endTime": "HH:MM",
    "location": "Specific location name",
    "category": "Accommodation|Food|Transportation|Activities|Shopping|Other",
    "estimatedCost": 0,
    "notes": "Additional tips or info"
  }
]

Make the itinerary practical, well-paced, and within budget. Distribute activities across all days of the trip.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a travel planning assistant. Always respond with valid JSON only."
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
    const parsed = JSON.parse(responseText);

    // Handle if response is wrapped in an object
    const activities = Array.isArray(parsed) ? parsed : (parsed.activities || []);
    return activities as ActivitySuggestion[];
  } catch (error) {
    console.error("Error generating itinerary:", error);
    throw new Error("Failed to generate itinerary");
  }
}

export async function analyzeExpenses(
  totalBudget: number,
  spent: number,
  categoryBreakdown: { category: string; spent: number; budget: number }[],
  daysRemaining: number
): Promise<ExpenseInsight[]> {
  const prompt = `You are a financial advisor for travelers. Analyze the current spending and provide insights.

Budget Overview:
- Total Budget: $${totalBudget}
- Total Spent: $${spent}
- Remaining Budget: $${totalBudget - spent}
- Days Remaining in Trip: ${daysRemaining}

Category Breakdown:
${categoryBreakdown
  .map(
    (cat) =>
      `- ${cat.category}: Spent $${cat.spent} of $${cat.budget} budget (${((cat.spent / cat.budget) * 100).toFixed(1)}%)`
  )
  .join("\n")}

Provide 3-5 actionable insights about spending patterns, budget alerts, and recommendations. Be concise and helpful.

Return ONLY a valid JSON array with this structure:
[
  {
    "message": "Your main insight message",
    "severity": "info|warning|alert",
    "category": "category name or null",
    "recommendation": "What to do about it"
  }
]`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a financial advisor for travelers. Always respond with valid JSON only."
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
    const parsed = JSON.parse(responseText);

    // Handle if response is wrapped in an object
    const insights = Array.isArray(parsed) ? parsed : (parsed.insights || []);
    return insights as ExpenseInsight[];
  } catch (error) {
    console.error("Error analyzing expenses:", error);
    throw new Error("Failed to analyze expenses");
  }
}

export async function suggestDestinations(
  preferences: {
    budget?: number;
    interests?: string[];
    climate?: string;
    continent?: string;
  }
): Promise<{ destination: string; reason: string; estimatedBudget: number }[]> {
  const prompt = `You are a travel advisor. Suggest 5 great travel destinations based on these preferences:

Preferences:
- Budget: ${preferences.budget ? `$${preferences.budget}` : "Flexible"}
- Interests: ${preferences.interests?.join(", ") || "General travel"}
- Climate: ${preferences.climate || "Any"}
- Continent: ${preferences.continent || "Any"}

Provide diverse, realistic suggestions with brief explanations.

Return ONLY a valid JSON array:
[
  {
    "destination": "City, Country",
    "reason": "Why this destination fits",
    "estimatedBudget": 0
  }
]`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a travel advisor. Always respond with valid JSON only."
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
    const parsed = JSON.parse(responseText);

    // Handle if response is wrapped in an object
    const destinations = Array.isArray(parsed) ? parsed : (parsed.destinations || []);
    return destinations;
  } catch (error) {
    console.error("Error suggesting destinations:", error);
    throw new Error("Failed to suggest destinations");
  }
}
