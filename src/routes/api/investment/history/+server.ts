import { json, type RequestHandler } from "@sveltejs/kit";
import connectDB from "$lib/database/connection";
import Investment from "$lib/models/Investment";
import User from "$lib/models/User";
import { extractTokenFromHeader, verifyTokenServer } from "$lib/utils/jwt";

export const GET: RequestHandler = async ({ request }) => {
  try {
    const token = extractTokenFromHeader(request.headers.get("authorization"));

    if (!token) {
      return json(
        {
          success: false,
          message: "กรุณาเข้าสู่ระบบ",
        },
        { status: 401 },
      );
    }

    // Verify token on server side
    const decoded = await verifyTokenServer(token);
    if (!decoded) {
      return json(
        {
          success: false,
          message: "Token ไม่ถูกต้องหรือหมดอายุ",
        },
        { status: 401 },
      );
    }

    // Connect to database
    await connectDB();

    // Get user info to find userId
    const user = await User.findById(decoded.sub);
    if (!user) {
      return json(
        {
          success: false,
          message: "ไม่พบผู้ใช้",
        },
        { status: 404 },
      );
    }

    // Fetch user's investment history
    const investments = await Investment.find({ userId: user.userId })
      .sort({ createdAt: -1 })
      .lean();

    // Calculate current profits for active investments
    const investmentsWithProfit = investments.map((investment: any) => {
      const now = new Date();
      const endDate = new Date(investment.endDate);

      let currentProfit = investment.profit;

      if (investment.status === "active" && now >= endDate) {
        // Investment has completed, calculate final profit
        currentProfit = investment.estimatedIncome;
      } else if (investment.status === "active") {
        // Calculate partial profit based on elapsed time
        const elapsedMs = now.getTime() - investment.startDate.getTime();
        const totalMs = endDate.getTime() - investment.startDate.getTime();
        const progress = Math.min(elapsedMs / totalMs, 1);
        currentProfit = investment.estimatedIncome * progress;
      }

      return {
        id: investment._id,
        amount: investment.amount,
        duration: investment.duration,
        rewardPercentage: investment.rewardPercentage,
        status: investment.status,
        startDate: investment.startDate,
        endDate: investment.endDate,
        profit: currentProfit,
        estimatedIncome: investment.estimatedIncome,
        autoResubmit: investment.autoResubmit,
        createdAt: investment.createdAt,
      };
    });

    // Calculate summary statistics
    const totalInvested = investmentsWithProfit.reduce(
      (sum: number, inv: any) => sum + inv.amount,
      0,
    );
    const totalProfit = investmentsWithProfit.reduce(
      (sum: number, inv: any) => sum + inv.profit,
      0,
    );
    const totalEstimatedIncome = investmentsWithProfit.reduce(
      (sum: number, inv: any) => sum + inv.estimatedIncome,
      0,
    );

    return json(
      {
        success: true,
        data: {
          investments: investmentsWithProfit,
          summary: {
            totalInvested,
            totalProfit,
            totalEstimatedIncome,
            availableBalance: user.available_balance,
            profitLoss: user.profit_loss,
          },
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Get investment history error:", error);
    return json(
      {
        success: false,
        message: "เกิดข้อผิดพลาดในการดึงข้อมูล กรุณาลองใหม่",
      },
      { status: 500 },
    );
  }
};

export const PUT: RequestHandler = async ({ request }) => {
  try {
    const token = extractTokenFromHeader(request.headers.get("authorization"));

    if (!token) {
      return json(
        {
          success: false,
          message: "กรุณาเข้าสู่ระบบ",
        },
        { status: 401 },
      );
    }

    // Verify token on server side
    const decoded = await verifyTokenServer(token);
    if (!decoded) {
      return json(
        {
          success: false,
          message: "Token ไม่ถูกต้องหรือหมดอายุ",
        },
        { status: 401 },
      );
    }

    const { investmentId, autoResubmit } = await request.json();

    if (!investmentId || typeof autoResubmit !== "boolean") {
      return json(
        {
          success: false,
          message: "ข้อมูลไม่ถูกต้อง",
        },
        { status: 400 },
      );
    }

    // Connect to database
    await connectDB();

    // Find and update investment
    const investment = await Investment.findOneAndUpdate(
      { _id: investmentId, userId: decoded.sub },
      { autoResubmit },
      { new: true },
    );

    if (!investment) {
      return json(
        {
          success: false,
          message: "ไม่พบข้อมูลการลงทุน",
        },
        { status: 404 },
      );
    }

    return json(
      {
        success: true,
        message: "อัปเดตการส่งคำขออัตโนมัติสำเร็จ",
        data: {
          autoResubmit: investment.autoResubmit,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Update investment error:", error);
    return json(
      {
        success: false,
        message: "เกิดข้อผิดพลาดในการอัปเดต กรุณาลองใหม่",
      },
      { status: 500 },
    );
  }
};
