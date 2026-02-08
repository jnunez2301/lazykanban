"use client";

import { useState } from "react";
import { useGroupMembers } from "@/hooks/useGroupMembers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Trash2, UserPlus, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface GroupMembersManagerProps {
  groupId: number;
}

export function GroupMembersManager({ groupId }: GroupMembersManagerProps) {
  const { data: members, isLoading, addMember, removeMember, isAdding, isRemoving } = useGroupMembers(groupId);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("member");
  const { toast } = useToast();

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail) return;

    try {
      await addMember({ email: newMemberEmail, role: newMemberRole });
      setNewMemberEmail("");
      toast({ title: "Member added successfully" });
    } catch (error: any) {
      toast({
        title: "Error adding member",
        description: error.message || "Failed to add member",
        variant: "destructive"
      });
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    try {
      await removeMember(memberId);
      toast({ title: "Member removed successfully" });
    } catch (error: any) {
      toast({
        title: "Error removing member",
        description: error.message || "Failed to remove member",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-4"><Loader2 className="animate-spin h-6 w-6" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b pb-4">
        <h3 className="text-lg font-medium">Add Member</h3>
        <form onSubmit={handleAddMember} className="flex gap-2 items-end">
          <div className="flex-1 space-y-2">
            <Input
              placeholder="User Email"
              type="email"
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
              required
            />
          </div>
          <div className="w-[120px]">
            <Select value={newMemberRole} onValueChange={setNewMemberRole}>
              <SelectTrigger>
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={isAdding}>
            {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          </Button>
        </form>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-medium">Current Members ({members?.length || 0})</h3>
        <div className="rounded-md border max-h-[300px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members?.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{member.user_name}</span>
                      <span className="text-xs text-muted-foreground">{member.user_email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">{member.role}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleRemoveMember(member.id)}
                      disabled={isRemoving}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {members?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                    No members in this group.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
