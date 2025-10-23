import { json, type RequestHandler } from "@sveltejs/kit";
import connectDB from "$lib/database/connection";
import InvestmentPlan from "$lib/models/InvestmentPlan";
import { adminAuthMiddleware } from "$lib/utils/admin";

// GET - Get single investment plan template by ID
export const GET: RequestHandler = async ({ params, request }) => {
  const authResponse = adminAuthMiddleware(request.headers);
  if (authResponse) return authResponse;

  try {
    await connectDB();

    const { planId } = params;

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

    return json({
      success: true,
      data: plan,
    });
  } catch (error) {
    console.error("Error fetching investment plan template:", error);
    return json(
      {
        success: false,
        message: "Failed to fetch investment plan template",
      },
      { status: 500 },
    );
  }
};

// PUT - Update single investment plan template
export const PUT: RequestHandler = async ({ params, request }) => {
  const authResponse = adminAuthMiddleware(request.headers);
  if (authResponse) return authResponse;

  try {
    await connectDB();

    const { planId } = params;

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

    const updates = await request.json();

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

// DELETE - Delete single investment plan template
export const DELETE: RequestHandler = async ({ params, request }) => {
  const authResponse = adminAuthMiddleware(request.headers);
  if (authResponse) return authResponse;

  try {
    await connectDB();

    const { planId } = params;

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

    // Delete the plan
    await InvestmentPlan.findByIdAndDelete(planId);

    return json({
      success: true,
      message: "Investment plan template deleted successfully",
      data: plan,
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
