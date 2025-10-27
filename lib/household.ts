import { prisma } from "./prisma";

/**
 * Get all user IDs in the household.
 * Since this is a 2-person household app (you and your wife),
 * this returns both user IDs to enable shared financial views.
 */
export async function getHouseholdUserIds(): Promise<string[]> {
  const users = await prisma.user.findMany({
    select: { id: true },
  });
  return users.map((u) => u.id);
}

/**
 * Get user color for visual identification.
 * Assigns consistent colors to users for UI elements.
 */
export function getUserColor(userId: string, users: Array<{ id: string; name: string }>): string {
  const userIndex = users.findIndex((u) => u.id === userId);
  const colors = [
    "#3b82f6", // blue for first user
    "#ec4899", // pink for second user
    "#8b5cf6", // purple for additional users
    "#10b981", // green
    "#f59e0b", // orange
  ];
  return colors[userIndex] || colors[0];
}

/**
 * Get user badge info for visual identification.
 */
export function getUserBadge(userId: string, users: Array<{ id: string; name: string }>): { color: string; initial: string; name: string } {
  const user = users.find((u) => u.id === userId);
  const userIndex = users.findIndex((u) => u.id === userId);

  const colors = [
    { bg: "#3b82f6", text: "#ffffff" }, // blue
    { bg: "#ec4899", text: "#ffffff" }, // pink
    { bg: "#8b5cf6", text: "#ffffff" }, // purple
    { bg: "#10b981", text: "#ffffff" }, // green
    { bg: "#f59e0b", text: "#ffffff" }, // orange
  ];

  const colorSet = colors[userIndex] || colors[0];

  return {
    color: colorSet.bg,
    initial: user?.name?.charAt(0).toUpperCase() || "?",
    name: user?.name || "Unknown",
  };
}
