import { json, type RequestHandler } from "@sveltejs/kit";
import connectDB from "$lib/database/connection";
import Investment from "$lib/models/Investment";
import { adminAuthMiddleware } from "$lib/utils/admin";

// GET - Fetch all investment records with pagination and filtering
export const GET: RequestHandler = async ({ request }) => {
  const authResponse = adminAuthMiddleware(request.headers);
  if (authResponse) return authResponse;

  try {
    await connectDB();

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const userId = url.searchParams.get("userId") || "";
    const status = url.searchParams.get("status") || "all";
    const sortBy = url.searchParams.get("sortBy") || "createdAt";
    const sortOrder = url.searchParams.get("sortOrder") || "desc";

    const skip = (page - 1) * limit;

    // Build query
    let query: any = {};

    // Filter by user ID if provided
    if (userId) {
      const numericUserId = parseInt(userId);
      if (!isNaN(numericUserId)) {
        query.userId = numericUserId;
      }
    }

    // Filter by status
    if (status !== "all") {
      query.status = status;
    }

    // Sort options
    const sort: any = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Get investments
    const investments = await Investment.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalInvestments = await Investment.countDocuments(query);

    return json({
      success: true,
      data: {
        investments,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalInvestments / limit),
          totalInvestments,
          limit,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching investment plans:", error);
    return json(
      {
        success: false,
        message: "Failed to fetch investment plans",
      },
      { status: 500 }
    );
  }
};

// POST - Create new investment plan for user
export const POST: RequestHandler = async ({ request }) => {
  const authResponse = adminAuthMiddleware(request.headers);
  if (authResponse) return authResponse;

  try {
    await connectDB();

    const { userId, amount, duration, rewardPercentage, autoResubmit = false } = await request.json();

    // Validation
    if (!userId || !amount || !duration || rewardPercentage === undefined) {
      return json(
        {
          success: false,
          message: "userId, amount, duration, and rewardPercentage are required",
        },
        { status: 400 }
      );
    }

    const numericUserId = parseInt(userId);
    const numericAmount = parseFloat(amount);

    if (isNaN(numericUserId) || isNaN(numericAmount)) {
      return json(
        {
          success: false,
          message: "userId and amount must be valid numbers",
        },
        { status: 400 }
      );
    }

    if (numericAmount <= 0) {
      return json(
        {
          success: false,
          message: "Amount must be greater than 0",
        },
        { status: 400 }
      );
    }

    if (![1, 7, 15, 30, 60, 90].includes(duration)) {
      return json(
        {
          success: false,
          message: "Duration must be one of: 1, 7, 15, 30, 60, 90 days",
        },
        { status: 400 }
      );
    }

    // Check if user exists
    const User = (await import("$lib/models/User")).default;
    const user = await User.findOne({ userId: numericUserId });
    if (!user) {
      return json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 }
      );
    }

    // Create new investment
    const newInvestment = new Investment({
      userId: numericUserId,
      amount: numericAmount,
      duration,
      rewardPercentage,
      autoResubmit,
    });

    await newInvestment.save();

    return json(
      {
        success: true,
        message: "Investment plan created successfully",
        data: newInvestment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating investment plan:", error);
    return json(
      {
        success: false,
        message: "Failed to create investment plan",
      },
      { status: 500 }
    );
  }
};

// PUT - Update investment plans (bulk update)
export const PUT: RequestHandler = async ({ request }) => {
  const authResponse = adminAuthMiddleware(request.headers);
  if (authResponse) return authResponse;

  try {
    await connectDB();

    const { investmentId, updates } = await request.json();

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

    // Allowed updates
    const allowedUpdates = [
      "status",
      "autoResubmit",
      "amount",
      "duration",
      "rewardPercentage",
    ];

    const filteredUpdates: any = {};
    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
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

// DELETE - Delete investment plan
export const DELETE: RequestHandler = async ({ request }) => {
  const authResponse = adminAuthMiddleware(request.headers);
  if (authResponse) return authResponse;

  try {
    await connectDB();

    const url = new URL(request.url);
    const investmentId = url.searchParams.get("investmentId");

    if (!investmentId) {
      return json(
        {
          success: false,
          message: "Investment ID is required",
        },
        { status: 400 }
      );
    }

    const deletedInvestment = await Investment.findByIdAndDelete(investmentId);

    if (!deletedInvestment) {
      return json(
        {
          success: false,
          message: "Investment plan not found",
        },
        { status: 404 }
      );
    }

    // If investment was active, refund the amount to user
    if (deletedInvestment.status === "active") {
      const User = (await import("$lib/models/User")).default;
      const user = await User.findOne({ userId: deletedInvestment.userId });

      if (user) {
        user.available_balance += deletedInvestment.amount;
        await user.save();
      }
    }

    return json({
      success: true,
      message: "Investment plan deleted successfully",
      data: deletedInvestment,
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
