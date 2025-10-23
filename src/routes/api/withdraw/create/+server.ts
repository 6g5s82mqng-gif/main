import { json, type RequestHandler } from "@sveltejs/kit";
import connectDB from "$lib/database/connection";
import User from "$lib/models/User";
import { extractTokenFromHeader, verifyTokenServer } from "$lib/utils/jwt";

export const POST: RequestHandler = async ({ request }) => {
  try {
    const token = extractTokenFromHeader(request.headers.get("authorization"));

    if (!token) {
      return json(
        { success: false, message: "กรุณาเข้าสู่ระบบ" },
        { status: 401 },
      );
    }

    // Verify token on server side
    const decoded = await verifyTokenServer(token);
    if (!decoded) {
      return json(
        { success: false, message: "โทเคนไม่ถูกต้องหรือหมดอายุ" },
        { status: 401 },
      );
    }

    const { amount, withdrawPassword } = await request.json();

    // Validation
    if (!amount || !withdrawPassword) {
      return json(
        { success: false, message: "กรุณากรอกข้อมูลให้ครบถ้วน" },
        { status: 400 },
      );
    }

    // Validate amount
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return json(
        { success: false, message: "จำนวนเงินต้องมากกว่า 0" },
        { status: 400 },
      );
    }

    if (numericAmount < 100) {
      return json(
        { success: false, message: "จำนวนเงินขั้นต่ำคือ 100 บาท" },
        { status: 400 },
      );
    }

    // Connect to database
    await connectDB();

    // Find user
    const user = await User.findById(decoded.sub);
    if (!user) {
      return json({ success: false, message: "ไม่พบผู้ใช้" }, { status: 404 });
    }

    // Check if user has withdrawal password set
    if (!user.bank || !user.bank.withdrawNumber) {
      return json(
        { success: false, message: "กรุณาตั้งรหัสผ่านการถอนเงินก่อน" },
        { status: 400 },
      );
    }

    // Verify withdrawal password
    if (user.bank.withdrawNumber !== withdrawPassword) {
      return json(
        { success: false, message: "รหัสผ่านการถอนไม่ถูกต้อง" },
        { status: 401 },
      );
    }

    // Check if user has enough balance
    if (user.available_balance < numericAmount) {
      return json(
        { success: false, message: "ยอดเงินคงเหลือไม่เพียงพอ" },
        { status: 400 },
      );
    }

    // Check if user has bank account
    if (!user.bank) {
      return json(
        { success: false, message: "กรุณาเพิ่มบัญชีธนาคารก่อนถอนเงิน" },
        { status: 400 },
      );
    }

    // Check if user has uploaded ID card photo
    if (!user.cardphoto) {
      return json(
        { success: false, message: "กรุณาอัปโหลดรูปบัตรประชาชนก่อนถอนเงิน" },
        { status: 400 },
      );
    }

    // Update user balance
    user.available_balance -= numericAmount;
    await user.save();

    // TODO: Create withdrawal record in separate collection
    // TODO: Process actual bank transfer
    // TODO: Send notification

    return json({
      success: true,
      message: "คำขอถอนเงินสำเร็จ",
      data: {
        amount: numericAmount,
        newBalance: user.available_balance,
        bank: user.bank,
        transactionId: `WD${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      },
    });
  } catch (error) {
    console.error("Withdrawal error:", error);
    return json(
      { success: false, message: "เกิดข้อผิดพลาดในการดำเนินการ กรุณาลองใหม่" },
      { status: 500 },
    );
  }
};
