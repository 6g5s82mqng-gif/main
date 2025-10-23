import { json, type RequestHandler } from "@sveltejs/kit";
import connectDB from "$lib/database/connection";
import User from "$lib/models/User";
import Investment from "$lib/models/Investment";
import InvestmentPlan from "$lib/models/InvestmentPlan";
import { extractTokenFromHeader, verifyTokenServer } from "$lib/utils/jwt";

export const POST: RequestHandler = async ({ request }) => {
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
          message: "โทเคนไม่ถูกต้องหรือหมดอายุ",
        },
        { status: 401 },
      );
    }

    const { amount, duration, autoResubmit } = await request.json();

    // Validation
    if (!amount || !duration) {
      return json(
        {
          success: false,
          message: "กรุณาระบุจำนวนเงินและระยะเวลาการลงทุน",
        },
        { status: 400 },
      );
    }

    // Connect to database
    await connectDB();

    // Find investment plan for the given duration
    const investmentPlan = await InvestmentPlan.findOne({ duration });
    if (!investmentPlan) {
      return json(
        {
          success: false,
          message: "ไม่พบแผนการลงทุนสำหรับระยะเวลาที่เลือก",
        },
        { status: 404 },
      );
    }

    // Validate amount against plan limits
    if (amount < investmentPlan.minAmount) {
      return json(
        {
          success: false,
          message: `จำนวนเงินลงทุนขั้นต่ำคือ ${investmentPlan.minAmount} THB`,
        },
        { status: 400 },
      );
    }

    if (amount > investmentPlan.maxAmount) {
      return json(
        {
          success: false,
          message: `จำนวนเงินลงทุนสูงสุดคือ ${investmentPlan.maxAmount} THB`,
        },
        { status: 400 },
      );
    }

    // Find user
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

    // Check if user has sufficient balance
    if (user.available_balance < amount) {
      return json(
        {
          success: false,
          message: "ยอดเงินคงเหลือไม่เพียงพอ",
        },
        { status: 400 },
      );
    }

    // Calculate end date and estimated income using plan data
    const startDate = new Date();
    const endDate = new Date(
      startDate.getTime() + duration * 24 * 60 * 60 * 1000,
    );
    const estimatedIncome = (amount * investmentPlan.rewardPercentage) / 100;

    // Create investment
    const investment = new Investment({
      userId: user.userId,
      amount,
      duration,
      rewardPercentage: investmentPlan.rewardPercentage,
      autoResubmit: autoResubmit || false,
      startDate,
      endDate,
      estimatedIncome,
    });

    await investment.save();

    // Update user balance (deduct investment amount)
    user.available_balance -= amount;
    await user.save();

    console.log(
      `User ${user.userId}: -${amount} THB investment created, new balance: ${user.available_balance} THB`,
    );

    return json(
      {
        success: true,
        message: "ลงทุนสำเร็จ",
        data: {
          id: investment._id,
          amount: investment.amount,
          duration: investment.duration,
          rewardPercentage: investment.rewardPercentage,
          status: investment.status,
          startDate: investment.startDate,
          endDate: investment.endDate,
          profit: investment.profit,
          estimatedIncome: investment.estimatedIncome,
          autoResubmit: investment.autoResubmit,
          remainingBalance: user.available_balance,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create investment error:", error);
    return json(
      {
        success: false,
        message: "เกิดข้อผิดพลาดในการลงทุน กรุณาลองใหม่",
      },
      { status: 500 },
    );
  }
};
