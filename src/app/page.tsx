import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckSquare, Users, Tag, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              LazyKanban
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground">
              Project management made simple
            </p>
          </div>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Organize your projects, manage teams, and track tasks with our mobile-first TODO app.
            Perfect for developers and teams who want powerful features without the complexity.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg">
              <Link href="/auth/register">Get Started</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg">
              <Link href="/auth/login">Sign In</Link>
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16 text-left">
            <div className="p-6 rounded-lg border bg-card">
              <CheckSquare className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Task Management</h3>
              <p className="text-muted-foreground">
                Create, assign, and track tasks with custom tags and priorities.
              </p>
            </div>

            <div className="p-6 rounded-lg border bg-card">
              <Users className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Team Collaboration</h3>
              <p className="text-muted-foreground">
                Organize teams with groups and granular permission controls.
              </p>
            </div>

            <div className="p-6 rounded-lg border bg-card">
              <Tag className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Custom Workflows</h3>
              <p className="text-muted-foreground">
                Create custom tags to match your workflow. Default tags included.
              </p>
            </div>

            <div className="p-6 rounded-lg border bg-card">
              <Zap className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Dual UI Modes</h3>
              <p className="text-muted-foreground">
                Switch between dev mode (full features) and simplified user mode.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 px-4">
        <div className="max-w-4xl mx-auto text-center text-sm text-muted-foreground">
          <p>&copy; 2026 LazyKanban. Built with Next.js and Shadcn/ui.</p>
        </div>
      </footer>
    </div>
  );
}
