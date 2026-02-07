import { NextResponse } from "next/server";
import { withAuth, AuthRequest } from "@/middleware/auth";
import db from "@/lib/db";
import { z } from "zod";

async function handleGET(req: AuthRequest) {
  try {
    const userId = req.user!.userId;

    const [users] = await db.query(
      "SELECT id, email, name, ui_mode, created_at FROM users WHERE id = ?",
      [userId]
    );

    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = users[0] as any;

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      uiMode: user.ui_mode,
      createdAt: user.created_at,
    });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  uiMode: z.enum(["dev", "regular"]).optional(),
});

async function handlePATCH(req: AuthRequest) {
  try {
    const userId = req.user!.userId;
    const body = await req.json();
    const validatedData = updateSchema.parse(body);

    const updates: string[] = [];
    const values: any[] = [];

    if (validatedData.name) {
      updates.push("name = ?");
      values.push(validatedData.name);
    }

    if (validatedData.uiMode) {
      updates.push("ui_mode = ?");
      values.push(validatedData.uiMode);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    values.push(userId);

    await db.query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
      values
    );

    const [users] = await db.query(
      "SELECT id, email, name, ui_mode FROM users WHERE id = ?",
      [userId]
    );

    const user = (users as any[])[0];

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      uiMode: user.ui_mode,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: (error as any).errors },
        { status: 400 }
      );
    }

    console.error("Update user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGET);
export const PATCH = withAuth(handlePATCH);
