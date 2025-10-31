import { google } from "googleapis";
import { prisma } from "./prisma";

const SCOPES = ["https://www.googleapis.com/auth/drive.file"];

// Initialize OAuth2 client
export function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/auth/google-drive/callback`
  );
}

// Generate OAuth URL for user to authorize
export function getAuthUrl(userId: string) {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    state: userId, // Pass userId to identify user after callback
    prompt: "consent", // Force consent screen to get refresh token
  });
}

// Exchange authorization code for tokens
export async function getTokensFromCode(code: string) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

// Get authenticated Drive client for a user
export async function getDriveClient(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { googleDriveRefreshToken: true },
  });

  if (!user?.googleDriveRefreshToken) {
    throw new Error("User has not connected Google Drive");
  }

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    refresh_token: user.googleDriveRefreshToken,
  });

  return google.drive({ version: "v3", auth: oauth2Client });
}

// Create or get the shared folder for trip photos
export async function getOrCreateTripPhotosFolder(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { googleDriveFolderId: true },
  });

  // If folder already exists, return it
  if (user?.googleDriveFolderId) {
    return user.googleDriveFolderId;
  }

  // Create new folder
  const drive = await getDriveClient(userId);

  const folderMetadata = {
    name: "Travel App Photos",
    mimeType: "application/vnd.google-apps.folder",
  };

  const folder = await drive.files.create({
    requestBody: folderMetadata,
    fields: "id",
  });

  const folderId = folder.data.id!;

  // Save folder ID to database
  await prisma.user.update({
    where: { id: userId },
    data: { googleDriveFolderId: folderId },
  });

  return folderId;
}

// Upload a file to Google Drive
export async function uploadToGoogleDrive(
  userId: string,
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  const drive = await getDriveClient(userId);
  const folderId = await getOrCreateTripPhotosFolder(userId);

  const fileMetadata = {
    name: fileName,
    parents: [folderId],
  };

  const media = {
    mimeType,
    body: require("stream").Readable.from(fileBuffer),
  };

  const file = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: "id, webViewLink, webContentLink",
  });

  // Make file publicly accessible (viewable by anyone with link)
  await drive.permissions.create({
    fileId: file.data.id!,
    requestBody: {
      role: "reader",
      type: "anyone",
    },
  });

  // Return a direct image URL
  // Format: https://drive.google.com/uc?export=view&id=FILE_ID
  return `https://drive.google.com/uc?export=view&id=${file.data.id}`;
}

// Check if user has connected Google Drive
export async function isGoogleDriveConnected(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { googleDriveRefreshToken: true },
  });

  return !!user?.googleDriveRefreshToken;
}

// Disconnect Google Drive (remove tokens)
export async function disconnectGoogleDrive(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      googleDriveRefreshToken: null,
      googleDriveFolderId: null,
    },
  });
}
