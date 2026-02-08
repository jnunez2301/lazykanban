import { NextResponse } from "next/server";
import { withAuth, AuthRequest } from "@/middleware/auth";
import db from "@/lib/db";
import { z } from "zod";
import { RowDataPacket } from "mysql2";

interface Params {
  params: Promise<{ id: string }>;
}

// Get all groups in a project
async function handleGET(req: AuthRequest, { params }: Params) {
  try {
    const { id: projectId } = await params;
    const userId = req.user!.userId;

    // Check if user has access to this project
    const [access] = await db.query<RowDataPacket[]>(
      `SELECT DISTINCT p.id
       FROM projects p
       LEFT JOIN \`groups\` g ON g.project_id = p.id
       LEFT JOIN group_members gm ON gm.group_id = g.id
       WHERE p.id = ? AND (p.owner_id = ? OR gm.user_id = ?)`,
      [projectId, userId, userId]
    );

    if (access.length === 0) {
      return NextResponse.json(
        { error: "Project not found or access denied" },
        { status: 404 }
      );
    }

    // Get groups with permissions
    const [groups] = await db.query<RowDataPacket[]>(
      `SELECT g.id, g.name, g.description, g.created_at, g.updated_at,
       (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id) as member_count,
       p.can_create_tasks as canCreateTasks,
       p.can_edit_tasks as canEditTasks,
       p.can_delete_tasks as canDeleteTasks,
       p.can_manage_members as canManageMembers,
       p.can_manage_tags as canManageTags,
       p.can_edit_project as canEditProject
       FROM \`groups\` g
       LEFT JOIN permissions p ON p.group_id = g.id
       WHERE g.project_id = ?
       ORDER BY g.created_at DESC`,
      [projectId]
    );

    return NextResponse.json(groups);
  } catch (error) {
    console.error("Get groups error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

const createGroupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
});

// Create a new group
async function handlePOST(req: AuthRequest, { params }: Params) {
  const connection = await db.getConnection();

  try {
    const { id: projectId } = await params;
    const userId = req.user!.userId;
    const body = await req.json();
    const validatedData = createGroupSchema.parse(body);

    // Check permission - owner OR can_edit_project
    // First check if user is the project owner
    const [ownerCheck] = await db.query<RowDataPacket[]>(
      `SELECT id FROM projects WHERE id = ? AND owner_id = ?`,
      [projectId, userId]
    );

    const isOwner = ownerCheck.length > 0;

    if (!isOwner) {
      // If not owner, check if user has permission through their group
      const [permissions] = await db.query<RowDataPacket[]>(
        `SELECT p.can_edit_project
         FROM projects pr
         JOIN \`groups\` g ON g.project_id = pr.id
         JOIN group_members gm ON gm.group_id = g.id
         JOIN permissions p ON p.group_id = g.id
         WHERE pr.id = ? AND gm.user_id = ? AND p.can_edit_project = true`,
        [projectId, userId]
      );

      if (permissions.length === 0) {
        return NextResponse.json(
          { error: "Permission denied - cannot create groups" },
          { status: 403 }
        );
      }
    }

    await connection.beginTransaction();

    // Create group
    const [groupResult] = await connection.query(
      "INSERT INTO `groups` (project_id, name, description) VALUES (?, ?, ?)",
      [projectId, validatedData.name, validatedData.description || null]
    );

    const groupId = (groupResult as any).insertId;

    // Create default permissions entry (all false by default)
    await connection.query(
      "INSERT INTO permissions (group_id) VALUES (?)",
      [groupId]
    );

    await connection.commit();

    return NextResponse.json(
      {
        id: groupId,
        name: validatedData.name,
        description: validatedData.description,
        project_id: projectId,
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

    // Check for duplicate name error
    if ((error as any).code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { error: "A group with this name already exists in the project" },
        { status: 409 }
      );
    }

    console.error("Create group error:", error);
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
