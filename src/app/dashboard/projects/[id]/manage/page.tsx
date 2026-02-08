"use client";
import { GroupManager } from "@/components/groups/GroupManager";
import { useParams, useRouter } from "next/navigation";
import { useProjectPermissions } from "@/hooks/useProjectPermissions";
import { useEffect } from "react";
import { FileWarning } from "lucide-react";

const ManagePage = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: permissions, isLoading } = useProjectPermissions(id);

  useEffect(() => {
    if (!isLoading && permissions && !permissions.canEditProject) {
      // router.push(`/dashboard/projects/${id}`); // Redirect or show error
    }
  }, [isLoading, permissions, id, router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!permissions?.canEditProject) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4">
        <FileWarning className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Access Denied</h2>
        <p className="text-muted-foreground">You do not have permission to manage this project.</p>
      </div>
    );
  }

  return (
    <>
      <GroupManager projectId={id} />
    </>
  );
};

export default ManagePage;