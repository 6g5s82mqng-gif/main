import { json, type RequestHandler } from "@sveltejs/kit";
import { triggerInvestmentProcessing } from "$lib/jobs/processInvestments";

export const POST: RequestHandler = async ({ request }) => {
  try {
    // In production, you might want to add admin authentication here
    // const adminToken = request.headers.get("x-admin-token");
    // if (!isValidAdminToken(adminToken)) {
    //   return json({ success: false, message: "Unauthorized" }, { status: 401 });
    // }

    const result = await triggerInvestmentProcessing();

    return json(result, { status: 200 });
  } catch (error) {
    console.error("Admin investment processing error:", error);
    return json(
      {
        success: false,
        message: "เกิดข้อผิดพลาดในการประมวลผลการลงทุน",
      },
      { status: 500 }
    );
  }
};
