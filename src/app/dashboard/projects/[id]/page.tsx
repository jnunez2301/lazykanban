"use client";

import { useUIStore } from "@/store/uiStore";
import { useProject } from "@/hooks/useProjects";
import { useUserGroup } from "@/hooks/useUserGroup";
import { useProjectPermissions } from "@/hooks/useProjectPermissions";
import { useParams } from "next/navigation";
import { TaskBoard } from "@/components/tasks/TaskBoard";
import { TaskList } from "@/components/tasks/TaskList";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { SettingsIcon, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const { currentMode } = useUIStore();
  const { data: project, isLoading, error } = useProject(id);
  const { data: userGroup, isLoading: groupLoading } = useUserGroup(id);
  const { data: permissions } = useProjectPermissions(id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-[200px]" />
        <Skeleton className="h-[500px] w-full rounded-xl" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-destructive">Project not found</h2>
        <p className="text-muted-foreground mt-2">
          The project you are looking for does not exist or you don't have access to it.
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
            {!project.description ? <p className="text-muted-foreground text-sm">No description available</p> : (
              <p className="text-muted-foreground text-sm">{project.description}</p>
            )}
            {!groupLoading && userGroup && Array.isArray(userGroup) && userGroup.map((group) => (
              <Badge key={group.group_id} variant="secondary" className="flex items-center gap-1.5 mt-2">
                <Users className="h-3.5 w-3.5" />
                {group.group_name}
                <span className="text-xs opacity-70">({group.role})</span>
              </Badge>
            ))}
          </div>
        </div>
        {/* @ts-ignore: permission is returned as a number in the backend */}
        {permissions?.canManageMembers === 1 && <Link className="flex items-center gap-1.5" href={`/dashboard/projects/${id}/manage`}>
          <SettingsIcon className="h-4 w-4 mr-2" />
          Settings
        </Link>}
      </div>

      <div className="flex-1 min-h-0"> {/* Ensure content takes remaining height but doesn't overflow parent flex */}
        {currentMode === "advanced" ? (
          <TaskBoard projectId={project.id.toString()} />
        ) : (
          <TaskList projectId={project.id.toString()} />
        )}
      </div>
    </div>
  );
}
