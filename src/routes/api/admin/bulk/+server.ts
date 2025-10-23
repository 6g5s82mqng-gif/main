import { json, type RequestHandler } from "@sveltejs/kit";
import connectDB from "$lib/database/connection";
import User from "$lib/models/User";
import Investment from "$lib/models/Investment";
import { adminAuthMiddleware } from "$lib/utils/admin";

// POST - Bulk operations on users and investments
export const POST: RequestHandler = async ({ request }) => {
  const authResponse = adminAuthMiddleware(request.headers);
  if (authResponse) return authResponse;

  try {
    await connectDB();

    const { operation, type, data } = await request.json();

    if (!operation || !type || !data) {
      return json(
        {
          success: false,
          message: "operation, type, and data are required",
        },
        { status: 400 },
      );
    }

    switch (type) {
      case "users":
        return await handleUserBulkOperation(operation, data);
      case "investments":
        return await handleInvestmentBulkOperation(operation, data);
      default:
        return json(
          {
            success: false,
            message: "Invalid type. Must be 'users' or 'investments'",
          },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("Error in bulk operation:", error);
    return json(
      {
        success: false,
        message: "Failed to perform bulk operation",
      },
      { status: 500 },
    );
  }
};

// Handle bulk user operations
async function handleUserBulkOperation(operation: string, data: any) {
  switch (operation) {
    case "create":
      return await bulkCreateUsers(data);
    case "update":
      return await bulkUpdateUsers(data);
    case "delete":
      return await bulkDeleteUsers(data);
    case "updateBalance":
      return await bulkUpdateUserBalance(data);
    default:
      return json(
        {
          success: false,
          message:
            "Invalid user operation. Must be 'create', 'update', 'delete', or 'updateBalance'",
        },
        { status: 400 },
      );
  }
}

// Handle bulk investment operations
async function handleInvestmentBulkOperation(operation: string, data: any) {
  switch (operation) {
    case "create":
      return await bulkCreateInvestments(data);
    case "update":
      return await bulkUpdateInvestments(data);
    case "delete":
      return await bulkDeleteInvestments(data);
    case "updateStatus":
      return await bulkUpdateInvestmentStatus(data);
    default:
      return json(
        {
          success: false,
          message:
            "Invalid investment operation. Must be 'create', 'update', 'delete', or 'updateStatus'",
        },
        { status: 400 },
      );
  }
}

// Bulk create users
async function bulkCreateUsers(users: any[]) {
  if (!Array.isArray(users) || users.length === 0) {
    return json(
      {
        success: false,
        message: "Users array is required and cannot be empty",
      },
      { status: 400 },
    );
  }

  const results = {
    success: [],
    failed: [],
  };

  // Get the highest userId to start from
  const lastUser = await User.findOne().sort({ userId: -1 });
  let nextUserId = lastUser ? lastUser.userId + 1 : 1;

  for (const userData of users) {
    try {
      const {
        username,
        password,
        phone,
        available_balance = 0,
        profit_loss = 0,
        bank,
      } = userData;

      // Validation
      if (!username || !password) {
        results.failed.push({
          data: userData,
          error: "Username and password are required",
        });
        continue;
      }

      // Check if username already exists
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        results.failed.push({
          data: userData,
          error: "Username already exists",
        });
        continue;
      }

      // Hash password

      // Create new user
      const newUser = new User({
        userId: nextUserId++,
        username,
        password: password,
        phone,
        available_balance,
        profit_loss,
        bank: bank || null,
      });

      await newUser.save();

      // Remove password from response
      const userResponse = newUser.toObject();
      delete userResponse.password;

      results.success.push(userResponse);
    } catch (error) {
      results.failed.push({
        data: userData,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return json({
    success: true,
    message: `Bulk user creation completed. Success: ${results.success.length}, Failed: ${results.failed.length}`,
    data: results,
  });
}

// Bulk update users
async function bulkUpdateUsers(updates: any[]) {
  if (!Array.isArray(updates) || updates.length === 0) {
    return json(
      {
        success: false,
        message: "Updates array is required and cannot be empty",
      },
      { status: 400 },
    );
  }

  const results = {
    success: [],
    failed: [],
  };

  for (const update of updates) {
    try {
      const { userId, ...updateData } = update;

      if (!userId) {
        results.failed.push({ data: update, error: "User ID is required" });
        continue;
      }

      const user = await User.findOne({ userId });
      if (!user) {
        results.failed.push({ data: update, error: "User not found" });
        continue;
      }

      // Handle password update
      if (updateData.password) {
        updateData.password = updateData.password;
      }

      // Handle withdrawPassword update
      if (updateData.withdrawPassword) {
        updateData.withdrawPassword = updateData.withdrawPassword;
      }

      // Prevent updating certain fields
      delete updateData._id;
      delete updateData.createdAt;
      delete updateData.updatedAt;

      // Update user
      Object.assign(user, updateData);
      await user.save();

      // Remove password from response
      const userResponse = user.toObject();
      delete userResponse.password;

      results.success.push(userResponse);
    } catch (error) {
      results.failed.push({
        data: update,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return json({
    success: true,
    message: `Bulk user update completed. Success: ${results.success.length}, Failed: ${results.failed.length}`,
    data: results,
  });
}

// Bulk delete users
async function bulkDeleteUsers(userIds: number[]) {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return json(
      {
        success: false,
        message: "User IDs array is required and cannot be empty",
      },
      { status: 400 },
    );
  }

  const results = {
    success: [],
    failed: [],
  };

  for (const userId of userIds) {
    try {
      // Delete user's investments first
      await Investment.deleteMany({ userId });

      // Delete user
      const deletedUser = await User.findOneAndDelete({ userId });

      if (deletedUser) {
        // Remove password from response
        const userResponse = deletedUser.toObject();
        delete userResponse.password;
        results.success.push(userResponse);
      } else {
        results.failed.push({ userId, error: "User not found" });
      }
    } catch (error) {
      results.failed.push({
        userId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return json({
    success: true,
    message: `Bulk user deletion completed. Success: ${results.success.length}, Failed: ${results.failed.length}`,
    data: results,
  });
}

// Bulk update user balance
async function bulkUpdateUserBalance(updates: any[]) {
  if (!Array.isArray(updates) || updates.length === 0) {
    return json(
      {
        success: false,
        message: "Updates array is required and cannot be empty",
      },
      { status: 400 },
    );
  }

  const results = {
    success: [],
    failed: [],
  };

  for (const update of updates) {
    try {
      const { userId, available_balance, profit_loss } = update;

      if (!userId) {
        results.failed.push({ data: update, error: "User ID is required" });
        continue;
      }

      const user = await User.findOne({ userId });
      if (!user) {
        results.failed.push({ data: update, error: "User not found" });
        continue;
      }

      // Update balance fields
      if (available_balance !== undefined) {
        user.available_balance = available_balance;
      }
      if (profit_loss !== undefined) {
        user.profit_loss = profit_loss;
      }

      await user.save();

      // Remove password from response
      const userResponse = user.toObject();
      delete userResponse.password;

      results.success.push(userResponse);
    } catch (error) {
      results.failed.push({
        data: update,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return json({
    success: true,
    message: `Bulk balance update completed. Success: ${results.success.length}, Failed: ${results.failed.length}`,
    data: results,
  });
}

// Bulk create investments
async function bulkCreateInvestments(investments: any[]) {
  if (!Array.isArray(investments) || investments.length === 0) {
    return json(
      {
        success: false,
        message: "Investments array is required and cannot be empty",
      },
      { status: 400 },
    );
  }

  const results = {
    success: [],
    failed: [],
  };

  for (const investmentData of investments) {
    try {
      const {
        userId,
        amount,
        duration,
        rewardPercentage,
        autoResubmit = false,
      } = investmentData;

      // Validation
      if (!userId || !amount || !duration || rewardPercentage === undefined) {
        results.failed.push({
          data: investmentData,
          error: "userId, amount, duration, and rewardPercentage are required",
        });
        continue;
      }

      const numericUserId = parseInt(userId);
      const numericAmount = parseFloat(amount);

      if (isNaN(numericUserId) || isNaN(numericAmount)) {
        results.failed.push({
          data: investmentData,
          error: "userId and amount must be valid numbers",
        });
        continue;
      }

      if (![1, 7, 15, 30, 60, 90].includes(duration)) {
        results.failed.push({
          data: investmentData,
          error: "Duration must be one of: 1, 7, 15, 30, 60, 90 days",
        });
        continue;
      }

      // Check if user exists
      const user = await User.findOne({ userId: numericUserId });
      if (!user) {
        results.failed.push({ data: investmentData, error: "User not found" });
        continue;
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
      results.success.push(newInvestment);
    } catch (error) {
      results.failed.push({
        data: investmentData,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return json({
    success: true,
    message: `Bulk investment creation completed. Success: ${results.success.length}, Failed: ${results.failed.length}`,
    data: results,
  });
}

// Bulk update investments
async function bulkUpdateInvestments(updates: any[]) {
  if (!Array.isArray(updates) || updates.length === 0) {
    return json(
      {
        success: false,
        message: "Updates array is required and cannot be empty",
      },
      { status: 400 },
    );
  }

  const results = {
    success: [],
    failed: [],
  };

  for (const update of updates) {
    try {
      const { investmentId, ...updateData } = update;

      if (!investmentId) {
        results.failed.push({
          data: update,
          error: "Investment ID is required",
        });
        continue;
      }

      const investment = await Investment.findById(investmentId);
      if (!investment) {
        results.failed.push({ data: update, error: "Investment not found" });
        continue;
      }

      // Update investment
      Object.assign(investment, updateData);
      await investment.save();

      results.success.push(investment);
    } catch (error) {
      results.failed.push({
        data: update,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return json({
    success: true,
    message: `Bulk investment update completed. Success: ${results.success.length}, Failed: ${results.failed.length}`,
    data: results,
  });
}

// Bulk delete investments
async function bulkDeleteInvestments(investmentIds: string[]) {
  if (!Array.isArray(investmentIds) || investmentIds.length === 0) {
    return json(
      {
        success: false,
        message: "Investment IDs array is required and cannot be empty",
      },
      { status: 400 },
    );
  }

  const results = {
    success: [],
    failed: [],
  };

  for (const investmentId of investmentIds) {
    try {
      const investment = await Investment.findById(investmentId);

      if (!investment) {
        results.failed.push({ investmentId, error: "Investment not found" });
        continue;
      }

      // If investment was active, refund the amount to user
      if (investment.status === "active") {
        const user = await User.findOne({ userId: investment.userId });
        if (user) {
          user.available_balance += investment.amount;
          await user.save();
        }
      }

      // Delete the investment
      await Investment.findByIdAndDelete(investmentId);
      results.success.push(investment);
    } catch (error) {
      results.failed.push({
        investmentId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return json({
    success: true,
    message: `Bulk investment deletion completed. Success: ${results.success.length}, Failed: ${results.failed.length}`,
    data: results,
  });
}

// Bulk update investment status
async function bulkUpdateInvestmentStatus(updates: any[]) {
  if (!Array.isArray(updates) || updates.length === 0) {
    return json(
      {
        success: false,
        message: "Updates array is required and cannot be empty",
      },
      { status: 400 },
    );
  }

  const results = {
    success: [],
    failed: [],
  };

  for (const update of updates) {
    try {
      const { investmentId, status } = update;

      if (!investmentId || !status) {
        results.failed.push({
          data: update,
          error: "Investment ID and status are required",
        });
        continue;
      }

      const investment = await Investment.findById(investmentId);
      if (!investment) {
        results.failed.push({ data: update, error: "Investment not found" });
        continue;
      }

      // If updating status to completed, process the completion
      if (status === "completed" && investment.status !== "completed") {
        const user = await User.findOne({ userId: investment.userId });
        if (user) {
          // Return principal + profit to user balance
          const returnAmount = investment.amount + investment.estimatedIncome;
          user.available_balance += returnAmount;
          user.profit_loss += investment.estimatedIncome;
          await user.save();
        }
        investment.profit = investment.estimatedIncome;
      }

      // If updating status from completed back to active, deduct from user balance
      if (status === "active" && investment.status === "completed") {
        const user = await User.findOne({ userId: investment.userId });
        if (user) {
          const deductAmount = investment.amount + investment.profit;
          if (user.available_balance >= deductAmount) {
            user.available_balance -= deductAmount;
            user.profit_loss -= investment.profit;
            await user.save();
          } else {
            results.failed.push({
              data: update,
              error: "Insufficient user balance to reactivate investment",
            });
            continue;
          }
        }
      }

      investment.status = status;
      await investment.save();
      results.success.push(investment);
    } catch (error) {
      results.failed.push({
        data: update,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return json({
    success: true,
    message: `Bulk investment status update completed. Success: ${results.success.length}, Failed: ${results.failed.length}`,
    data: results,
  });
}
