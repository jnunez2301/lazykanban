import { NextResponse } from "next/server";
import { withAuth, AuthRequest } from "@/middleware/auth";
import db from "@/lib/db";
import { z } from "zod";
import { RowDataPacket } from "mysql2";

interface Params {
  params: Promise<{ id: string }>;
}

const updateTagSchema = z.object({
  name: z.string().min(1).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

// Update tag
async function handlePATCH(req: AuthRequest, { params }: Params) {
  try {
    const { id } = await params;
    const userId = req.user!.userId;
    const body = await req.json();
    const validatedData = updateTagSchema.parse(body);

    // Check permission - owner OR can_manage_tags
    // Get tag's project to check ownership
    const [tagInfo] = await db.query<RowDataPacket[]>(
      `SELECT t.project_id, pr.owner_id 
       FROM tags t
       JOIN projects pr ON t.project_id = pr.id
       WHERE t.id = ?`,
      [id]
    );

    if (tagInfo.length === 0) {
      return NextResponse.json(
        { error: "Tag not found" },
        { status: 404 }
      );
    }

    const isOwner = tagInfo[0].owner_id === userId;

    if (!isOwner) {
      // If not owner, check if user has permission through their group
      const [permissions] = await db.query<RowDataPacket[]>(
        `SELECT p.can_manage_tags
         FROM projects pr
         JOIN \`groups\` g ON g.project_id = pr.id
         JOIN group_members gm ON gm.group_id = g.id
         JOIN permissions p ON p.group_id = g.id
         WHERE pr.id = ? AND gm.user_id = ? AND p.can_manage_tags = true`,
        [tagInfo[0].project_id, userId]
      );

      if (permissions.length === 0) {
        return NextResponse.json(
          { error: "Permission denied - cannot manage tags" },
          { status: 403 }
        );
      }
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (validatedData.name) {
      updates.push("name = ?");
      values.push(validatedData.name);
    }

    if (validatedData.color) {
      updates.push("color = ?");
      values.push(validatedData.color);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    values.push(id);

    await db.query(
      `UPDATE tags SET ${updates.join(", ")} WHERE id = ?`,
      values
    );

    const [tags] = await db.query<RowDataPacket[]>(
      "SELECT * FROM tags WHERE id = ?",
      [id]
    );

    return NextResponse.json(tags[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: (error as any).errors },
        { status: 400 }
      );
    }

    console.error("Update tag error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Delete tag
async function handleDELETE(req: AuthRequest, { params }: Params) {
  try {
    const { id } = await params;
    const userId = req.user!.userId;

    // Check permission - owner OR can_manage_tags
    // Get tag's project and check if it's default
    const [tagInfo] = await db.query<RowDataPacket[]>(
      `SELECT t.project_id, t.is_default, pr.owner_id 
       FROM tags t
       JOIN projects pr ON t.project_id = pr.id
       WHERE t.id = ?`,
      [id]
    );

    if (tagInfo.length === 0) {
      return NextResponse.json(
        { error: "Tag not found" },
        { status: 404 }
      );
    }

    const isOwner = tagInfo[0].owner_id === userId;

    if (!isOwner) {
      // If not owner, check if user has permission through their group
      const [permissions] = await db.query<RowDataPacket[]>(
        `SELECT p.can_manage_tags
         FROM projects pr
         JOIN \`groups\` g ON g.project_id = pr.id
         JOIN group_members gm ON gm.group_id = g.id
         JOIN permissions p ON p.group_id = g.id
         WHERE pr.id = ? AND gm.user_id = ? AND p.can_manage_tags = true`,
        [tagInfo[0].project_id, userId]
      );

      if (permissions.length === 0) {
        return NextResponse.json(
          { error: "Permission denied - cannot manage tags" },
          { status: 403 }
        );
      }
    }

    if (tagInfo[0].is_default) {
      return NextResponse.json(
        { error: "Cannot delete default system tags" },
        { status: 400 }
      );
    }

    // When deleting a tag, we should probably NULL out references in tasks (handled by ON DELETE SET NULL in schema)
    await db.query("DELETE FROM tags WHERE id = ?", [id]);

    return NextResponse.json({ message: "Tag deleted successfully" });
  } catch (error) {
    console.error("Delete tag error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const PATCH = withAuth(handlePATCH);
export const DELETE = withAuth(handleDELETE);
