import { NextResponse } from "next/server";
import { withAuth, AuthRequest } from "@/middleware/auth";
import db from "@/lib/db";
import { z } from "zod";
import { RowDataPacket } from "mysql2";

interface Params {
  params: Promise<{ id: string }>;
}

// Get permissions for a specific group
async function handleGET(req: AuthRequest, { params }: Params) {
  try {
    const { id: groupId } = await params;
    const userId = req.user!.userId;

    // Check if user has access to the project this group belongs to
    // We allow any member of the project to view permissions of groups? 
    // Or only owners/admins? Let's restrict to owners or those with manage_members permission.
    const [access] = await db.query<RowDataPacket[]>(
      `SELECT pr.id
       FROM \`groups\` g
       JOIN projects pr ON g.project_id = pr.id
       LEFT JOIN \`groups\` user_g ON user_g.project_id = pr.id
       LEFT JOIN group_members gm ON gm.group_id = user_g.id
       LEFT JOIN permissions p ON p.group_id = user_g.id
       WHERE g.id = ? AND gm.user_id = ? AND (pr.owner_id = ? OR p.can_manage_members = true)`,
      [groupId, userId, userId]
    );

    if (access.length === 0) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const [permissions] = await db.query<RowDataPacket[]>(
      `SELECT 
        can_create_tasks as canCreateTasks,
        can_edit_tasks as canEditTasks,
        can_delete_tasks as canDeleteTasks,
        can_manage_members as canManageMembers,
        can_manage_tags as canManageTags,
        can_edit_project as canEditProject
       FROM permissions 
       WHERE group_id = ?`,
      [groupId]
    );

    if (permissions.length === 0) {
      // Should not happen if group exists, but just in case
      return NextResponse.json(
        {
          canCreateTasks: false,
          canEditTasks: false,
          canDeleteTasks: false,
          canManageMembers: false,
          canManageTags: false,
          canEditProject: false
        }
      );
    }

    return NextResponse.json(permissions[0]);
  } catch (error) {
    console.error("Get group permissions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

const updatePermissionsSchema = z.object({
  canCreateTasks: z.boolean().optional(),
  canEditTasks: z.boolean().optional(),
  canDeleteTasks: z.boolean().optional(),
  canManageMembers: z.boolean().optional(),
  canManageTags: z.boolean().optional(),
  canEditProject: z.boolean().optional(),
});

// Update permissions for a group
async function handlePATCH(req: AuthRequest, { params }: Params) {
  try {
    const { id: groupId } = await params;
    const userId = req.user!.userId;
    const body = await req.json();
    const validatedData = updatePermissionsSchema.parse(body);

    // Check if user is project owner. Only owner can manage permissions for now to be safe, 
    // or maybe admins (can_manage_members).
    // Let's restrict to project OWNER for strict security on permission changes, 
    // or allow 'can_edit_project' which we used for group creation.
    const [access] = await db.query<RowDataPacket[]>(
      `SELECT pr.id
       FROM \`groups\` g
       JOIN projects pr ON g.project_id = pr.id
       LEFT JOIN \`groups\` user_g ON user_g.project_id = pr.id
       LEFT JOIN group_members gm ON gm.group_id = user_g.id
       LEFT JOIN permissions p ON p.group_id = user_g.id
       WHERE g.id = ? AND gm.user_id = ? AND (pr.owner_id = ? OR p.can_edit_project = true)`,
      [groupId, userId, userId]
    );

    if (access.length === 0) {
      return NextResponse.json(
        { error: "Permission denied" },
        { status: 403 }
      );
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (validatedData.canCreateTasks !== undefined) {
      updates.push("can_create_tasks = ?");
      values.push(validatedData.canCreateTasks);
    }
    if (validatedData.canEditTasks !== undefined) {
      updates.push("can_edit_tasks = ?");
      values.push(validatedData.canEditTasks);
    }
    if (validatedData.canDeleteTasks !== undefined) {
      updates.push("can_delete_tasks = ?");
      values.push(validatedData.canDeleteTasks);
    }
    if (validatedData.canManageMembers !== undefined) {
      updates.push("can_manage_members = ?");
      values.push(validatedData.canManageMembers);
    }
    if (validatedData.canManageTags !== undefined) {
      updates.push("can_manage_tags = ?");
      values.push(validatedData.canManageTags);
    }
    if (validatedData.canEditProject !== undefined) {
      updates.push("can_edit_project = ?");
      values.push(validatedData.canEditProject);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No details to update" },
        { status: 400 }
      );
    }

    values.push(groupId);

    await db.query(
      `UPDATE permissions SET ${updates.join(", ")} WHERE group_id = ?`,
      values
    );

    return NextResponse.json({ message: "Permissions updated successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: (error as any).errors },
        { status: 400 }
      );
    }
    console.error("Update group permissions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGET);
export const PATCH = withAuth(handlePATCH);
