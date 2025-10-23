import { json, type RequestHandler } from "@sveltejs/kit";
import connectDB from "$lib/database/connection";
import User from "$lib/models/User";
import { generateTokenServer } from "$lib/utils/jwt";
import { generateUserId } from "$lib/utils/userId";

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { username, password, confirmPassword } = await request.json();

    // Validation
    if (!username || !password || !confirmPassword) {
      return json(
        {
          success: false,
          message: "กรุณากรอกข้อมูลให้ครบถ้วน",
        },
        { status: 400 },
      );
    }

    if (password !== confirmPassword) {
      return json(
        {
          success: false,
          message: "รหัสผ่านไม่ตรงกัน",
        },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return json(
        {
          success: false,
          message: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร",
        },
        { status: 400 },
      );
    }

    // Connect to database
    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }],
    });

    if (existingUser) {
      return json(
        {
          success: false,
          message: "ชื่อผู้ใช้หรือเบอร์โทรศัพท์นี้ถูกใช้งานแล้ว",
        },
        { status: 400 },
      );
    }

    // Create new user (no hashing as requested)
    const userId = await generateUserId();
    const newUser = new User({
      userId,
      username,
      password,
      phone: /^\d+$/.test(username) ? username : undefined,
      available_balance: 0,
      profit_loss: 0,
      bank: null,
    });

    await newUser.save();

    // Generate token
    const token = await generateTokenServer(newUser._id.toString());

    return json(
      {
        success: true,
        message: "ลงทะเบียนสำเร็จ",
        data: {
          access_token: token,
          token_type: "Bearer",
          user: {
            id: newUser._id,
            userId: newUser.userId,
            username: newUser.username,
            phone: newUser.phone,
            available_balance: newUser.available_balance,
            profit_loss: newUser.profit_loss,
            bank: newUser.bank,
          },
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration error:", error);
    return json(
      {
        success: false,
        message: "เกิดข้อผิดพลาดในการลงทะเบียน กรุณาลองใหม่",
      },
      { status: 500 },
    );
  }
};
