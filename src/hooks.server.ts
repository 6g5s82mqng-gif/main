import {
  processCompletedInvestments,
  processPartialProfits,
} from "$lib/utils/server/investment";

let cronJobInitialized = false;

export async function handle({ event, resolve }) {
  // Handle CORS
  const allowedOrigins = [
    "http://localhost:3001",
    "http://localhost:5173",
    "http://localhost:4173",
    // Add production domains here when needed
  ];

  const origin = event.request.headers.get("origin");
  const isAllowedOrigin = origin && allowedOrigins.includes(origin);

  const corsHeaders = {
    "Access-Control-Allow-Origin": isAllowedOrigin
      ? origin
      : "http://localhost:3001",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, uwu",
    "Access-Control-Allow-Credentials": "true",
  };

  // Handle preflight requests
  if (event.request.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  // Only initialize cron jobs once
  if (!cronJobInitialized) {
    console.log("🚀 Initializing cron jobs (once per server start)...");

    // For testing: run every 30 seconds
    // For production: change to 3600000 (1 hour) or 86400000 (1 day)
    const COMPLETED_INVESTMENT_INTERVAL = 30 * 1000; // 30 seconds
    const PARTIAL_PROFIT_INTERVAL = 15 * 1000; // 15 seconds

    // Start completed investment processing
    setInterval(async () => {
      try {
        console.log("🔄 Running completed investment processing job...");
        await processCompletedInvestments();
        console.log("✅ Completed investment processing job finished");
      } catch (error) {
        console.error("❌ Completed investment processing job failed:", error);
      }
    }, COMPLETED_INVESTMENT_INTERVAL);

    // Start partial profit processing
    setInterval(async () => {
      try {
        console.log("💰 Running partial profit processing job...");
        await processPartialProfits();
        console.log("✅ Partial profit processing job finished");
      } catch (error) {
        console.error("❌ Partial profit processing job failed:", error);
      }
    }, PARTIAL_PROFIT_INTERVAL);

    // Cleanup on server shutdown
    process.on("SIGTERM", () => {
      console.log("🧹 Server shutting down - cron jobs stopped");
    });
    process.on("SIGINT", () => {
      console.log("🧹 Server interrupted - cron jobs stopped");
    });

    cronJobInitialized = true;
    console.log("✅ Cron jobs initialized successfully");
    console.log(
      `⏰ Schedule: Completed investments every ${COMPLETED_INVESTMENT_INTERVAL / 1000}s, Partial profits every ${PARTIAL_PROFIT_INTERVAL / 1000}s`,
    );
  }

  // Continue with normal request handling
  const response = await resolve(event);

  // Add CORS headers to all responses
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}
