import { NextResponse } from "next/server";
import { withAuth, AuthRequest } from "@/middleware/auth";
import db from "@/lib/db";
import { z } from "zod";
import { RowDataPacket } from "mysql2";

interface Params {
  params: Promise<{ id: string }>;
}

// Get task details
async function handleGET(req: AuthRequest, { params }: Params) {
  try {
    const { id } = await params;
    const userId = req.user!.userId;

    // Get task with access check
    const [tasks] = await db.query<RowDataPacket[]>(
      `SELECT t.id, t.project_id, t.title, t.description, t.priority, t.due_date, t.created_at, t.updated_at,
       t.owner_id, owner.name as owner_name, owner.email as owner_email,
       t.assignee_id, assignee.name as assignee_name, assignee.email as assignee_email,
       t.tag_id, tag.name as tag_name, tag.color as tag_color
       FROM tasks t
       LEFT JOIN users owner ON t.owner_id = owner.id
       LEFT JOIN users assignee ON t.assignee_id = assignee.id
       LEFT JOIN tags tag ON t.tag_id = tag.id
       JOIN projects p ON t.project_id = p.id
       LEFT JOIN \`groups\` g ON g.project_id = p.id
       LEFT JOIN group_members gm ON gm.group_id = g.id
       WHERE t.id = ? AND (p.owner_id = ? OR gm.user_id = ?)`,
      [id, userId, userId]
    );

    if (tasks.length === 0) {
      return NextResponse.json(
        { error: "Task not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json(tasks[0]);
  } catch (error) {
    console.error("Get task error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  assigneeId: z.number().nullable().optional(),
  tagId: z.number().nullable().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  due_date: z.string().nullable().optional(),
});

// Update task
async function handlePATCH(req: AuthRequest, { params }: Params) {
  try {
    const { id } = await params;
    const userId = req.user!.userId;
    const body = await req.json();
    const validatedData = updateTaskSchema.parse(body);

    // Owner-first permission check: project owner can always edit
    const [ownerCheck] = await db.query<RowDataPacket[]>(
      `SELECT pr.owner_id, t.owner_id as task_owner_id, t.assignee_id
       FROM tasks t
       JOIN projects pr ON t.project_id = pr.id
       WHERE t.id = ?`,
      [id]
    );

    if (ownerCheck.length === 0) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    const isProjectOwner = ownerCheck[0].owner_id === userId;

    // If not project owner, check for can_edit_tasks permission
    if (!isProjectOwner) {
      const [permissions] = await db.query<RowDataPacket[]>(
        `SELECT p.can_edit_tasks
         FROM tasks t
         JOIN projects pr ON t.project_id = pr.id
         JOIN \`groups\` g ON g.project_id = pr.id
         JOIN group_members gm ON gm.group_id = g.id
         JOIN permissions p ON p.group_id = g.id
         WHERE t.id = ? AND gm.user_id = ? AND p.can_edit_tasks = true`,
        [id, userId]
      );
      if (permissions.length === 0) {
        return NextResponse.json(
          { error: "Permission denied - you need can_edit_tasks permission" },
          { status: 403 }
        );
      }
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (validatedData.title) {
      updates.push("title = ?");
      values.push(validatedData.title);
    }

    if (validatedData.description !== undefined) {
      updates.push("description = ?");
      values.push(validatedData.description);
    }

    if (validatedData.assigneeId !== undefined) {
      updates.push("assignee_id = ?");
      values.push(validatedData.assigneeId);

      // Record assignment change
      if (validatedData.assigneeId) {
        await db.query(
          "INSERT INTO task_assignments (task_id, assigned_by, assigned_to) VALUES (?, ?, ?)",
          [id, userId, validatedData.assigneeId]
        );
      }
    }

    if (validatedData.tagId !== undefined) {
      updates.push("tag_id = ?");
      values.push(validatedData.tagId);
    }

    if (validatedData.priority) {
      updates.push("priority = ?");
      values.push(validatedData.priority);
    }

    if (validatedData.due_date !== undefined) {
      updates.push("due_date = ?");
      values.push(validatedData.due_date);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    values.push(id);

    await db.query(
      `UPDATE tasks SET ${updates.join(", ")} WHERE id = ?`,
      values
    );

    // Get updated task
    const [tasks] = await db.query<RowDataPacket[]>(
      `SELECT t.id, t.title, t.description, t.priority, t.due_date, t.created_at, t.updated_at,
       t.owner_id, owner.name as owner_name,
       t.assignee_id, assignee.name as assignee_name,
       t.tag_id, tag.name as tag_name, tag.color as tag_color
       FROM tasks t
       LEFT JOIN users owner ON t.owner_id = owner.id
       LEFT JOIN users assignee ON t.assignee_id = assignee.id
       LEFT JOIN tags tag ON t.tag_id = tag.id
       WHERE t.id = ?`,
      [id]
    );

    return NextResponse.json(tasks[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: (error as any).errors },
        { status: 400 }
      );
    }

    console.error("Update task error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Delete task
async function handleDELETE(req: AuthRequest, { params }: Params) {
  try {
    const { id } = await params;
    const userId = req.user!.userId;

    // Owner-first permission check: project owner can always delete
    const [ownerCheck] = await db.query<RowDataPacket[]>(
      `SELECT pr.owner_id, t.owner_id as task_owner_id
       FROM tasks t
       JOIN projects pr ON t.project_id = pr.id
       WHERE t.id = ?`,
      [id]
    );

    if (ownerCheck.length === 0) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    const isProjectOwner = ownerCheck[0].owner_id === userId;

    // If not project owner, check for can_delete_tasks permission
    if (!isProjectOwner) {
      const [permissions] = await db.query<RowDataPacket[]>(
        `SELECT p.can_delete_tasks
         FROM tasks t
         JOIN projects pr ON t.project_id = pr.id
         JOIN \`groups\` g ON g.project_id = pr.id
         JOIN group_members gm ON gm.group_id = g.id
         JOIN permissions p ON p.group_id = g.id
         WHERE t.id = ? AND gm.user_id = ? AND p.can_delete_tasks = true`,
        [id, userId]
      );

      if (permissions.length === 0) {
        return NextResponse.json(
          { error: "Permission denied - you need can_delete_tasks permission" },
          { status: 403 }
        );
      }
    }

    await db.query("DELETE FROM tasks WHERE id = ?", [id]);

    return NextResponse.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Delete task error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGET);
export const PATCH = withAuth(handlePATCH);
export const DELETE = withAuth(handleDELETE);
