import { NextResponse } from "next/server";
import { withAuth, AuthRequest } from "@/middleware/auth";
import db from "@/lib/db";
import { RowDataPacket } from "mysql2";

interface Params {
  params: Promise<{ id: string }>;
}

// Get user's permissions for a project
async function handleGET(req: AuthRequest, { params }: Params) {
  try {
    const { id: projectId } = await params;
    const userId = req.user!.userId;

    // Get user's group and permissions for this project
    const [permissions] = await db.query<RowDataPacket[]>(
      `SELECT 
        MAX(p.can_create_tasks) as canCreateTasks,
        MAX(p.can_edit_tasks) as canEditTasks,
        MAX(p.can_delete_tasks) as canDeleteTasks,
        MAX(p.can_manage_members) as canManageMembers,
        MAX(p.can_manage_tags) as canManageTags,
        MAX(p.can_edit_project) as canEditProject
       FROM group_members gm
       JOIN \`groups\` g ON gm.group_id = g.id
       JOIN permissions p ON p.group_id = g.id
       WHERE g.project_id = ? AND gm.user_id = ?
       GROUP BY gm.user_id`,
      [projectId, userId]
    );

    if (permissions.length === 0) {
      return NextResponse.json(
        { error: "User not in any group for this project" },
        { status: 404 }
      );
    }

    return NextResponse.json(permissions[0]);
  } catch (error) {
    console.error("Get permissions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGET);
