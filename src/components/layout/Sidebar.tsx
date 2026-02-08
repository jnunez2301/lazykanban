"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUIStore } from "@/store/uiStore";
import { useProjects } from "@/hooks/useProjects";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FolderKanban,
  Plus,
  LayoutDashboard,
  Settings,
  Users,
  ChevronRight
} from "lucide-react";
import { useState, useEffect } from "react";
import { CreateProjectDialog } from "@/components/projects/CreateProjectDialog";

export const Sidebar = () => {
  const pathname = usePathname() || "";
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const { data: projects } = useProjects();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Close sidebar on route change on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setSidebarOpen]);

  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [pathname, setSidebarOpen]);

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <aside
        className={cn(
          "fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] w-64 border-r bg-background transition-transform duration-300 ease-in-out md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <ScrollArea className="h-full py-4">
          <div className="px-4 space-y-4">
            <div className="space-y-1">
              <Button
                variant={pathname === "/dashboard" ? "secondary" : "ghost"}
                className="w-full justify-start"
                asChild
              >
                <Link href="/dashboard">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
              <Button
                variant={pathname === "/dashboard/groups" ? "secondary" : "ghost"}
                className="w-full justify-start"
                asChild
              >
                <Link href="/dashboard/groups">
                  <Users className="mr-2 h-4 w-4" />
                  My Groups
                </Link>
              </Button>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between px-2 py-2">
                <h4 className="text-sm font-semibold tracking-tight">Projects</h4>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setCreateDialogOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  <span className="sr-only">Create Project</span>
                </Button>
              </div>

              {projects?.length === 0 ? (
                <div className="text-sm text-muted-foreground px-2 py-2">
                  No projects yet
                </div>
              ) : (
                <div className="space-y-1">
                  {projects?.map((project) => (
                    <Button
                      key={project.id}
                      variant={pathname.includes(`/dashboard/projects/${project.id}`) ? "secondary" : "ghost"}
                      className="w-full justify-start font-normal"
                      asChild
                    >
                      <Link href={`/dashboard/projects/${project.id}`}>
                        <FolderKanban className="mr-2 h-4 w-4" />
                        <span className="truncate">{project.name}</span>
                        {pathname.includes(`/dashboard/projects/${project.id}`) && (
                          <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
                        )}
                      </Link>
                    </Button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <h4 className="text-sm font-semibold tracking-tight px-2 py-2">Settings</h4>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/dashboard/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Preferences
                </Link>
              </Button>
            </div>
          </div>
        </ScrollArea>
      </aside>

      <CreateProjectDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </>
  );
};
