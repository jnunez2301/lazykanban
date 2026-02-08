import { NextResponse } from "next/server";
import { withAuth, AuthRequest } from "@/middleware/auth";
import db from "@/lib/db";
import { z } from "zod";
import { RowDataPacket } from "mysql2";

interface Params {
  params: Promise<{ id: string }>;
}

// Get all tasks in a project
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

    // Get all tasks with related data
    const [tasks] = await db.query<RowDataPacket[]>(
      `SELECT t.id, t.title, t.description, t.priority, t.due_date, t.created_at, t.updated_at,
       t.owner_id, owner.name as owner_name, owner.email as owner_email,
       t.assignee_id, assignee.name as assignee_name, assignee.email as assignee_email,
       t.tag_id, tag.name as tag_name, tag.color as tag_color
       FROM tasks t
       LEFT JOIN users owner ON t.owner_id = owner.id
       LEFT JOIN users assignee ON t.assignee_id = assignee.id
       LEFT JOIN tags tag ON t.tag_id = tag.id
       WHERE t.project_id = ?
       ORDER BY t.created_at DESC`,
      [projectId]
    );

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Get tasks error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  assigneeId: z.number().optional(),
  tagId: z.number().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  due_date: z.string().optional(),
});

// Create a new task
async function handlePOST(req: AuthRequest, { params }: Params) {
  try {
    const { id: projectId } = await params;
    const userId = req.user!.userId;
    const body = await req.json();
    const validatedData = createTaskSchema.parse(body);

    // Check if user has permission to create tasks
    const [permissions] = await db.query<RowDataPacket[]>(
      `SELECT p.can_create_tasks
       FROM projects pr
       JOIN \`groups\` g ON g.project_id = pr.id
       JOIN group_members gm ON gm.group_id = g.id
       JOIN permissions p ON p.group_id = g.id
       WHERE pr.id = ? AND gm.user_id = ? AND p.can_create_tasks = true`,
      [projectId, userId]
    );

    if (permissions.length === 0) {
      return NextResponse.json(
        { error: "Permission denied - cannot create tasks" },
        { status: 403 }
      );
    }

    // Create task
    const [result] = await db.query(
      `INSERT INTO tasks (project_id, title, description, owner_id, assignee_id, tag_id, priority, due_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        projectId,
        validatedData.title,
        validatedData.description || null,
        userId,
        validatedData.assigneeId || null,
        validatedData.tagId || null,
        validatedData.priority,
        validatedData.due_date || null,
      ]
    );

    const taskId = (result as any).insertId;

    // If task is assigned, record assignment history
    if (validatedData.assigneeId) {
      await db.query(
        "INSERT INTO task_assignments (task_id, assigned_by, assigned_to) VALUES (?, ?, ?)",
        [taskId, userId, validatedData.assigneeId]
      );
    }

    // Get the created task with all details
    const [tasks] = await db.query<RowDataPacket[]>(
      `SELECT t.id, t.title, t.description, t.priority, t.due_date, t.created_at,
       t.owner_id, owner.name as owner_name,
       t.assignee_id, assignee.name as assignee_name,
       t.tag_id, tag.name as tag_name, tag.color as tag_color
       FROM tasks t
       LEFT JOIN users owner ON t.owner_id = owner.id
       LEFT JOIN users assignee ON t.assignee_id = assignee.id
       LEFT JOIN tags tag ON t.tag_id = tag.id
       WHERE t.id = ?`,
      [taskId]
    );

    return NextResponse.json(tasks[0], { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: (error as any).errors },
        { status: 400 }
      );
    }

    console.error("Create task error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGET);
export const POST = withAuth(handlePOST);
