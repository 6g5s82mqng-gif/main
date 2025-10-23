import { json, type RequestHandler } from "@sveltejs/kit";
import connectDB from "$lib/database/connection";
import InvestmentPlan from "$lib/models/InvestmentPlan";
import { seedInvestmentPlans } from "$lib/migrations/seedInvestmentPlans";

export const GET: RequestHandler = async () => {
  try {
    await connectDB();

    // Auto-seed if no investment plans exist
    const existingPlans = await InvestmentPlan.find({});
    if (existingPlans.length === 0) {
      await seedInvestmentPlans();
    }

    // Get all investment plans, sorted by duration
    const investmentPlans = await InvestmentPlan.find({})
      .sort({ duration: 1 })
      .lean();

    return json({
      success: true,
      data: investmentPlans,
    });
  } catch (error) {
    console.error("Error fetching investment plans:", error);
    return json(
      {
        success: false,
        message: "Failed to fetch investment plans",
      },
      { status: 500 },
    );
  }
};
