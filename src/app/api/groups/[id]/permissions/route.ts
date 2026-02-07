import { NextResponse } from "next/server";
import { withAuth, AuthRequest } from "@/middleware/auth";
import db from "@/lib/db";
import { z } from "zod";
import { RowDataPacket } from "mysql2";

interface Params {
  params: Promise<{ id: string }>;
}

// Get group permissions
async function handleGET(req: AuthRequest, { params }: Params) {
  try {
    const { id } = await params;
    const userId = req.user!.userId;

    // Check access - must be able to view project
    const [access] = await db.query<RowDataPacket[]>(
      `SELECT 1
       FROM \`groups\` target_g
       JOIN projects pr ON target_g.project_id = pr.id
       JOIN \`groups\` g ON g.project_id = pr.id
       JOIN group_members gm ON gm.group_id = g.id
       WHERE target_g.id = ? AND (pr.owner_id = ? OR gm.user_id = ?)`,
      [id, userId, userId]
    );

    if (access.length === 0) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const [permissions] = await db.query<RowDataPacket[]>(
      "SELECT * FROM permissions WHERE group_id = ?",
      [id]
    );

    if (permissions.length === 0) {
      return NextResponse.json(
        { error: "Permissions not found" },
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

const updatePermissionsSchema = z.object({
  can_create_tasks: z.boolean().optional(),
  can_edit_tasks: z.boolean().optional(),
  can_delete_tasks: z.boolean().optional(),
  can_manage_tags: z.boolean().optional(),
  can_manage_members: z.boolean().optional(),
  can_edit_project: z.boolean().optional(),
});

// Update group permissions
async function handlePATCH(req: AuthRequest, { params }: Params) {
  try {
    const { id } = await params;
    const userId = req.user!.userId;
    const body = await req.json();
    const validatedData = updatePermissionsSchema.parse(body);

    // Check permission - must be project owner or have can_edit_project (which usually implies admin rights)
    const [permissions] = await db.query<RowDataPacket[]>(
      `SELECT p.can_edit_project
       FROM \`groups\` target_g
       JOIN projects pr ON target_g.project_id = pr.id
       JOIN \`groups\` g ON g.project_id = pr.id
       JOIN group_members gm ON gm.group_id = g.id
       JOIN permissions p ON p.group_id = g.id
       WHERE target_g.id = ? AND gm.user_id = ? AND (pr.owner_id = ? OR p.can_edit_project = true)`,
      [id, userId, userId]
    );

    if (permissions.length === 0) {
      return NextResponse.json(
        { error: "Permission denied" },
        { status: 403 }
      );
    }

    const updates: string[] = [];
    const values: any[] = [];

    // Loop through keys to build update query
    Object.entries(validatedData).forEach(([key, value]) => {
      updates.push(`${key} = ?`);
      values.push(value);
    });

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    values.push(id);

    await db.query(
      `UPDATE permissions SET ${updates.join(", ")} WHERE group_id = ?`,
      values
    );

    const [updatedPermissions] = await db.query<RowDataPacket[]>(
      "SELECT * FROM permissions WHERE group_id = ?",
      [id]
    );

    return NextResponse.json(updatedPermissions[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: (error as any).errors },
        { status: 400 }
      );
    }

    console.error("Update permissions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGET);
export const PATCH = withAuth(handlePATCH);
