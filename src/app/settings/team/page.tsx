"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Users } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function TeamSettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/settings">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Members</h1>
          <p className="text-muted-foreground">Manage your team and groups.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="text-center pb-2">
          <div className="mx-auto bg-primary/10 p-3 rounded-full mb-4 w-fit">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>Project-Based Team Management</CardTitle>
          <CardDescription>
            Team members are managed at the project level through groups.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center pb-8">
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            To view and manage team members, navigate to a specific project and access the <strong>Groups</strong> section. Each project has its own groups with customizable permissions and roles.
          </p>
          <Button className="mt-6" asChild>
            <Link href="/dashboard">Go to Projects</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
