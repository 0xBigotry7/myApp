import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { disconnectGoogleDrive } from "@/lib/google-drive";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await disconnectGoogleDrive(session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error disconnecting Google Drive:", error);
    return NextResponse.json(
      { error: "Failed to disconnect" },
      { status: 500 }
    );
  }
}
