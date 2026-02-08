import { NextResponse } from "next/server";
import { withAuth, AuthRequest } from "@/middleware/auth";
import db from "@/lib/db";
import { RowDataPacket } from "mysql2";

interface Params {
  params: Promise<{ id: string }>;
}

// Get user's group for this project
async function handleGET(req: AuthRequest, { params }: Params) {
  try {
    const { id } = await params;
    const userId = req.user!.userId;
    const [groups] = await db.query<RowDataPacket[]>(
      `SELECT g.id as group_id, g.name as group_name, gm.role, g.project_id
       FROM \`groups\` g
       JOIN group_members gm ON gm.group_id = g.id
       WHERE g.project_id = ? AND gm.user_id = ?`,
      [id, userId]
    );

    if (groups.length === 0) {
      return NextResponse.json(
        { error: "User not in any group for this project" },
        { status: 404 }
      );
    }
    return NextResponse.json(groups);
  } catch (error) {
    console.error("Get user group error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGET);
