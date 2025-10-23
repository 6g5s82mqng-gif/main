import { json, type RequestHandler } from "@sveltejs/kit";
import connectDB from "$lib/database/connection";
import User from "$lib/models/User";
import { adminAuthMiddleware } from "$lib/utils/admin";

// GET - Fetch all users with pagination and filtering
export const GET: RequestHandler = async ({ request }) => {
  const authResponse = adminAuthMiddleware(request.headers);
  if (authResponse) return authResponse;

  try {
    await connectDB();

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const search = url.searchParams.get("search") || "";
    const status = url.searchParams.get("status") || "all";
    const sortBy = url.searchParams.get("sortBy") || "createdAt";
    const sortOrder = url.searchParams.get("sortOrder") || "desc";

    const skip = (page - 1) * limit;

    // Build query
    let query: any = {};

    // Search functionality
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: "i" } },
        { "bank.fullname": { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    // Status filtering
    if (status === "active") {
      query.available_balance = { $gt: 0 };
    } else if (status === "inactive") {
      query.available_balance = { $lte: 0 };
    }

    // Sort options
    const sort: any = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Get users
    const users = await User.find(query)
      .select("-password") // Exclude password from results
      .sort(sort)
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalUsers = await User.countDocuments(query);

    return json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalUsers / limit),
          totalUsers,
          limit,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return json(
      {
        success: false,
        message: "Failed to fetch users",
      },
      { status: 500 },
    );
  }
};

// POST - Create new user
export const POST: RequestHandler = async ({ request }) => {
  const authResponse = adminAuthMiddleware(request.headers);
  if (authResponse) return authResponse;

  try {
    await connectDB();

    const {
      username,
      password,
      phone,
      available_balance = 0,
      profit_loss = 0,
      bank,
    } = await request.json();

    // Validation
    if (!username || !password) {
      return json(
        {
          success: false,
          message: "Username and password are required",
        },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return json(
        {
          success: false,
          message: "Password must be at least 6 characters long",
        },
        { status: 400 },
      );
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return json(
        {
          success: false,
          message: "Username already exists",
        },
        { status: 409 },
      );
    }

    // Get the highest userId and increment
    const lastUser = await User.findOne().sort({ userId: -1 });
    const newUserId = lastUser ? lastUser.userId + 1 : 1;

    // Hash password
    // Create new user
    const newUser = new User({
      userId: newUserId,
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

    return json(
      {
        success: true,
        message: "User created successfully",
        data: userResponse,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return json(
      {
        success: false,
        message: "Failed to create user",
      },
      { status: 500 },
    );
  }
};

// PUT - Update user (bulk update)
export const PUT: RequestHandler = async ({ request }) => {
  const authResponse = adminAuthMiddleware(request.headers);
  if (authResponse) return authResponse;

  try {
    await connectDB();

    const { userId, updates } = await request.json();

    if (!userId) {
      return json(
        {
          success: false,
          message: "User ID is required",
        },
        { status: 400 },
      );
    }

    // Find user by userId
    const user = await User.findOne({ userId });
    if (!user) {
      return json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 },
      );
    }

    // Prevent updating certain sensitive fields directly
    const allowedUpdates = [
      "username",
      "phone",
      "available_balance",
      "profit_loss",
      "bank",
      "cardphoto",
    ];

    const filteredUpdates: any = {};
    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    }

    // If updating username, check for duplicates
    if (updates.username && updates.username !== user.username) {
      const existingUser = await User.findOne({
        username: updates.username,
        userId: { $ne: userId },
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
    Object.assign(user, filteredUpdates);
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

// DELETE - Delete user
export const DELETE: RequestHandler = async ({ request }) => {
  const authResponse = adminAuthMiddleware(request.headers);
  if (authResponse) return authResponse;

  try {
    await connectDB();

    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return json(
        {
          success: false,
          message: "User ID is required",
        },
        { status: 400 },
      );
    }

    // Find and delete user
    const deletedUser = await User.findOneAndDelete({ userId });

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
      message: "User deleted successfully",
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
