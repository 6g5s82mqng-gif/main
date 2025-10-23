import { json } from "@sveltejs/kit";

/**
 * Validates admin authentication using the uwu header
 * @param headers - Request headers object
 * @returns { success: boolean } - Whether the admin is authenticated
 */
export function validateAdminAuth(headers: Headers): { success: boolean } {
  const adminHeader = headers.get("uwu");

  if (!adminHeader || adminHeader !== "Admin") {
    return { success: false };
  }

  return { success: true };
}

/**
 * Middleware function to check admin authentication
 * Returns unauthorized response if not authenticated
 * @param headers - Request headers object
 * @returns Response object or null if authenticated
 */
export function adminAuthMiddleware(headers: Headers) {
  const authResult = validateAdminAuth(headers);

  if (!authResult.success) {
    return json(
      {
        success: false,
        message: "Unauthorized - Admin access required"
      },
      { status: 401 }
    );
  }

  return null; // Authenticated, continue processing
}
