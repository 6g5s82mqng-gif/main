import { processCompletedInvestments } from "$lib/utils/server/investment";

// This job can be run periodically (e.g., every hour or daily)
// to process completed investments and update user balances

export async function runInvestmentProcessor(): Promise<void> {
  console.log("Starting investment processor job...");

  try {
    await processCompletedInvestments();
    console.log("Investment processor job completed successfully");
  } catch (error) {
    console.error("Investment processor job failed:", error);
  }
}

// Example of how to schedule this job (you can use cron-job, node-cron, or similar)
// For production, you might want to use a proper job scheduler like Bull, Agenda, etc.

/*
import cron from 'node-cron';

// Run every hour
cron.schedule('0 * * * *', async () => {
    await runInvestmentProcessor();
});

// Or run daily at midnight
cron.schedule('0 0 * * *', async () => {
    await runInvestmentProcessor();
});
*/

// Manual trigger for testing or admin purposes
export async function triggerInvestmentProcessing(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    await runInvestmentProcessor();
    return {
      success: true,
      message: "Investment processing completed successfully",
    };
  } catch (error) {
    console.error("Manual investment processing failed:", error);
    return { success: false, message: "Investment processing failed" };
  }
}
