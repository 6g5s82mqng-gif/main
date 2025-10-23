import { json, type RequestHandler } from "@sveltejs/kit";
import connectDB from "$lib/database/connection";
import Investment from "$lib/models/Investment";
import { adminAuthMiddleware } from "$lib/utils/admin";

// GET - Get single investment plan by ID
export const GET: RequestHandler = async ({ params, request }) => {
  const authResponse = adminAuthMiddleware(request.headers);
  if (authResponse) return authResponse;

  try {
    await connectDB();

    const { investmentId } = params;

    if (!investmentId) {
      return json(
        {
          success: false,
          message: "Investment ID is required",
        },
        { status: 400 }
      );
    }

    const investment = await Investment.findById(investmentId);

    if (!investment) {
      return json(
        {
          success: false,
          message: "Investment plan not found",
        },
        { status: 404 }
      );
    }

    // Get user information for this investment
    const User = (await import("$lib/models/User")).default;
    const user = await User.findOne({ userId: investment.userId }).select("-password");

    const investmentWithUser = {
      ...investment.toObject(),
      user: user ? {
        userId: user.userId,
        username: user.username,
        phone: user.phone,
        bank: user.bank,
      } : null,
    };

    return json({
      success: true,
      data: investmentWithUser,
    });
  } catch (error) {
    console.error("Error fetching investment plan:", error);
    return json(
      {
        success: false,
        message: "Failed to fetch investment plan",
      },
      { status: 500 }
    );
  }
};

// PUT - Update single investment plan
export const PUT: RequestHandler = async ({ params, request }) => {
  const authResponse = adminAuthMiddleware(request.headers);
  if (authResponse) return authResponse;

  try {
    await connectDB();

    const { investmentId } = params;

    if (!investmentId) {
      return json(
        {
          success: false,
          message: "Investment ID is required",
        },
        { status: 400 }
      );
    }

    const investment = await Investment.findById(investmentId);

    if (!investment) {
      return json(
        {
          success: false,
          message: "Investment plan not found",
        },
        { status: 404 }
      );
    }

    const updates = await request.json();

    // Allowed updates
    const allowedUpdates = [
      "status",
      "autoResubmit",
      "amount",
      "duration",
      "rewardPercentage",
      "profit",
      "estimatedIncome",
    ];

    const filteredUpdates: any = {};
    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    }

    // Validate updates
    if (updates.amount !== undefined && updates.amount <= 0) {
      return json(
        {
          success: false,
          message: "Amount must be greater than 0",
        },
        { status: 400 }
      );
    }

    if (updates.duration !== undefined && ![1, 7, 15, 30, 60, 90].includes(updates.duration)) {
      return json(
        {
          success: false,
          message: "Duration must be one of: 1, 7, 15, 30, 60, 90 days",
        },
        { status: 400 }
      );
    }

    if (updates.rewardPercentage !== undefined && (updates.rewardPercentage < 0 || updates.rewardPercentage > 100)) {
      return json(
        {
          success: false,
          message: "Reward percentage must be between 0 and 100",
        },
        { status: 400 }
      );
    }

    // If updating status to completed, process the completion
    if (updates.status === "completed" && investment.status !== "completed") {
      const User = (await import("$lib/models/User")).default;
      const user = await User.findOne({ userId: investment.userId });

      if (user) {
        // Return principal + profit to user balance
        const returnAmount = investment.amount + investment.estimatedIncome;
        user.available_balance += returnAmount;
        user.profit_loss += investment.estimatedIncome;
        await user.save();
      }

      filteredUpdates.profit = investment.estimatedIncome;
    }

    // If updating status from completed back to active, deduct from user balance
    if (updates.status === "active" && investment.status === "completed") {
      const User = (await import("$lib/models/User")).default;
      const user = await User.findOne({ userId: investment.userId });

      if (user) {
        const deductAmount = investment.amount + investment.profit;
        if (user.available_balance >= deductAmount) {
          user.available_balance -= deductAmount;
          user.profit_loss -= investment.profit;
          await user.save();
        } else {
          return json(
            {
              success: false,
              message: "Insufficient user balance to reactivate investment",
            },
            { status: 400 }
          );
        }
      }
    }

    // Update investment
    Object.assign(investment, filteredUpdates);
    await investment.save();

    return json({
      success: true,
      message: "Investment plan updated successfully",
      data: investment,
    });
  } catch (error) {
    console.error("Error updating investment plan:", error);
    return json(
      {
        success: false,
        message: "Failed to update investment plan",
      },
      { status: 500 }
    );
  }
};

// DELETE - Delete single investment plan
export const DELETE: RequestHandler = async ({ params, request }) => {
  const authResponse = adminAuthMiddleware(request.headers);
  if (authResponse) return authResponse;

  try {
    await connectDB();

    const { investmentId } = params;

    if (!investmentId) {
      return json(
        {
          success: false,
          message: "Investment ID is required",
        },
        { status: 400 }
      );
    }

    const investment = await Investment.findById(investmentId);

    if (!investment) {
      return json(
        {
          success: false,
          message: "Investment plan not found",
        },
        { status: 404 }
      );
    }

    // If investment was active, refund the amount to user
    if (investment.status === "active") {
      const User = (await import("$lib/models/User")).default;
      const user = await User.findOne({ userId: investment.userId });

      if (user) {
        user.available_balance += investment.amount;
        await user.save();
      }
    }

    // Delete the investment
    await Investment.findByIdAndDelete(investmentId);

    return json({
      success: true,
      message: "Investment plan deleted successfully",
      data: investment,
    });
  } catch (error) {
    console.error("Error deleting investment plan:", error);
    return json(
      {
        success: false,
        message: "Failed to delete investment plan",
      },
      { status: 500 }
    );
  }
};
