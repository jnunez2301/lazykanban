import { NextResponse } from "next/server";
import { withAuth, AuthRequest } from "@/middleware/auth";
import { GroupMember } from "@/models/GroupMember";
import { Group } from "@/models/Group";
import { z } from "zod";

const addMemberSchema = z.object({
  userId: z.number(),
  role: z.enum(["owner", "admin", "member"]).default("member"),
});

interface Params {
  params: Promise<{ id: string }>;
}

// Add member to group with one-group-per-user-per-project validation
async function handlePOST(req: AuthRequest, { params }: Params) {
  try {
    const { id: groupId } = await params;
    const body = await req.json();
    const { userId, role } = addMemberSchema.parse(body);

    // Get the group with project info
    const group = await Group.findByPk(groupId);
    if (!group) {
      return NextResponse.json(
        { error: "Group not found" },
        { status: 404 }
      );
    }

    // Check if user is already in ANY group for this project (Phase 3: One group per user per project)
    const existingMembership = await GroupMember.findOne({
      include: [{
        model: Group,
        where: { projectId: group.projectId },
        required: true,
      }],
      where: { userId },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: "User is already a member of another group in this project. Each user can only be in one group per project." },
        { status: 400 }
      );
    }

    // Add member to group
    const member = await GroupMember.create({
      groupId: parseInt(groupId),
      userId,
      role,
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
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

export const POST = withAuth(handlePOST);
