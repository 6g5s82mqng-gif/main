import Investment from "$lib/models/Investment";
import User from "$lib/models/User";
import connectDB from "$lib/database/connection";
import { calculateCurrentProfit } from "$lib/utils/investment";

export async function processCompletedInvestments(): Promise<void> {
  try {
    await connectDB();

    const now = new Date();

    // Find all active investments that have completed
    const completedInvestments = await Investment.find({
      status: "active",
      endDate: { $lte: now },
    });

    console.log(
      `Found ${completedInvestments.length} completed investments to process`,
    );

    for (const investment of completedInvestments) {
      // Update investment status
      investment.status = "completed";
      investment.profit = investment.estimatedIncome;
      await investment.save();

      // Find user and update their balance and profit
      const user = await User.findOne({ userId: investment.userId });
      if (user) {
        // Return principal + profit to user balance
        const returnAmount = investment.amount + investment.profit;
        user.available_balance += returnAmount;
        user.profit_loss += investment.profit;

        console.log(
          `User ${user.userId}: +${returnAmount} THB (principal: ${investment.amount}, profit: ${investment.profit})`,
        );
        await user.save();

        // Create new investment if auto-resubmit is enabled
        if (
          investment.autoResubmit &&
          user.available_balance >= investment.amount
        ) {
          const newInvestment = new Investment({
            userId: investment.userId,
            amount: investment.amount,
            duration: investment.duration,
            rewardPercentage: investment.rewardPercentage,
            autoResubmit: investment.autoResubmit,
          });

          await newInvestment.save();

          // Deduct the amount from user balance again
          user.available_balance -= investment.amount;
          await user.save();

          console.log(
            `Auto-resubmitted investment: ${investment.amount} THB for user ${user.userId}`,
          );
        } else if (investment.autoResubmit) {
          console.log(
            `Auto-resubmit failed for user ${user.userId}: insufficient balance`,
          );
        }
      } else {
        console.error(`User not found for investment ${investment._id}`);
      }
    }

    console.log(
      `Successfully processed ${completedInvestments.length} completed investments`,
    );
  } catch (error) {
    console.error("Error processing completed investments:", error);
  }
}

export async function getUserInvestmentSummary(userId: number): Promise<{
  totalInvested: number;
  activeInvestments: number;
  totalProfit: number;
  totalEstimatedIncome: number;
}> {
  try {
    await connectDB();

    const investments = await Investment.find({ userId });

    const totalInvested = investments.reduce(
      (sum: number, inv: any) => sum + inv.amount,
      0,
    );
    const activeInvestments = investments.filter(
      (inv: any) => inv.status === "active",
    ).length;
    const totalEstimatedIncome = investments.reduce(
      (sum: number, inv: any) => sum + inv.estimatedIncome,
      0,
    );

    // Calculate current profits including partial profits for active investments
    const totalProfit = investments.reduce((sum: number, inv: any) => {
      const currentProfit = calculateCurrentProfit(
        inv.startDate,
        inv.endDate,
        inv.estimatedIncome,
        inv.status,
      );
      return sum + currentProfit;
    }, 0);

    return {
      totalInvested,
      activeInvestments,
      totalProfit,
      totalEstimatedIncome,
    };
  } catch (error) {
    console.error("Error getting investment summary:", error);
    return {
      totalInvested: 0,
      activeInvestments: 0,
      totalProfit: 0,
      totalEstimatedIncome: 0,
    };
  }
}

// New function to process partial profits for active investments
export async function processPartialProfits(): Promise<void> {
  try {
    await connectDB();

    const now = new Date();

    // Find all active investments
    const activeInvestments = await Investment.find({
      status: "active",
      endDate: { $gt: now },
    });

    console.log(
      `Processing partial profits for ${activeInvestments.length} active investments`,
    );

    for (const investment of activeInvestments) {
      // Calculate current partial profit
      const currentProfit = calculateCurrentProfit(
        investment.startDate,
        investment.endDate,
        investment.estimatedIncome,
        investment.status,
      );

      // Only update if profit has changed (to avoid unnecessary DB writes)
      if (Math.abs(currentProfit - investment.profit) > 0.01) {
        investment.profit = currentProfit;
        await investment.save();
      }
    }

    console.log("Partial profit processing completed");
  } catch (error) {
    console.error("Error processing partial profits:", error);
  }
}
