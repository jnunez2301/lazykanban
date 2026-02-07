"use client";

import { useUIStore } from "@/store/uiStore";
import { useProject } from "@/hooks/useProjects";
import { useParams } from "next/navigation";
import { TaskBoard } from "@/components/tasks/TaskBoard";
import { TaskList } from "@/components/tasks/TaskList";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const { currentMode } = useUIStore();
  const { data: project, isLoading, error } = useProject(id);

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
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
          {project.description && (
            <p className="text-muted-foreground text-sm">{project.description}</p>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0"> {/* Ensure content takes remaining height but doesn't overflow parent flex */}
        {currentMode === "dev" ? (
          <TaskBoard projectId={project.id.toString()} />
        ) : (
          <TaskList projectId={project.id.toString()} />
        )}
      </div>
    </div>
  );
}
