import { NextResponse } from "next/server";
import { withAuth, AuthRequest } from "@/middleware/auth";
import db from "@/lib/db";
import { z } from "zod";
import { RowDataPacket } from "mysql2";

// Get all projects for the current user
async function handleGET(req: AuthRequest) {
  try {
    const userId = req.user!.userId;

    // Get projects where user is owner or member of a group
    const [projects] = await db.query<RowDataPacket[]>(
      `SELECT DISTINCT p.id, p.name, p.description, p.owner_id, p.created_at, p.updated_at,
       u.name as owner_name
       FROM projects p
       LEFT JOIN users u ON p.owner_id = u.id
       LEFT JOIN \`groups\` g ON g.project_id = p.id
       LEFT JOIN group_members gm ON gm.group_id = g.id
       WHERE p.owner_id = ? OR gm.user_id = ?
       ORDER BY p.created_at DESC`,
      [userId, userId]
    );

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Get projects error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

const createProjectSchema = z.object({
  name: z.string().min(2, "Project name must be at least 2 characters"),
  description: z.string().optional(),
});

// Create a new project
async function handlePOST(req: AuthRequest) {
  const connection = await db.getConnection();

  try {
    const userId = req.user!.userId;
    const body = await req.json();
    const validatedData = createProjectSchema.parse(body);

    await connection.beginTransaction();

    // Create project
    const [projectResult] = await connection.query(
      "INSERT INTO projects (name, description, owner_id) VALUES (?, ?, ?)",
      [validatedData.name, validatedData.description || null, userId]
    );

    const projectId = (projectResult as any).insertId;

    // Create default group for the project
    const [groupResult] = await connection.query(
      "INSERT INTO `groups` (project_id, name, description) VALUES (?, ?, ?)",
      [projectId, "Default Group", "Default group for all project members"]
    );

    const groupId = (groupResult as any).insertId;

    // Add owner to the default group as admin
    await connection.query(
      "INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)",
      [groupId, userId, "admin"]
    );

    // Set full permissions for the default group
    await connection.query(
      `INSERT INTO permissions (group_id, can_create_tasks, can_edit_tasks, can_delete_tasks, 
       can_manage_tags, can_manage_members, can_edit_project) 
       VALUES (?, true, true, true, true, true, true)`,
      [groupId]
    );

    // Create default tags
    const defaultTags = [
      { name: "Backlog", color: "#6B7280", order: 0 },
      { name: "Defined", color: "#3B82F6", order: 1 },
      { name: "In-Progress", color: "#F59E0B", order: 2 },
      { name: "Completed", color: "#10B981", order: 3 },
    ];

    for (const tag of defaultTags) {
      await connection.query(
        "INSERT INTO tags (project_id, name, color, is_default, display_order) VALUES (?, ?, ?, true, ?)",
        [projectId, tag.name, tag.color, tag.order]
      );
    }

    await connection.commit();

    return NextResponse.json(
      {
        id: projectId,
        name: validatedData.name,
        description: validatedData.description,
        ownerId: userId,
      },
      { status: 201 }
    );
  } catch (error) {
    await connection.rollback();

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: (error as any).errors },
        { status: 400 }
      );
    }

    console.error("Create project error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}

export const GET = withAuth(handleGET);
export const POST = withAuth(handlePOST);
