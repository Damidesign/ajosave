import { NextRequest, NextResponse } from "next/server";
import { sendOtp } from "@/lib/sms";
import { rateLimit, withErrorHandler } from "@/server/middleware";
import type { ApiResponse } from "@/types";
import { getRedis } from "@/lib/redis";
import { isLockedOut } from "@/lib/lockout";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const { phone } = await req.json();
  if (!phone || !/^\+?[1-9]\d{9,14}$/.test(phone)) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Invalid phone number" },
      { status: 400 }
    );
  }

  // Check for account lockout (brute-force protection)
  if (await isLockedOut(phone)) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Account locked due to too many failed attempts. Please try again in 30 minutes." },
      { status: 423 }
    );
  }

  const rl = await rateLimit(`otp:${phone}`, 3, 10 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Too many requests. Please wait before requesting another OTP." },
      { status: 429 }
    );
  }

  const otp = await sendOtp(phone);
  
  // Store OTP in Redis with 10-minute expiry
  const redis = await getRedis();
  await redis.set(`otp:${phone}`, otp, { EX: 600 });

  if (process.env.NODE_ENV === "development") console.warn(`[DEV] OTP for ${phone}: ${otp}`);
  
  return NextResponse.json<ApiResponse<{ message: string }>>({
    success: true,
    data: { message: "OTP sent successfully" },
  });
});
