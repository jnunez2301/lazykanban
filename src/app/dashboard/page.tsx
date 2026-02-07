"use client";

import { useUIStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";
import { ProjectList } from "@/components/projects/ProjectList";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FolderKanban, CheckSquare, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useProjects } from "@/hooks/useProjects";

export default function DashboardPage() {
  const { currentMode } = useUIStore();
  const { user } = useAuthStore();
  const { data: projects } = useProjects();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>

      {currentMode === "dev" ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                <FolderKanban className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{projects?.length || 0}</div>
              </CardContent>
            </Card>
            {/* Add more stats cards later */}
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-4">Your Projects</h2>
            <ProjectList />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Welcome back, {user?.name}</CardTitle>
              <CardDescription>
                You are in Regular User mode. This view is optimized for focusing on your assigned tasks.
              </CardDescription>
            </CardHeader>
          </Card>

          <div>
            <h2 className="text-xl font-semibold mb-4">Your Assigned Tasks</h2>
            <div className="flex flex-col items-center justify-center p-8 border rounded-lg border-dashed text-muted-foreground bg-muted/20">
              <CheckSquare className="h-10 w-10 mb-2 opacity-50" />
              <p>Select a project to view your tasks or wait for assignment.</p>
              {projects?.length && projects.length > 0 && (
                <Button variant="outline" className="mt-4" asChild>
                  <Link href={`/projects/${projects[0].id}`}>
                    Go to {projects[0].name} <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
