import { NextResponse } from "next/server";
import { withAuth, AuthRequest } from "@/middleware/auth";
import db from "@/lib/db";
import { z } from "zod";
import { RowDataPacket } from "mysql2";

interface Params {
  params: Promise<{ id: string }>;
}

// Get all tags for a project
async function handleGET(req: AuthRequest, { params }: Params) {
  try {
    const { id: projectId } = await params;
    const userId = req.user!.userId;

    // Check access
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

    const [tags] = await db.query<RowDataPacket[]>(
      "SELECT * FROM tags WHERE project_id = ? ORDER BY display_order ASC, name ASC",
      [projectId]
    );

    return NextResponse.json(tags);
  } catch (error) {
    console.error("Get tags error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

const createTagSchema = z.object({
  name: z.string().min(1, "Name is required"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format").default("#6B7280"),
});

// Create a new tag
async function handlePOST(req: AuthRequest, { params }: Params) {
  try {
    const { id: projectId } = await params;
    const userId = req.user!.userId;
    const body = await req.json();
    const validatedData = createTagSchema.parse(body);

    // Check permission - can_manage_tags
    const [permissions] = await db.query<RowDataPacket[]>(
      `SELECT p.can_manage_tags
       FROM projects pr
       JOIN \`groups\` g ON g.project_id = pr.id
       JOIN group_members gm ON gm.group_id = g.id
       JOIN permissions p ON p.group_id = g.id
       WHERE pr.id = ? AND gm.user_id = ? AND (pr.owner_id = ? OR p.can_manage_tags = true)`,
      [projectId, userId, userId]
    );

    if (permissions.length === 0) {
      return NextResponse.json(
        { error: "Permission denied" },
        { status: 403 }
      );
    }

    // Get max display order
    const [orderResult] = await db.query<RowDataPacket[]>(
      "SELECT MAX(display_order) as max_order FROM tags WHERE project_id = ?",
      [projectId]
    );
    const nextOrder = (orderResult[0].max_order || 0) + 1;

    // Create tag
    const [result] = await db.query(
      "INSERT INTO tags (project_id, name, color, is_default, display_order) VALUES (?, ?, ?, false, ?)",
      [projectId, validatedData.name, validatedData.color, nextOrder]
    );

    const tagId = (result as any).insertId;

    return NextResponse.json(
      {
        id: tagId,
        project_id: projectId,
        name: validatedData.name,
        color: validatedData.color,
        is_default: false,
        display_order: nextOrder,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: (error as any).errors },
        { status: 400 }
      );
    }

    if ((error as any).code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { error: "Tag already exists in this project" },
        { status: 409 }
      );
    }

    console.error("Create tag error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGET);
export const POST = withAuth(handlePOST);
