/**
 * Self-ping utility to keep Render free web services alive by preventing
 * the 15-minute inactivity spin-down.
 */
export function initSelfPing() {
  // Only run in production
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  // Render automatically populates RENDER_EXTERNAL_URL (e.g., https://clubops-ai.onrender.com)
  const baseUrl =
    process.env.APP_URL ||
    process.env.RENDER_EXTERNAL_URL;

  if (!baseUrl) {
    console.warn(
      "[Self-Ping] Neither APP_URL nor RENDER_EXTERNAL_URL is defined. Self-ping inactive."
    );
    return;
  }

  const cleanBase = baseUrl.replace(/\/+$/, "");
  const pingUrl = `${cleanBase}/api/health`;

  // Render free tier spins down after 15 minutes (900,000 ms).
  // Pinging every 10 minutes (600,000 ms) keeps the service active.
  const INTERVAL_MS = 10 * 60 * 1000;

  console.log(`[Self-Ping] Configured. Pinging ${pingUrl} every 10 minutes.`);

  // Initial ping 45 seconds after startup to verify connectivity
  setTimeout(() => {
    performPing(pingUrl);
  }, 45 * 1000);

  // Recurring ping
  setInterval(() => {
    performPing(pingUrl);
  }, INTERVAL_MS);
}

async function performPing(url: string) {
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "ClubOps-Self-Ping/1.0",
      },
      cache: "no-store",
    });

    if (res.ok) {
      console.log(`[Self-Ping] Ping successful (${res.status}) at ${new Date().toISOString()}`);
    } else {
      console.warn(`[Self-Ping] Received non-200 status (${res.status}) at ${new Date().toISOString()}`);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[Self-Ping] Ping failed: ${message}`);
  }
}
