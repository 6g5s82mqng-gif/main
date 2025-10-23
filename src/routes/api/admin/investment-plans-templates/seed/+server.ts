import { json, type RequestHandler } from "@sveltejs/kit";
import connectDB from "$lib/database/connection";
import { seedInvestmentPlans, resetAndSeedInvestmentPlans } from "$lib/migrations/seedInvestmentPlans";
import { adminAuthMiddleware } from "$lib/utils/admin";

// POST - Seed or reset default investment plans
export const POST: RequestHandler = async ({ request }) => {
  const authResponse = adminAuthMiddleware(request.headers);
  if (authResponse) return authResponse;

  try {
    await connectDB();

    const { action } = await request.json();

    let result;
    if (action === "seed") {
      result = await seedInvestmentPlans();
      return json({
        success: true,
        message: "Default investment plans seeded successfully",
        data: result,
      });
    } else if (action === "reset") {
      result = await resetAndSeedInvestmentPlans();
      return json({
        success: true,
        message: "Investment plans reset and seeded successfully",
        data: result,
      });
    } else {
      return json(
        {
          success: false,
          message: "Invalid action. Use 'seed' to add default plans or 'reset' to clear and reseed.",
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error seeding investment plans:", error);
    return json(
      {
        success: false,
        message: "Failed to seed investment plans",
      },
      { status: 500 }
    );
  }
};
