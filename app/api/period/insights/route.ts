import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit");

    const insights = await prisma.healthInsight.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      ...(limit && { take: parseInt(limit) }),
    });

    return NextResponse.json(insights);
  } catch (error) {
    console.error("Error fetching insights:", error);
    return NextResponse.json(
      { error: "Failed to fetch insights" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch user's cycle history and daily logs
    const cycles = await prisma.periodCycle.findMany({
      where: { userId: session.user.id },
      include: {
        dailyLogs: true,
      },
      orderBy: { startDate: "desc" },
      take: 6,
    });

    const recentLogs = await prisma.dailyLog.findMany({
      where: { userId: session.user.id },
      orderBy: { date: "desc" },
      take: 30,
    });

    if (cycles.length === 0) {
      return NextResponse.json({
        error: "No cycle data available for analysis",
      }, { status: 400 });
    }

    // Prepare data summary for AI analysis
    const cycleSummary = cycles.map((c) => ({
      startDate: c.startDate,
      endDate: c.endDate,
      cycleLength: c.cycleLength,
      periodLength: c.periodLength,
      flowIntensity: c.flowIntensity,
    }));

    const symptomFrequency: Record<string, number> = {};
    const moodFrequency: Record<string, number> = {};

    recentLogs.forEach((log) => {
      log.symptoms.forEach((s) => {
        symptomFrequency[s] = (symptomFrequency[s] || 0) + 1;
      });
      log.mood.forEach((m) => {
        moodFrequency[m] = (moodFrequency[m] || 0) + 1;
      });
    });

    // Generate AI insights using Claude
    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are a women's health assistant. Analyze the following menstrual cycle data and provide 3-4 personalized health insights and suggestions. Be supportive, informative, and focus on patterns that could help the user understand their cycle better.

Cycle History (last 6 cycles):
${JSON.stringify(cycleSummary, null, 2)}

Recent Symptom Frequency (last 30 days):
${JSON.stringify(symptomFrequency, null, 2)}

Recent Mood Patterns (last 30 days):
${JSON.stringify(moodFrequency, null, 2)}

Please provide insights in the following JSON format:
[
  {
    "type": "cycle_prediction" | "symptom_pattern" | "health_tip" | "ovulation_prediction",
    "title": "Short title",
    "content": "Detailed insight or suggestion",
    "severity": "info" | "warning" | "urgent"
  }
]

Focus on:
1. Cycle regularity and predictions
2. Common symptom patterns and how to manage them
3. Lifestyle suggestions based on their patterns
4. When to consider consulting a healthcare provider

Keep insights positive, actionable, and evidence-based.`,
        },
      ],
    });

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";

    // Parse AI response
    let insightsData: any[];
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      insightsData = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      // Fallback to basic insights
      insightsData = [
        {
          type: "cycle_prediction",
          title: "Tracking Your Cycle",
          content: "Continue tracking your cycle regularly to get more personalized insights. The more data you log, the better we can predict your patterns.",
          severity: "info",
        },
      ];
    }

    // Save insights to database
    const savedInsights = await Promise.all(
      insightsData.map((insight) =>
        prisma.healthInsight.create({
          data: {
            userId: session.user.id,
            type: insight.type,
            title: insight.title,
            content: insight.content,
            severity: insight.severity || "info",
            cycleIds: cycles.map((c) => c.id),
          },
        })
      )
    );

    return NextResponse.json(savedInsights);
  } catch (error) {
    console.error("Error generating insights:", error);
    return NextResponse.json(
      { error: "Failed to generate insights" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { insightId } = body;

    const insight = await prisma.healthInsight.findFirst({
      where: { id: insightId, userId: session.user.id },
    });

    if (!insight) {
      return NextResponse.json({ error: "Insight not found" }, { status: 404 });
    }

    const updated = await prisma.healthInsight.update({
      where: { id: insightId },
      data: { isRead: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error marking insight as read:", error);
    return NextResponse.json(
      { error: "Failed to update insight" },
      { status: 500 }
    );
  }
}
