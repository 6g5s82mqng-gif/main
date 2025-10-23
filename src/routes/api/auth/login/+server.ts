import { json, type RequestHandler } from "@sveltejs/kit";
import connectDB from "$lib/database/connection";
import User from "$lib/models/User";
import { generateTokenServer } from "$lib/utils/jwt";

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { username, password } = await request.json();

    // Validation
    if (!username || !password) {
      return json(
        {
          success: false,
          message: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน",
        },
        { status: 400 },
      );
    }

    // Connect to database
    await connectDB();

    // Find user by username or phone
    const user = await User.findOne({
      $or: [{ username }],
    });

    if (!user) {
      return json(
        {
          success: false,
          message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
        },
        { status: 401 },
      );
    }

    // Check password (no hashing as requested)
    if (user.password !== password) {
      return json(
        {
          success: false,
          message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
        },
        { status: 401 },
      );
    }

    // Generate token
    const token = await generateTokenServer(user._id.toString());

    return json(
      {
        success: true,
        message: "เข้าสู่ระบบสำเร็จ",
        data: {
          access_token: token,
          token_type: "Bearer",
          user: {
            id: user._id,
            userId: user.userId,
            username: user.username,
            phone: user.phone,
            available_balance: user.available_balance,
            profit_loss: user.profit_loss,
            bank: user.bank,
          },
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Login error:", error);
    return json(
      {
        success: false,
        message: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่",
      },
      { status: 500 },
    );
  }
};
