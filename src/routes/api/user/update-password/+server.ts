import { json, type RequestHandler } from "@sveltejs/kit";
import connectDB from "$lib/database/connection";
import User from "$lib/models/User";
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
          message: "Token ไม่ถูกต้องหรือหมดอายุ",
        },
        { status: 401 },
      );
    }

    const { oldPassword, newPassword, confirmNewPassword } =
      await request.json();

    // Validation
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      return json(
        {
          success: false,
          message: "กรุณากรอกข้อมูลให้ครบถ้วน",
        },
        { status: 400 },
      );
    }

    if (newPassword !== confirmNewPassword) {
      return json(
        {
          success: false,
          message: "รหัสผ่านใหม่ไม่ตรงกัน",
        },
        { status: 400 },
      );
    }

    if (newPassword.length < 6) {
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

    // Verify old password (no hashing as requested)
    if (user.password !== oldPassword) {
      return json(
        {
          success: false,
          message: "รหัสผ่านเก่าไม่ถูกต้อง",
        },
        { status: 401 },
      );
    }

    // Update user password
    user.password = newPassword;
    await user.save();

    return json(
      {
        success: true,
        message: "เปลี่ยนรหัสผ่านเข้าสู่ระบบสำเร็จ",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Update password error:", error);
    return json(
      {
        success: false,
        message: "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน กรุณาลองใหม่",
      },
      { status: 500 },
    );
  }
};
