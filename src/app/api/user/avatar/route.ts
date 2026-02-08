import { NextResponse } from "next/server";
import { withAuth, AuthRequest } from "@/middleware/auth";
import db from "@/lib/db";
import { z } from "zod";

const avatarSchema = z.object({
  avatar: z.string().regex(/^avatar-[1-5]\.png$/, "Invalid avatar selection"),
});

async function handlePATCH(req: AuthRequest) {
  try {
    const userId = req.user!.userId;
    const body = await req.json();
    const { avatar } = avatarSchema.parse(body);

    await db.query(
      "UPDATE users SET avatar = ? WHERE id = ?",
      [avatar, userId]
    );

    return NextResponse.json({ message: "Avatar updated successfully", avatar });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid avatar selection", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Update avatar error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const PATCH = withAuth(handlePATCH);
