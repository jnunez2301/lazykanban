import { NextRequest, NextResponse } from "next/server";
import { verifyToken, JWTPayload } from "@/lib/auth";

export interface AuthRequest extends NextRequest {
  user?: JWTPayload;
}

export function withAuth(
  handler: (req: AuthRequest, context?: any) => Promise<NextResponse>
) {
  return async (req: AuthRequest, context?: any) => {
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized - No token provided" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = await verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid token" },
        { status: 401 }
      );
    }

    // Attach user to request
    (req as any).user = payload;

    return handler(req, context);
  };
}
