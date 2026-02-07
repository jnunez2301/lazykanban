"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Construction } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function TeamSettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Members</h1>
          <p className="text-muted-foreground">Manage your team and organization.</p>
        </div>
      </div>

      <Card className="border-dashed">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto bg-muted/50 p-3 rounded-full mb-4 w-fit">
            <Construction className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            Global team management features are currently under development.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center pb-8">
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Please use the <strong>Project Settings</strong> &gt; <strong>Groups</strong> to manage members within specific projects for now.
          </p>
          <Button className="mt-6" asChild>
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
