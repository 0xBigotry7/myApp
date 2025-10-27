import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Common expense categories
const CATEGORIES = [
  "Groceries",
  "Dining & Restaurants",
  "Transportation",
  "Gas & Fuel",
  "Shopping & Retail",
  "Entertainment",
  "Utilities",
  "Rent & Housing",
  "Healthcare & Medical",
  "Insurance",
  "Education",
  "Subscriptions",
  "Travel",
  "Fitness & Gym",
  "Personal Care",
  "Home Improvement",
  "Electronics",
  "Gifts & Donations",
  "Income",
  "Transfer",
  "Other",
];

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { merchantName, description, amount } = body;

    if (!merchantName && !description) {
      return NextResponse.json(
        { error: "Merchant name or description is required" },
        { status: 400 }
      );
    }

    // Check if user has a category rule for this merchant
    const existingRule = await prisma.categoryRule.findFirst({
      where: {
        userId: session.user.id,
        merchant: merchantName?.toLowerCase() || "",
      },
    });

    if (existingRule) {
      // Use existing rule and increment usage count
      await prisma.categoryRule.update({
        where: { id: existingRule.id },
        data: { timesUsed: { increment: 1 } },
      });

      return NextResponse.json({
        category: existingRule.category,
        confidence: existingRule.confidence,
        source: "user_rule",
      });
    }

    // Use AI to categorize
    const prompt = `You are a financial transaction categorizer. Based on the following transaction details, determine the most appropriate category.

Transaction Details:
- Merchant: ${merchantName || "Unknown"}
- Description: ${description || "N/A"}
- Amount: ${amount || "N/A"}

Available Categories:
${CATEGORIES.join(", ")}

Rules:
1. If amount is positive and seems like income (salary, refund, etc.), use "Income"
2. If it's a transfer between accounts, use "Transfer"
3. Otherwise, pick the most specific category that fits
4. Be consistent with similar merchants

Respond ONLY with a JSON object in this exact format:
{
  "category": "category name from the list",
  "confidence": 0.95,
  "reasoning": "brief explanation"
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");

    // If confidence is high, create a category rule for future use
    if (result.confidence >= 0.85 && merchantName) {
      await prisma.categoryRule.create({
        data: {
          userId: session.user.id,
          merchant: merchantName.toLowerCase(),
          category: result.category,
          confidence: result.confidence,
          timesUsed: 1,
        },
      });
    }

    return NextResponse.json({
      category: result.category,
      confidence: result.confidence,
      reasoning: result.reasoning,
      source: "ai",
    });
  } catch (error) {
    console.error("Error categorizing transaction:", error);
    return NextResponse.json(
      { error: "Failed to categorize transaction" },
      { status: 500 }
    );
  }
}
