import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCircleById, getMembersByCircle, softDeleteCircle } from "@/server/services/circle.service";
import { withErrorHandler } from "@/server/middleware";
import type { ApiResponse, Circle, Member } from "@/types";

export const GET = withErrorHandler(async (_req: NextRequest, ctx: unknown) => {
  const { params } = ctx as { params: { id: string } };
  const circle = await getCircleById(params.id);
  if (!circle) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Circle not found" },
      { status: 404 }
    );
  }
  const circleMembers = await getMembersByCircle(params.id);
  return NextResponse.json<ApiResponse<{ circle: Circle; members: Member[] }>>({
    success: true,
    data: { circle, members: circleMembers },
  });
});

export const DELETE = withErrorHandler(async (_req: NextRequest, ctx: unknown) => {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }
  const { params } = ctx as { params: { id: string } };
  const userId = (session.user as { id: string }).id;
  const circle = await softDeleteCircle(params.id, userId);
  return NextResponse.json<ApiResponse<Circle>>({ success: true, data: circle });
});
