import { json, type RequestHandler } from "@sveltejs/kit";
import connectDB from "$lib/database/connection";
import User from "$lib/models/User";
import Investment from "$lib/models/Investment";
import { adminAuthMiddleware } from "$lib/utils/admin";

// GET - Get dashboard statistics
export const GET: RequestHandler = async ({ request }) => {
  const authResponse = adminAuthMiddleware(request.headers);
  if (authResponse) return authResponse;

  try {
    await connectDB();

    // User statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({
      available_balance: { $gt: 0 },
    });
    const usersWithBank = await User.countDocuments({ bank: { $ne: null } });

    // Calculate total balance across all users
    const balanceResult = await User.aggregate([
      {
        $group: {
          _id: null,
          totalBalance: { $sum: "$available_balance" },
          totalProfit: { $sum: "$profit_loss" },
        },
      },
    ]);
    const totalBalance = balanceResult[0]?.totalBalance || 0;
    const totalProfit = balanceResult[0]?.totalProfit || 0;

    // Investment statistics
    const totalInvestments = await Investment.countDocuments();
    const activeInvestments = await Investment.countDocuments({
      status: "active",
    });
    const completedInvestments = await Investment.countDocuments({
      status: "completed",
    });
    const cancelledInvestments = await Investment.countDocuments({
      status: "cancelled",
    });

    // Calculate total invested amount
    const investmentResult = await Investment.aggregate([
      {
        $group: {
          _id: null,
          totalInvested: { $sum: "$amount" },
          totalEstimatedIncome: { $sum: "$estimatedIncome" },
        },
      },
    ]);
    const totalInvested = investmentResult[0]?.totalInvested || 0;
    const totalEstimatedIncome = investmentResult[0]?.totalEstimatedIncome || 0;

    // Recent activity
    const recentUsers = await User.find()
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(5);

    const recentInvestments = await Investment.find()
      .sort({ createdAt: -1 })
      .limit(10);

    // Manually populate user information for recent investments
    const recentInvestmentsWithUsers = await Promise.all(
      recentInvestments.map(async (investment: any) => {
        const user = await User.findOne({ userId: investment.userId }).select(
          "username",
        );
        return {
          ...investment.toObject(),
          user: user ? { username: user.username } : null,
        };
      }),
    );

    // Investment statistics by duration
    const investmentsByDuration = await Investment.aggregate([
      {
        $group: {
          _id: "$duration",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Monthly statistics (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyStats = await Investment.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          investments: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // User registration statistics (last 6 months)
    const monthlyUserStats = await User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          users: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          withBank: usersWithBank,
          totalBalance,
          totalProfit,
        },
        investments: {
          total: totalInvestments,
          active: activeInvestments,
          completed: completedInvestments,
          cancelled: cancelledInvestments,
          totalInvested,
          totalEstimatedIncome,
        },
        recentActivity: {
          users: recentUsers,
          investments: recentInvestmentsWithUsers,
        },
        analytics: {
          investmentsByDuration,
          monthlyStats,
          monthlyUserStats,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard statistics:", error);
    return json(
      {
        success: false,
        message: "Failed to fetch dashboard statistics",
      },
      { status: 500 },
    );
  }
};
