import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { suggestDestinations } from "@/lib/ai";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { budget, interests, climate, continent } = body;

    const suggestions = await suggestDestinations({
      budget,
      interests,
      climate,
      continent,
    });

    return NextResponse.json({
      success: true,
      suggestions,
    });
  } catch (error) {
    console.error("Error suggesting destinations:", error);
    return NextResponse.json(
      { error: "Failed to suggest destinations" },
      { status: 500 }
    );
  }
}
