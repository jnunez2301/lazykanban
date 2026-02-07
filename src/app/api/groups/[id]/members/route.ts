import { NextResponse } from "next/server";
import { withAuth, AuthRequest } from "@/middleware/auth";
import db from "@/lib/db";
import { z } from "zod";
import { RowDataPacket } from "mysql2";

interface Params {
  params: Promise<{ id: string }>;
}

// Get group members
async function handleGET(req: AuthRequest, { params }: Params) {
  try {
    const { id } = await params;
    const userId = req.user!.userId;

    // Check access
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

    const [members] = await db.query<RowDataPacket[]>(
      `SELECT gm.id, gm.user_id, gm.role, gm.created_at,
       u.name as user_name, u.email as user_email
       FROM group_members gm
       JOIN users u ON gm.user_id = u.id
       WHERE gm.group_id = ?
       ORDER BY u.name ASC`,
      [id]
    );

    return NextResponse.json(members);
  } catch (error) {
    console.error("Get members error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

const addMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'manager', 'member', 'viewer']).default('member'),
});

// Add member to group
async function handlePOST(req: AuthRequest, { params }: Params) {
  try {
    const { id } = await params;
    const userId = req.user!.userId;
    const body = await req.json();
    const validatedData = addMemberSchema.parse(body);

    // Check permission
    const [permissions] = await db.query<RowDataPacket[]>(
      `SELECT p.can_manage_members
       FROM \`groups\` target_g
       JOIN projects pr ON target_g.project_id = pr.id
       JOIN \`groups\` g ON g.project_id = pr.id
       JOIN group_members gm ON gm.group_id = g.id
       JOIN permissions p ON p.group_id = g.id
       WHERE target_g.id = ? AND gm.user_id = ? AND (pr.owner_id = ? OR p.can_manage_members = true)`,
      [id, userId, userId]
    );

    if (permissions.length === 0) {
      return NextResponse.json(
        { error: "Permission denied" },
        { status: 403 }
      );
    }

    // Find user by email
    const [users] = await db.query<RowDataPacket[]>(
      "SELECT id FROM users WHERE email = ?",
      [validatedData.email]
    );

    if (users.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const targetUserId = users[0].id;

    // Check if user is already in the group
    const [existing] = await db.query<RowDataPacket[]>(
      "SELECT id FROM group_members WHERE group_id = ? AND user_id = ?",
      [id, targetUserId]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "User is already a member of this group" },
        { status: 409 }
      );
    }

    // Add member
    await db.query(
      "INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)",
      [id, targetUserId, validatedData.role]
    );

    return NextResponse.json({ message: "Member added successfully" }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: (error as any).errors },
        { status: 400 }
      );
    }

    console.error("Add member error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Remove member from group
async function handleDELETE(req: AuthRequest, { params }: Params) {
  // To verify: Do we need a body for DELETE? Next.js standard usually passes ID in URL.
  // But here we are removing a user from a group.
  // Standard REST for sub-resources: DELETE /api/groups/:id/members/:userId or query param?
  // Let's use query param ?userId=... for simplicity in this route structure, 
  // or expect a JSON body (Not standard for DELETE but often supported).
  // Better approach: make a new route `api/groups/[id]/members/[memberId]` but I already defined the route structure.
  // I will use search params for the member ID (the group_members.id or the user_id).
  // Let's use user_id from query params.

  try {
    const { id: groupId } = await params;
    const userId = req.user!.userId;
    const url = new URL(req.url);
    const targetMemberId = url.searchParams.get("memberId"); // This is group_members.id

    if (!targetMemberId) {
      return NextResponse.json(
        { error: "Member ID required" },
        { status: 400 }
      );
    }

    // Check permission
    const [permissions] = await db.query<RowDataPacket[]>(
      `SELECT p.can_manage_members
       FROM \`groups\` target_g
       JOIN projects pr ON target_g.project_id = pr.id
       JOIN \`groups\` g ON g.project_id = pr.id
       JOIN group_members gm ON gm.group_id = g.id
       JOIN permissions p ON p.group_id = g.id
       WHERE target_g.id = ? AND gm.user_id = ? AND (pr.owner_id = ? OR p.can_manage_members = true)`,
      [groupId, userId, userId]
    );

    if (permissions.length === 0) {
      return NextResponse.json(
        { error: "Permission denied" },
        { status: 403 }
      );
    }

    await db.query("DELETE FROM group_members WHERE id = ? AND group_id = ?", [targetMemberId, groupId]);

    return NextResponse.json({ message: "Member removed successfully" });
  } catch (error) {
    console.error("Remove member error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGET);
export const POST = withAuth(handlePOST);
export const DELETE = withAuth(handleDELETE);
