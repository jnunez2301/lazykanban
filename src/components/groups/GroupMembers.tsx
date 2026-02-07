"use client";

import { useGroupMembers, GroupMember } from "@/hooks/useGroupMembers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trash2, UserPlus, Shield } from "lucide-react";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/store/authStore";

interface GroupMembersProps {
  groupId: number;
  readOnly?: boolean;
}

export const GroupMembers = ({ groupId, readOnly = false }: GroupMembersProps) => {
  const { data: members, isLoading, addMember, removeMember, isAdding, isRemoving } = useGroupMembers(groupId);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("member");
  const { user } = useAuthStore();

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail) return;
    try {
      await addMember({ email: newMemberEmail, role: newMemberRole });
      setNewMemberEmail("");
    } catch (error) {
      console.error("Failed to add member", error);
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    try {
      await removeMember(memberId);
    } catch (error) {
      console.error("Failed to remove member", error);
    }
  };

  if (isLoading) {
    return <div>Loading members...</div>;
  }

  return (
    <div className="space-y-6">
      {!readOnly && (
        <form onSubmit={handleAddMember} className="flex gap-2 items-end">
          <div className="flex-1 space-y-1">
            <Input
              placeholder="User email"
              type="email"
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
              required
            />
          </div>
          <div className="w-32 space-y-1">
            <Select value={newMemberRole} onValueChange={setNewMemberRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={isAdding}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </form>
      )}

      <div className="space-y-2">
        <h3 className="text-sm font-medium">Members ({members?.length || 0})</h3>
        <div className="border rounded-md divide-y">
          {members?.map((member) => (
            <div key={member.id} className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{member.user_name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{member.user_name}</p>
                  <p className="text-xs text-muted-foreground">{member.user_email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                  <Shield className="h-3 w-3 mr-1" />
                  {member.role}
                </div>
                {!readOnly && member.user_id !== user?.id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemoveMember(member.user_id)}
                    disabled={isRemoving}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          {members?.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No members in this group.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
