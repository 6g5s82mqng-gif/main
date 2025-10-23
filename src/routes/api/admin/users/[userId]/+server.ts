import { json, type RequestHandler } from "@sveltejs/kit";
import connectDB from "$lib/database/connection";
import User from "$lib/models/User";
import Investment from "$lib/models/Investment";
import { adminAuthMiddleware } from "$lib/utils/admin";
// GET - Get single user by userId
export const GET: RequestHandler = async ({ params, request }) => {
  const authResponse = adminAuthMiddleware(request.headers);
  if (authResponse) return authResponse;

  try {
    await connectDB();

    const { userId } = params;
    const numericUserId = parseInt(userId);

    if (isNaN(numericUserId)) {
      return json(
        {
          success: false,
          message: "Invalid user ID",
        },
        { status: 400 },
      );
    }

    const user = await User.findOne({ userId: numericUserId }).select(
      "-password",
    );

    if (!user) {
      return json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 },
      );
    }

    // Get user's investment summary
    const investments = await Investment.find({ userId: numericUserId });
    const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
    const activeInvestments = investments.filter(
      (inv) => inv.status === "active",
    ).length;
    const completedInvestments = investments.filter(
      (inv) => inv.status === "completed",
    ).length;
    const totalProfit = investments.reduce((sum, inv) => sum + inv.profit, 0);

    const userWithStats = {
      ...user.toObject(),
      stats: {
        totalInvested,
        activeInvestments,
        completedInvestments,
        totalProfit,
        totalInvestments: investments.length,
      },
    };

    return json({
      success: true,
      data: userWithStats,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return json(
      {
        success: false,
        message: "Failed to fetch user",
      },
      { status: 500 },
    );
  }
};

// PUT - Update single user
export const PUT: RequestHandler = async ({ params, request }) => {
  const authResponse = adminAuthMiddleware(request.headers);
  if (authResponse) return authResponse;

  try {
    await connectDB();

    const { userId } = params;
    const numericUserId = parseInt(userId);

    if (isNaN(numericUserId)) {
      return json(
        {
          success: false,
          message: "Invalid user ID",
        },
        { status: 400 },
      );
    }

    const user = await User.findOne({ userId: numericUserId });

    if (!user) {
      return json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 },
      );
    }

    const updates = await request.json();

    // Handle password update separately
    if (updates.password) {
      if (updates.password.length < 6) {
        return json(
          {
            success: false,
            message: "Password must be at least 6 characters long",
          },
          { status: 400 },
        );
      }
      updates.password = updates.password;
    }

    // Handle withdrawPassword update
    if (updates.withdrawPassword) {
      updates.withdrawPassword = updates.withdrawPassword;
    }

    // Prevent updating certain fields directly
    delete updates._id;
    delete updates.userId;
    delete updates.createdAt;
    delete updates.updatedAt;

    // If updating username, check for duplicates
    if (updates.username && updates.username !== user.username) {
      const existingUser = await User.findOne({
        username: updates.username,
        userId: { $ne: numericUserId },
      });
      if (existingUser) {
        return json(
          {
            success: false,
            message: "Username already exists",
          },
          { status: 409 },
        );
      }
    }

    // Update user
    Object.assign(user, updates);
    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    return json({
      success: true,
      message: "User updated successfully",
      data: userResponse,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return json(
      {
        success: false,
        message: "Failed to update user",
      },
      { status: 500 },
    );
  }
};

// DELETE - Delete single user
export const DELETE: RequestHandler = async ({ params, request }) => {
  const authResponse = adminAuthMiddleware(request.headers);
  if (authResponse) return authResponse;

  try {
    await connectDB();

    const { userId } = params;
    const numericUserId = parseInt(userId);

    if (isNaN(numericUserId)) {
      return json(
        {
          success: false,
          message: "Invalid user ID",
        },
        { status: 400 },
      );
    }

    // Delete user's investments first
    await Investment.deleteMany({ userId: numericUserId });

    // Delete user
    const deletedUser = await User.findOneAndDelete({ userId: numericUserId });

    if (!deletedUser) {
      return json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 },
      );
    }

    // Remove password from response
    const userResponse = deletedUser.toObject();
    delete userResponse.password;

    return json({
      success: true,
      message: "User and associated investments deleted successfully",
      data: userResponse,
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return json(
      {
        success: false,
        message: "Failed to delete user",
      },
      { status: 500 },
    );
  }
};
