import { NextResponse } from "next/server";
import { getNgnPerUsdc } from "@/lib/fx";
import type { ApiResponse } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rate = await getNgnPerUsdc();
    return NextResponse.json<ApiResponse<{ ngnPerUsdc: number; fetchedAt: string }>>({
      success: true,
      data: { ngnPerUsdc: rate, fetchedAt: new Date().toISOString() },
    });
  } catch {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Failed to fetch FX rate" },
      { status: 500 }
    );
  }
}
