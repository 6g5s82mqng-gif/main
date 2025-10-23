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

    // Handle both JSON and FormData
    let bank_name: string;
    let number: string;
    let fullname: string;
    let withdrawNumber: string;
    let cardphoto: string | undefined;

    const contentType = request.headers.get("content-type");

    if (contentType && contentType.includes("multipart/form-data")) {
      // Handle FormData (with image upload)
      const formData = await request.formData();

      bank_name = formData.get("bank_name") as string;
      number = formData.get("number") as string;
      fullname = formData.get("fullname") as string;
      withdrawNumber = formData.get("withdrawNumber") as string;
      const file = formData.get("cardphoto") as File;

      // Validate bank fields
      if (!bank_name || !number || !fullname || !withdrawNumber) {
        return json(
          {
            success: false,
            message: "กรุณากรอกข้อมูลธนาคารให้ครบถ้วน",
          },
          { status: 400 },
        );
      }

      // Validate account number
      if (number.length < 10) {
        return json(
          {
            success: false,
            message: "เลขบัญชีต้องมีอย่างน้อย 10 หลัก",
          },
          { status: 400 },
        );
      }

      // Handle image upload if file is provided
      if (file && file.size > 0) {
        // Validate file type
        if (!file.type.startsWith("image/")) {
          return json(
            {
              success: false,
              message: "กรุณาเลือกไฟล์รูปภาพเท่านั้น",
            },
            { status: 400 },
          );
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          return json(
            {
              success: false,
              message: "ขนาดไฟล์ต้องไม่เกิน 5MB",
            },
            { status: 400 },
          );
        }

        // Upload to catbox.moe
        const catboxFormData = new FormData();
        catboxFormData.append("fileToUpload", file);
        catboxFormData.append("reqtype", "fileupload");
        catboxFormData.append("userhash", "");

        try {
          const catboxResponse = await fetch(
            "https://catbox.moe/user/api.php",
            {
              method: "POST",
              body: catboxFormData,
            },
          );

          if (!catboxResponse.ok) {
            throw new Error("Catbox upload failed");
          }

          const uploadResult = await catboxResponse.text();

          if (uploadResult.startsWith("https://files.catbox.moe/")) {
            cardphoto = uploadResult;
          } else {
            return json(
              {
                success: false,
                message: "การอัปโหลดรูปภาพล้มเหลว",
              },
              { status: 500 },
            );
          }
        } catch (error) {
          console.error("Catbox upload error:", error);
          return json(
            {
              success: false,
              message: "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ",
            },
            { status: 500 },
          );
        }
      } else {
        return json(
          {
            success: false,
            message: "กรุณาอัปโหลดรูปบัตรประชาชน",
          },
          { status: 400 },
        );
      }
    } else {
      // Handle JSON (backward compatibility, but require cardphoto)
      const jsonData = await request.json();

      bank_name = jsonData.bank_name;
      number = jsonData.number;
      fullname = jsonData.fullname;
      withdrawNumber = jsonData.withdrawNumber;
      cardphoto = jsonData.cardphoto;

      // Validation
      if (!bank_name || !number || !fullname || !withdrawNumber || !cardphoto) {
        return json(
          {
            success: false,
            message: "กรุณากรอกข้อมูลธนาคารและอัปโหลดรูปบัตรประชาชนให้ครบถ้วน",
          },
          { status: 400 },
        );
      }

      if (number.length < 10) {
        return json(
          {
            success: false,
            message: "เลขบัญชีต้องมีอย่างน้อย 10 หลัก",
          },
          { status: 400 },
        );
      }
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
    user.cardphoto = cardphoto;
    // Update user's bank information
    user.bank = {
      bank_name,
      number,
      fullname,
      withdrawNumber,
    };

    await user.save();

    return json(
      {
        success: true,
        message: "เพิ่มบัญชีธนาคารสำเร็จ",
        data: {
          bank: user.bank,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Add bank error:", error);
    return json(
      {
        success: false,
        message: "เกิดข้อผิดพลาดในการเพิ่มบัญชีธนาคาร กรุณาลองใหม่",
      },
      { status: 500 },
    );
  }
};
