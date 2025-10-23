import { json, type RequestHandler } from "@sveltejs/kit";
import connectDB from "$lib/database/connection";
import InvestmentPlan from "$lib/models/InvestmentPlan";
import { adminAuthMiddleware } from "$lib/utils/admin";

// GET - Fetch all investment plan templates
export const GET: RequestHandler = async ({ request }) => {
  const authResponse = adminAuthMiddleware(request.headers);
  if (authResponse) return authResponse;

  try {
    await connectDB();

    // Get all investment plans, sorted by duration
    const investmentPlans = await InvestmentPlan.find({}).sort({ duration: 1 });

    return json({
      success: true,
      data: investmentPlans,
    });
  } catch (error) {
    console.error("Error fetching investment plan templates:", error);
    return json(
      {
        success: false,
        message: "Failed to fetch investment plan templates",
      },
      { status: 500 },
    );
  }
};

// POST - Create new investment plan template
export const POST: RequestHandler = async ({ request }) => {
  const authResponse = adminAuthMiddleware(request.headers);
  if (authResponse) return authResponse;

  try {
    await connectDB();

    const { duration, label, rewardPercentage, minAmount, maxAmount } =
      await request.json();

    // Validation
    if (
      !duration ||
      !label ||
      rewardPercentage === undefined ||
      minAmount === undefined ||
      maxAmount === undefined
    ) {
      return json(
        {
          success: false,
          message:
            "duration, label, rewardPercentage, minAmount, and maxAmount are required",
        },
        { status: 400 },
      );
    }

    if (![1, 7, 15, 30, 60, 90].includes(duration)) {
      return json(
        {
          success: false,
          message: "Duration must be one of: 1, 7, 15, 30, 60, 90 days",
        },
        { status: 400 },
      );
    }

    if (rewardPercentage < 0 || rewardPercentage > 100) {
      return json(
        {
          success: false,
          message: "Reward percentage must be between 0 and 100",
        },
        { status: 400 },
      );
    }

    if (minAmount < 0) {
      return json(
        {
          success: false,
          message: "Minimum amount must be greater than or equal to 0",
        },
        { status: 400 },
      );
    }

    if (maxAmount < 0) {
      return json(
        {
          success: false,
          message: "Maximum amount must be greater than or equal to 0",
        },
        { status: 400 },
      );
    }

    if (minAmount > maxAmount) {
      return json(
        {
          success: false,
          message: "Minimum amount cannot be greater than maximum amount",
        },
        { status: 400 },
      );
    }

    // Check if duration already exists
    const existingPlan = await InvestmentPlan.findOne({ duration });
    if (existingPlan) {
      return json(
        {
          success: false,
          message: "Investment plan with this duration already exists",
        },
        { status: 409 },
      );
    }

    // Create new investment plan
    const newPlan = new InvestmentPlan({
      duration,
      label: label.trim(),
      rewardPercentage,
      minAmount,
      maxAmount,
    });

    await newPlan.save();

    return json(
      {
        success: true,
        message: "Investment plan template created successfully",
        data: newPlan,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating investment plan template:", error);
    return json(
      {
        success: false,
        message: "Failed to create investment plan template",
      },
      { status: 500 },
    );
  }
};

// PUT - Update investment plan template
export const PUT: RequestHandler = async ({ request }) => {
  const authResponse = adminAuthMiddleware(request.headers);
  if (authResponse) return authResponse;

  try {
    await connectDB();

    const { planId, updates } = await request.json();

    if (!planId) {
      return json(
        {
          success: false,
          message: "Plan ID is required",
        },
        { status: 400 },
      );
    }

    const plan = await InvestmentPlan.findById(planId);
    if (!plan) {
      return json(
        {
          success: false,
          message: "Investment plan template not found",
        },
        { status: 404 },
      );
    }

    // Allowed updates
    const allowedUpdates = [
      "label",
      "rewardPercentage",
      "minAmount",
      "maxAmount",
    ];

    const filteredUpdates: any = {};
    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    }

    // Validate updates
    if (updates.rewardPercentage !== undefined) {
      if (updates.rewardPercentage < 0 || updates.rewardPercentage > 100) {
        return json(
          {
            success: false,
            message: "Reward percentage must be between 0 and 100",
          },
          { status: 400 },
        );
      }
    }

    if (updates.minAmount !== undefined && updates.minAmount < 0) {
      return json(
        {
          success: false,
          message: "Minimum amount must be greater than or equal to 0",
        },
        { status: 400 },
      );
    }

    if (updates.maxAmount !== undefined && updates.maxAmount < 0) {
      return json(
        {
          success: false,
          message: "Maximum amount must be greater than or equal to 0",
        },
        { status: 400 },
      );
    }

    // Validate min/max relationship if both are being updated
    if (
      (updates.minAmount !== undefined || updates.maxAmount !== undefined) &&
      updates.minAmount !== undefined &&
      updates.maxAmount !== undefined &&
      updates.minAmount > updates.maxAmount
    ) {
      return json(
        {
          success: false,
          message: "Minimum amount cannot be greater than maximum amount",
        },
        { status: 400 },
      );
    }

    // Validate against existing values if only one is being updated
    if (updates.minAmount !== undefined && updates.maxAmount === undefined) {
      if (updates.minAmount > plan.maxAmount) {
        return json(
          {
            success: false,
            message:
              "Minimum amount cannot be greater than existing maximum amount",
          },
          { status: 400 },
        );
      }
    }

    if (updates.maxAmount !== undefined && updates.minAmount === undefined) {
      if (updates.maxAmount < plan.minAmount) {
        return json(
          {
            success: false,
            message:
              "Maximum amount cannot be less than existing minimum amount",
          },
          { status: 400 },
        );
      }
    }

    // Update plan
    Object.assign(plan, filteredUpdates);
    await plan.save();

    return json({
      success: true,
      message: "Investment plan template updated successfully",
      data: plan,
    });
  } catch (error) {
    console.error("Error updating investment plan template:", error);
    return json(
      {
        success: false,
        message: "Failed to update investment plan template",
      },
      { status: 500 },
    );
  }
};

// DELETE - Delete investment plan template
export const DELETE: RequestHandler = async ({ request }) => {
  const authResponse = adminAuthMiddleware(request.headers);
  if (authResponse) return authResponse;

  try {
    await connectDB();

    const url = new URL(request.url);
    const planId = url.searchParams.get("planId");

    if (!planId) {
      return json(
        {
          success: false,
          message: "Plan ID is required",
        },
        { status: 400 },
      );
    }

    const deletedPlan = await InvestmentPlan.findByIdAndDelete(planId);

    if (!deletedPlan) {
      return json(
        {
          success: false,
          message: "Investment plan template not found",
        },
        { status: 404 },
      );
    }

    return json({
      success: true,
      message: "Investment plan template deleted successfully",
      data: deletedPlan,
    });
  } catch (error) {
    console.error("Error deleting investment plan template:", error);
    return json(
      {
        success: false,
        message: "Failed to delete investment plan template",
      },
      { status: 500 },
    );
  }
};
