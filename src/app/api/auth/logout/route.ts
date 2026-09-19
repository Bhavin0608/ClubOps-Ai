import { clearSessionCookie } from "@/lib/auth";
import { jsonResponse } from "@/lib/api";

export async function POST() {
  await clearSessionCookie();
  return jsonResponse({ success: true });
}
