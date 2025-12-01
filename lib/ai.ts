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
    
    // Fallback: Generate simple rule-based insights without AI
    return generateFallbackInsights(totalBudget, spent, categoryBreakdown, daysRemaining);
  }
}

// Fallback function for when AI is unavailable
function generateFallbackInsights(
  totalBudget: number,
  totalSpent: number,
  categoryBreakdown: { category: string; spent: number; budget: number }[],
  daysRemaining: number
): ExpenseInsight[] {
  const insights: ExpenseInsight[] = [];
  const percentUsed = (totalSpent / totalBudget) * 100;
  const remaining = totalBudget - totalSpent;
  const dailyBudget = daysRemaining > 0 ? remaining / daysRemaining : 0;

  // Overall budget insight
  if (percentUsed > 100) {
    insights.push({
      message: `You've exceeded your total budget by $${(totalSpent - totalBudget).toFixed(0)}`,
      severity: "alert",
      recommendation: "Consider reducing expenses or adjusting your budget for the remaining trip."
    });
  } else if (percentUsed > 80) {
    insights.push({
      message: `You've used ${percentUsed.toFixed(0)}% of your budget with ${daysRemaining} days remaining`,
      severity: "warning",
      recommendation: `Try to keep daily spending under $${dailyBudget.toFixed(0)} to stay on track.`
    });
  } else if (percentUsed > 50) {
    insights.push({
      message: `Good progress! You've used ${percentUsed.toFixed(0)}% of your budget`,
      severity: "info",
      recommendation: `You have about $${dailyBudget.toFixed(0)} per day for the rest of your trip.`
    });
  }

  // Category-specific insights
  for (const cat of categoryBreakdown) {
    const catPercent = cat.budget > 0 ? (cat.spent / cat.budget) * 100 : 0;
    
    if (catPercent > 100) {
      insights.push({
        message: `${cat.category} is over budget by $${(cat.spent - cat.budget).toFixed(0)}`,
        severity: "alert",
        category: cat.category,
        recommendation: `Consider cutting back on ${cat.category.toLowerCase()} spending.`
      });
    } else if (catPercent > 90 && daysRemaining > 3) {
      insights.push({
        message: `${cat.category} budget is almost depleted (${catPercent.toFixed(0)}% used)`,
        severity: "warning",
        category: cat.category,
        recommendation: `Only $${(cat.budget - cat.spent).toFixed(0)} remaining for ${cat.category.toLowerCase()}.`
      });
    }
  }

  // Daily spending insight
  if (daysRemaining > 0 && dailyBudget > 0) {
    insights.push({
      message: `Daily budget available: $${dailyBudget.toFixed(0)}`,
      severity: "info",
      recommendation: `Spread your remaining $${remaining.toFixed(0)} over ${daysRemaining} days.`
    });
  }

  return insights.slice(0, 5); // Limit to 5 insights
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
