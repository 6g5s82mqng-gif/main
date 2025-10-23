// Client-safe JWT utilities
// This file contains functions that work in both browser and Node.js environments

// Base64 URL decoding function that works in browser
function base64UrlDecode(base64Url: string): string {
  // Replace URL-safe characters
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");

  // Pad with proper number of '=' characters
  const padLength = (4 - (base64.length % 4)) % 4;
  const paddedBase64 = base64 + "=".repeat(padLength);

  try {
    // Use atob for browser environments (built-in)
    return atob(paddedBase64);
  } catch (error) {
    // Fallback for environments where atob might not be available
    return Buffer.from(paddedBase64, "base64").toString("utf-8");
  }
}

// Client-safe JWT decoder - extracts payload without verification
export function decodeToken(token: string): any {
  try {
    if (!token) return null;

    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const decoded = base64UrlDecode(payload);

    return JSON.parse(decoded);
  } catch (error) {
    console.error("Token decode error:", error);
    return null;
  }
}

// Check if token is expired (client-side only)
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) return true; // Treat as expired if no exp claim

    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    console.error("Token expiration check error:", error);
    return true;
  }
}

// Verify token format and expiration (client-side validation only)
export function validateTokenFormat(token: string): boolean {
  try {
    const decoded = decodeToken(token);
    if (!decoded) return false;

    // Check basic JWT structure
    if (!decoded.sub && !decoded.userId) return false;

    // Check if token is expired
    if (isTokenExpired(token)) return false;

    return true;
  } catch (error) {
    console.error("Token format validation error:", error);
    return false;
  }
}

// Server-side JWT verification (only works in Node.js environment)
// This should only be imported and used in server routes
export async function verifyTokenServer(token: string): Promise<any> {
  try {
    // Dynamic import to avoid bundling jsonwebtoken on client-side
    if (typeof window !== "undefined") {
      throw new Error("Server-side verification cannot be used in browser");
    }

    const jwt = await import("jsonwebtoken");
    const JWT_SECRET =
      process.env.JWT_SECRET || "your-secret-key-change-in-production";

    return jwt.default.verify(token, JWT_SECRET);
  } catch (error) {
    console.error("Server token verification failed:", error.message);
    return null;
  }
}

// Server-side token generation (only works in Node.js environment)
export async function generateTokenServer(userId: string): Promise<string> {
  try {
    // Dynamic import to avoid bundling jsonwebtoken on client-side
    if (typeof window !== "undefined") {
      throw new Error("Server-side generation cannot be used in browser");
    }

    const jwt = await import("jsonwebtoken");
    const JWT_SECRET =
      process.env.JWT_SECRET || "your-secret-key-change-in-production";

    const timestamp = Date.now().toString();
    const randomString = Math.random().toString(36).substring(2, 15);
    const payload = `${timestamp}|${randomString}`;

    return jwt.default.sign(
      {
        sub: userId,
        token: payload,
        type: "Bearer",
      },
      JWT_SECRET,
      { expiresIn: "24h" },
    );
  } catch (error) {
    console.error("Server token generation failed:", error.message);
    throw error;
  }
}

// Extract token from Authorization header
export function extractTokenFromHeader(
  authHeader: string | null,
): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;
  return parts[1];
}

// Legacy exports for backward compatibility
// These now use client-safe versions
export const verifyToken = validateTokenFormat;
export const generateToken = generateTokenServer;
