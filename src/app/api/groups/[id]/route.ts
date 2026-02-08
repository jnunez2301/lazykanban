import { NextResponse } from "next/server";
import { withAuth, AuthRequest } from "@/middleware/auth";
import db from "@/lib/db";
import { z } from "zod";
import { RowDataPacket } from "mysql2";

interface Params {
  params: Promise<{ id: string }>;
}

// Get group details
async function handleGET(req: AuthRequest, { params }: Params) {
  try {
    const { id } = await params;
    const userId = req.user!.userId;

    const [groups] = await db.query<RowDataPacket[]>(
      `SELECT g.id, g.name, g.description, g.project_id, g.created_at, g.updated_at
       FROM \`groups\` g
       JOIN projects p ON g.project_id = p.id
       LEFT JOIN \`groups\` ug ON ug.project_id = p.id
       LEFT JOIN group_members gm ON gm.group_id = ug.id
       WHERE g.id = ? AND (p.owner_id = ? OR gm.user_id = ?)`,
      [id, userId, userId]
    );

    if (groups.length === 0) {
      return NextResponse.json(
        { error: "Group not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json(groups[0]);
  } catch (error) {
    console.error("Get group error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

const updateGroupSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
});

// Update group
async function handlePATCH(req: AuthRequest, { params }: Params) {
  try {
    const { id } = await params;
    const userId = req.user!.userId;
    const body = await req.json();
    const validatedData = updateGroupSchema.parse(body);

    // Check if user is owner or has permission to edit
    const [ownerCheck] = await db.query<RowDataPacket[]>(
      `SELECT pr.id
       FROM \`groups\` target_g
       JOIN projects pr ON target_g.project_id = pr.id
       WHERE target_g.id = ? AND pr.owner_id = ?`,
      [id, userId]
    );

    const isOwner = ownerCheck.length > 0;

    if (!isOwner) {
      // If not owner, check if user has edit permissions through their group
      const [permissions] = await db.query<RowDataPacket[]>(
        `SELECT p.can_edit_project
         FROM \`groups\` target_g
         JOIN projects pr ON target_g.project_id = pr.id
         JOIN \`groups\` g ON g.project_id = pr.id
         JOIN group_members gm ON gm.group_id = g.id
         JOIN permissions p ON p.group_id = g.id
         WHERE target_g.id = ? AND gm.user_id = ? AND p.can_edit_project = true`,
        [id, userId]
      );

      if (permissions.length === 0) {
        return NextResponse.json(
          { error: "Permission denied" },
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
      `UPDATE \`groups\` SET ${updates.join(", ")} WHERE id = ?`,
      values
    );

    const [groups] = await db.query<RowDataPacket[]>(
      "SELECT id, name, description FROM \`groups\` WHERE id = ?",
      [id]
    );

    return NextResponse.json(groups[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: (error as any).errors },
        { status: 400 }
      );
    }

    console.error("Update group error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Delete group
async function handleDELETE(req: AuthRequest, { params }: Params) {
  try {
    const { id } = await params;
    const userId = req.user!.userId;

    // Check if user is owner or has permission to delete
    const [ownerCheck] = await db.query<RowDataPacket[]>(
      `SELECT pr.id
       FROM \`groups\` target_g
       JOIN projects pr ON target_g.project_id = pr.id
       WHERE target_g.id = ? AND pr.owner_id = ?`,
      [id, userId]
    );

    const isOwner = ownerCheck.length > 0;

    if (!isOwner) {
      // If not owner, check if user has edit permissions through their group
      const [permissions] = await db.query<RowDataPacket[]>(
        `SELECT p.can_edit_project
         FROM \`groups\` target_g
         JOIN projects pr ON target_g.project_id = pr.id
         JOIN \`groups\` g ON g.project_id = pr.id
         JOIN group_members gm ON gm.group_id = g.id
         JOIN permissions p ON p.group_id = g.id
         WHERE target_g.id = ? AND gm.user_id = ? AND p.can_edit_project = true`,
        [id, userId]
      );

      if (permissions.length === 0) {
        return NextResponse.json(
          { error: "Permission denied" },
          { status: 403 }
        );
      }
    }

    await db.query("DELETE FROM \`groups\` WHERE id = ?", [id]);

    return NextResponse.json({ message: "Group deleted successfully" });
  } catch (error) {
    console.error("Delete group error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGET);
export const PATCH = withAuth(handlePATCH);
export const DELETE = withAuth(handleDELETE);
