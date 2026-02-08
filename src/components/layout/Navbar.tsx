"use client";

import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";
import { CheckSquare, LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export const Navbar = () => {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { currentMode, setMode, toggleSidebar, sidebarOpen } = useUIStore();

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  const userInitials = user?.name
    ? user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
    : "U";

  return (
    <nav className="border-b bg-background h-16 flex items-center px-4 sticky top-0 z-50">
      <div className="flex items-center gap-4 flex-1">
        {user && currentMode === "advanced" && (
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="md:hidden">
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        )}

        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl text-primary">
          <CheckSquare className="h-6 w-6" />
          <span className="hidden sm:inline">LazyKanban</span>
        </Link>

        {user && (
          <div className="hidden md:flex items-center gap-2 ml-4 bg-secondary/50 p-1 rounded-lg">
            <Button
              variant={currentMode === "normal" ? "default" : "ghost"}
              size="sm"
              onClick={() => setMode("normal")}
              className="text-xs"
            >
              Normal
            </Button>
            <Button
              variant={currentMode === "advanced" ? "default" : "ghost"}
              size="sm"
              onClick={() => setMode("advanced")}
              className="text-xs"
            >
              Advanced
            </Button>
          </div>
        )}
      </div>

      {user ? (
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar ? `/avatars/${user.avatar}` : ""} alt={user.name} />
                  <AvatarFallback>{userInitials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/auth/login">Login</Link>
          </Button>
          <Button asChild>
            <Link href="/auth/register">Sign Up</Link>
          </Button>
        </div>
      )}
    </nav>
  );
};
