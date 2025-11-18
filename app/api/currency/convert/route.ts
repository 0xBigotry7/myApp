import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Free currency conversion using exchangerate-api.com
// You can sign up for free at https://www.exchangerate-api.com/
const API_KEY = process.env.EXCHANGE_RATE_API_KEY || "";
const BASE_URL = "https://v6.exchangerate-api.com/v6";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { amount, from, to } = body;

    if (!amount || !from || !to) {
      return NextResponse.json(
        { error: "Missing required fields: amount, from, to" },
        { status: 400 }
      );
    }

    // If same currency, no conversion needed
    if (from === to) {
      return NextResponse.json({
        success: true,
        from,
        to,
        amount,
        convertedAmount: amount,
        rate: 1,
      });
    }

    // If no API key, use fallback rates
    if (!API_KEY) {
      const fallbackRates: Record<string, Record<string, number>> = {
        USD: { EUR: 0.92, GBP: 0.79, JPY: 149.5, THB: 34.5, CNY: 7.24 },
        EUR: { USD: 1.09, GBP: 0.86, JPY: 162.5, THB: 37.5, CNY: 7.88 },
        GBP: { USD: 1.27, EUR: 1.16, JPY: 189.2, THB: 43.8, CNY: 9.19 },
        JPY: { USD: 0.0067, EUR: 0.0062, GBP: 0.0053, THB: 0.23, CNY: 0.048 },
        THB: { USD: 0.029, EUR: 0.027, GBP: 0.023, JPY: 4.33, CNY: 0.21 },
        CNY: { USD: 0.138, EUR: 0.127, GBP: 0.109, JPY: 20.65, THB: 4.76 },
      };

      const rate = fallbackRates[from]?.[to] || 1;
      const convertedAmount = amount * rate;

      return NextResponse.json({
        success: true,
        from,
        to,
        amount,
        convertedAmount,
        rate,
        note: "Using fallback rates. Set EXCHANGE_RATE_API_KEY for live rates.",
      });
    }

    // Fetch live rates
    const response = await fetch(
      `${BASE_URL}/${API_KEY}/pair/${from}/${to}/${amount}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch exchange rate");
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      from,
      to,
      amount,
      convertedAmount: data.conversion_result,
      rate: data.conversion_rate,
    });
  } catch (error) {
    console.error("Error converting currency:", error);
    return NextResponse.json(
      { error: "Failed to convert currency" },
      { status: 500 }
    );
  }
}

// GET latest rates for a base currency
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const base = searchParams.get("base") || "USD";

    // If no API key, return fallback rates
    if (!API_KEY) {
      const fallbackRates: Record<string, any> = {
        USD: { EUR: 0.92, GBP: 0.79, JPY: 149.5, THB: 34.5, CNY: 7.24, USD: 1 },
        EUR: { USD: 1.09, GBP: 0.86, JPY: 162.5, THB: 37.5, CNY: 7.88, EUR: 1 },
        GBP: { USD: 1.27, EUR: 1.16, JPY: 189.2, THB: 43.8, CNY: 9.19, GBP: 1 },
        JPY: { USD: 0.0067, EUR: 0.0062, GBP: 0.0053, THB: 0.23, CNY: 0.048, JPY: 1 },
        THB: { USD: 0.029, EUR: 0.027, GBP: 0.023, JPY: 4.33, CNY: 0.21, THB: 1 },
        CNY: { USD: 0.138, EUR: 0.127, GBP: 0.109, JPY: 20.65, THB: 4.76, CNY: 1 },
      };

      return NextResponse.json({
        success: true,
        base,
        rates: fallbackRates[base] || fallbackRates.USD,
        note: "Using fallback rates. Set EXCHANGE_RATE_API_KEY for live rates.",
      });
    }

    const response = await fetch(`${BASE_URL}/${API_KEY}/latest/${base}`);

    if (!response.ok) {
      throw new Error("Failed to fetch exchange rates");
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      base,
      rates: data.conversion_rates,
      lastUpdate: data.time_last_update_utc,
    });
  } catch (error) {
    console.error("Error fetching exchange rates:", error);
    return NextResponse.json(
      { error: "Failed to fetch exchange rates" },
      { status: 500 }
    );
  }
}
