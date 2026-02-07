"use client";

import { useUIStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const { currentMode, setMode } = useUIStore();
  const { user } = useAuthStore();

  const userInitials = user?.name
    ? user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
    : "U";

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your personal information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src="" alt={user?.name} />
              <AvatarFallback className="text-lg">{userInitials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-lg">{user?.name}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Customize your workspace experience.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>UI Mode</Label>
            <RadioGroup
              defaultValue={currentMode}
              onValueChange={(value) => setMode(value as "dev" | "regular")}
              className="flex flex-col space-y-1"
            >
              <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50">
                <RadioGroupItem value="regular" id="regular" />
                <Label htmlFor="regular" className="flex-1 cursor-pointer">
                  <span className="font-medium block">Regular Mode</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    Simplified interface focused on your assigned tasks.
                  </span>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50">
                <RadioGroupItem value="dev" id="dev" />
                <Label htmlFor="dev" className="flex-1 cursor-pointer">
                  <span className="font-medium block">Dev Mode</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    Full-featured interface for project management and detailed task tracking.
                  </span>
                </Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
