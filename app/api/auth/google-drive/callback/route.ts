import { NextRequest, NextResponse } from "next/server";
import { getTokensFromCode } from "@/lib/google-drive";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get("code");
    const userId = searchParams.get("state"); // userId passed as state
    const error = searchParams.get("error");

    if (error) {
      // User denied access or something went wrong
      return NextResponse.redirect(
        new URL(`/settings?error=${encodeURIComponent("Google Drive connection was cancelled")}`, req.url)
      );
    }

    if (!code || !userId) {
      return NextResponse.redirect(
        new URL("/settings?error=Invalid+callback", req.url)
      );
    }

    // Exchange code for tokens
    const tokens = await getTokensFromCode(code);

    if (!tokens.refresh_token) {
      return NextResponse.redirect(
        new URL("/settings?error=No+refresh+token+received", req.url)
      );
    }

    // Save refresh token to database
    await prisma.user.update({
      where: { id: userId },
      data: {
        googleDriveRefreshToken: tokens.refresh_token,
      },
    });

    // Redirect back to settings with success message
    return NextResponse.redirect(
      new URL("/settings?success=Google+Drive+connected+successfully", req.url)
    );
  } catch (error) {
    console.error("Error in Google Drive callback:", error);
    return NextResponse.redirect(
      new URL("/settings?error=Failed+to+connect+Google+Drive", req.url)
    );
  }
}
