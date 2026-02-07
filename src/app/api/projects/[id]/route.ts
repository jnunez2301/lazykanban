import { NextResponse } from "next/server";
import { withAuth, AuthRequest } from "@/middleware/auth";
import db from "@/lib/db";
import { z } from "zod";
import { RowDataPacket } from "mysql2";

interface Params {
  params: Promise<{ id: string }>;
}

// Get project details
async function handleGET(req: AuthRequest, { params }: Params) {
  try {
    const { id } = await params;
    const userId = req.user!.userId;

    // Check if user has access to this project
    const [projects] = await db.query<RowDataPacket[]>(
      `SELECT DISTINCT p.id, p.name, p.description, p.owner_id, p.created_at, p.updated_at,
       u.name as owner_name
       FROM projects p
       LEFT JOIN users u ON p.owner_id = u.id
       LEFT JOIN \`groups\` g ON g.project_id = p.id
       LEFT JOIN group_members gm ON gm.group_id = g.id
       WHERE p.id = ? AND (p.owner_id = ? OR gm.user_id = ?)`,
      [id, userId, userId]
    );

    if (projects.length === 0) {
      return NextResponse.json(
        { error: "Project not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json(projects[0]);
  } catch (error) {
    console.error("Get project error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

const updateProjectSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
});

// Update project
async function handlePATCH(req: AuthRequest, { params }: Params) {
  try {
    const { id } = await params;
    const userId = req.user!.userId;
    const body = await req.json();
    const validatedData = updateProjectSchema.parse(body);

    // Check if user has permission to edit project
    const [permissions] = await db.query<RowDataPacket[]>(
      `SELECT p.can_edit_project
       FROM projects pr
       JOIN \`groups\` g ON g.project_id = pr.id
       JOIN group_members gm ON gm.group_id = g.id
       JOIN permissions p ON p.group_id = g.id
       WHERE pr.id = ? AND gm.user_id = ? AND (pr.owner_id = ? OR p.can_edit_project = true)`,
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

    if (validatedData.name) {
      updates.push("name = ?");
      values.push(validatedData.name);
    }

    if (validatedData.description !== undefined) {
      updates.push("description = ?");
      values.push(validatedData.description);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    values.push(id);

    await db.query(
      `UPDATE projects SET ${updates.join(", ")} WHERE id = ?`,
      values
    );

    const [projects] = await db.query<RowDataPacket[]>(
      "SELECT id, name, description, owner_id FROM projects WHERE id = ?",
      [id]
    );

    return NextResponse.json(projects[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: (error as any).errors },
        { status: 400 }
      );
    }

    console.error("Update project error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Delete project
async function handleDELETE(req: AuthRequest, { params }: Params) {
  try {
    const { id } = await params;
    const userId = req.user!.userId;

    // Only owner can delete project
    const [projects] = await db.query<RowDataPacket[]>(
      "SELECT id FROM projects WHERE id = ? AND owner_id = ?",
      [id, userId]
    );

    if (projects.length === 0) {
      return NextResponse.json(
        { error: "Project not found or you are not the owner" },
        { status: 404 }
      );
    }

    await db.query("DELETE FROM projects WHERE id = ?", [id]);

    return NextResponse.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Delete project error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGET);
export const PATCH = withAuth(handlePATCH);
export const DELETE = withAuth(handleDELETE);
