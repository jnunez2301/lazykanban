"use client";

import { useProject } from "@/hooks/useProjects";
import { useParams, useRouter } from "next/navigation";
import { GroupManager } from "@/components/groups/GroupManager";
import { TagManager } from "@/components/tags/TagManager";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/authStore";

export default function ProjectSettingsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: project, isLoading, error } = useProject(id);
  const { user } = useAuthStore();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-[200px]" />
        <Skeleton className="h-[500px] w-full rounded-xl" />
      </div>
    );
  }

  if (error || !project) {
    return <div>Project not found</div>;
  }

  // Basic protection: only owner can see settings for now (implementation plan says checking edit_project permission is better, but this is a start)
  if (project.owner_id !== user?.id) {
    return <div className="p-8 text-center text-destructive">You do not have permission to view this page.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Project Settings: {project.name}</h1>
      </div>

      <div className="space-y-8">
        <section>
          {/* Groups and Permissions */}
          <GroupManager projectId={project.id.toString()} />
        </section>

        {/* Future sections: General Settings (Rename, Delete), Tag Manager */}
      </div>
    </div>
  );
}
