"use client";

import { useUIStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";
import { ProjectList } from "@/components/projects/ProjectList";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FolderKanban, CheckSquare, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useProjects } from "@/hooks/useProjects";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function DashboardPage() {
  const { currentMode } = useUIStore();
  const { user } = useAuthStore();
  const { data: projects } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>

      {currentMode === "advanced" ? (
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
                You are in Normal mode. This view is optimized for focusing on your assigned tasks.
              </CardDescription>
            </CardHeader>
          </Card>

          <div>
            <h2 className="text-xl font-semibold mb-4">Your Projects</h2>
            {projects && projects.length > 0 ? (
              <div className="space-y-4">
                <Select value={selectedProjectId || ""} onValueChange={setSelectedProjectId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a project to view tasks" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedProjectId && (
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/dashboard/projects/${selectedProjectId}`}>
                      View Project Tasks <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 border rounded-lg border-dashed text-muted-foreground bg-muted/20">
                <CheckSquare className="h-10 w-10 mb-2 opacity-50" />
                <p>No projects available.</p>
                <p className="text-sm mt-2">Create a project to get started.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
