import { json, type RequestHandler } from "@sveltejs/kit";
import connectDB from "$lib/database/connection";
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

    return json(
      {
        success: true,
        data: {
          id: user._id,
          userId: user.userId,
          username: user.username,
          phone: user.phone,
          available_balance: user.available_balance,
          profit_loss: user.profit_loss,
          cardphoto: user.cardphoto,
          bank: user.bank,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Get user info error:", error);
    return json(
      {
        success: false,
        message: "เกิดข้อผิดพลาดในการดึงข้อมูล กรุณาลองใหม่",
      },
      { status: 500 },
    );
  }
};
