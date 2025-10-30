import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

// Initialize Groq client (FREE & FAST!)
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "",
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Check if Groq API key is configured
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        {
          error: "Groq API key not configured",
          hint: "Get your FREE API key at https://console.groq.com/keys"
        },
        { status: 500 }
      );
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString("base64");
    const mimeType = file.type;

    // Call Groq Vision API with Llama 3.2 Vision (FREE & FAST!)
    const response = await groq.chat.completions.create({
      model: "llama-3.2-90b-vision-preview",
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
      console.error("Failed to parse Groq response:", content);
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
