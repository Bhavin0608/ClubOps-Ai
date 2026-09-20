export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initSelfPing } = await import("@/lib/self-ping");
    initSelfPing();
  }
}
