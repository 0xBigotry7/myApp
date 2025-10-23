import { cookies } from "next/headers";
import type { Locale } from "./i18n";

export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("locale");
  return (localeCookie?.value as Locale) || "en";
}
