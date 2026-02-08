import { NextResponse } from "next/server";
import { withAuth, AuthRequest } from "@/middleware/auth";
import db from "@/lib/db";
import { RowDataPacket } from "mysql2";

// Get all groups user is part of
async function handleGET(req: AuthRequest) {
  try {
    const userId = req.user!.userId;

    const [groups] = await db.query<RowDataPacket[]>(
      `SELECT 
        g.id as group_id,
        g.name as group_name,
        g.project_id,
        p.name as project_name,
        gm.role,
        gm.id as membership_id
       FROM group_members gm
       JOIN \`groups\` g ON gm.group_id = g.id
       JOIN projects p ON g.project_id = p.id
       WHERE gm.user_id = ?
       ORDER BY p.name, g.name`,
      [userId]
    );

    return NextResponse.json(groups);
  } catch (error) {
    console.error("Get user groups error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGET);
