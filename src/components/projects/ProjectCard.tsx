"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Project, useProjects } from "@/hooks/useProjects";
import { useAuthStore } from "@/store/authStore";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight, CalendarDays, Pin, PinOff, Trash2, User } from "lucide-react";
import Link from "next/link";

interface ProjectCardProps {
  project: Project;
}

export const ProjectCard = ({ project }: ProjectCardProps) => {
  const { deleteProject, updateProject, isDeleting, isUpdating } = useProjects();
  const { user } = useAuthStore();
  const isOwner = user?.id === project.owner_id;

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent navigation
    try {
      await deleteProject(project.id);
    } catch (error) {
      console.error("Failed to delete project:", error);
    }
  };

  const handleTogglePin = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent navigation
    try {
      await updateProject({ id: project.id, data: { isPinned: !project.is_pinned } });
    } catch (error) {
      console.error("Failed to toggle pin:", error);
    }
  };

  return (
    <Card className="h-full hover:shadow-md transition-shadow group flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="line-clamp-1 group-hover:text-primary transition-colors flex items-center gap-2">
            {project.name}
          </CardTitle>
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              onClick={handleTogglePin}
              disabled={isUpdating}
              title={project.is_pinned ? "Unpin project" : "Pin project"}
            >
              {project.is_pinned ? <Pin className="h-4 w-4 text-primary" /> : <PinOff className="h-4 w-4 " />}
            </Button>
            {isOwner && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the project
                      "{project.name}" and all associated data including tasks and groups.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      {isDeleting ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
        <CardDescription className="line-clamp-2 min-h-[2.5rem]">
          {project.description || "No description available"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <User className="h-4 w-4" />
            <span>{project.owner_name || "Unknown"}</span>
          </div>
          <div className="flex items-center gap-1">
            <CalendarDays className="h-4 w-4" />
            <span>{formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Link href={`/dashboard/projects/${project.id}`}>
          <Button variant="secondary" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            View Project <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};
