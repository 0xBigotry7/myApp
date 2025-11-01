import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error: "OpenAI API key not configured",
          hint: "Get your API key at https://platform.openai.com/api-keys"
        },
        { status: 500 }
      );
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString("base64");
    const mimeType = file.type;

    // Call OpenAI Vision API with GPT-4o
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this receipt image and extract the following information in JSON format:

{
  "amount": <total amount as number>,
  "currency": <currency code like "USD", "EUR", etc.>,
  "date": <date in YYYY-MM-DD format>,
  "location": <merchant/store name>,
  "note": <brief description of what was purchased>,
  "category": <categorize as one of: "Accommodation", "Food & Dining", "Transportation", "Activities", "Shopping", "Other">
}

IMPORTANT:
- Extract the TOTAL amount including tax
- Use the actual currency from the receipt
- If date is unclear, use today's date
- Be accurate with the merchant name
- Choose the most appropriate category
- Return ONLY valid JSON, no other text`,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 500,
      temperature: 0.2,
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "Failed to extract receipt data" },
        { status: 500 }
      );
    }

    // Parse JSON response
    let receiptData;
    try {
      // Remove markdown code blocks if present
      const jsonString = content.replace(/```json\n?|\n?```/g, "").trim();
      receiptData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", content);
      return NextResponse.json(
        { error: "Failed to parse receipt data", rawResponse: content },
        { status: 500 }
      );
    }

    return NextResponse.json(receiptData);
  } catch (error: any) {
    console.error("Error scanning receipt:", error);
    return NextResponse.json(
      {
        error: "Failed to scan receipt",
        details: error?.message || "Unknown error"
      },
      { status: 500 }
    );
  }
}
