import { NextResponse } from "next/server";
import { withAuth, AuthRequest } from "@/middleware/auth";
import db from "@/lib/db";
import { RowDataPacket } from "mysql2";

// Leave group (remove self from group)
async function handleDELETE(req: AuthRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: groupId } = await params;
    const userId = req.user!.userId;

    // Check if user is in the group
    const [members] = await db.query<RowDataPacket[]>(
      "SELECT id FROM group_members WHERE group_id = ? AND user_id = ?",
      [groupId, userId]
    );

    if (members.length === 0) {
      return NextResponse.json(
        { error: "You are not a member of this group" },
        { status: 404 }
      );
    }

    // Remove user from group
    await db.query(
      "DELETE FROM group_members WHERE group_id = ? AND user_id = ?",
      [groupId, userId]
    );

    return NextResponse.json({ message: "Successfully left the group" });
  } catch (error) {
    console.error("Leave group error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const DELETE = withAuth(handleDELETE);
