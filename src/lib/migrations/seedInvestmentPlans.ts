import connectDB from "$lib/database/connection";
import InvestmentPlan from "$lib/models/InvestmentPlan";

const defaultInvestmentPlans = [
  {
    duration: 1,
    label: "1D",
    rewardPercentage: 0.1,
    minAmount: 1,
    maxAmount: 10000,
  },
  {
    duration: 7,
    label: "7D",
    rewardPercentage: 1,
    minAmount: 1,
    maxAmount: 50000,
  },
  {
    duration: 15,
    label: "15D",
    rewardPercentage: 2.5,
    minAmount: 1,
    maxAmount: 100000,
  },
  {
    duration: 30,
    label: "30D",
    rewardPercentage: 4.5,
    minAmount: 1,
    maxAmount: 200000,
  },
  {
    duration: 60,
    label: "60D",
    rewardPercentage: 10,
    minAmount: 1,
    maxAmount: 500000,
  },
  {
    duration: 90,
    label: "90D",
    rewardPercentage: 19.5,
    minAmount: 1,
    maxAmount: 1000000,
  },
];

export async function seedInvestmentPlans() {
  try {
    await connectDB();

    // Check if investment plans already exist
    const existingPlans = await InvestmentPlan.find({});

    if (existingPlans.length > 0) {
      console.log("Investment plans already exist. Skipping seeding.");
      return existingPlans;
    }

    // Insert default investment plans
    const seededPlans = await InvestmentPlan.insertMany(defaultInvestmentPlans);
    console.log(`Successfully seeded ${seededPlans.length} investment plans`);

    return seededPlans;
  } catch (error) {
    console.error("Error seeding investment plans:", error);
    throw error;
  }
}

// Function to reset and reseed
export async function resetAndSeedInvestmentPlans() {
  try {
    await connectDB();

    // Delete all existing investment plans
    await InvestmentPlan.deleteMany({});
    console.log("Cleared all existing investment plans");

    // Reinsert default plans
    const seededPlans = await InvestmentPlan.insertMany(defaultInvestmentPlans);
    console.log(`Successfully reseeded ${seededPlans.length} investment plans`);

    return seededPlans;
  } catch (error) {
    console.error("Error resetting and seeding investment plans:", error);
    throw error;
  }
}
