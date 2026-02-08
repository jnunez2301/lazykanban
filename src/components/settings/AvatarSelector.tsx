"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { Check } from "lucide-react";

const AVATARS = [
  "avatar-1.png",
  "avatar-2.png",
  "avatar-3.png",
  "avatar-4.png",
  "avatar-5.png",
];

export function AvatarSelector() {
  const { user, token, updateUser } = useAuthStore();
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || "avatar-1.png");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/user/avatar", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ avatar: selectedAvatar }),
      });

      if (!response.ok) {
        throw new Error("Failed to update avatar");
      }

      // Update user in store
      updateUser({ avatar: selectedAvatar });

      toast.success("Avatar updated successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update avatar");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose Avatar</CardTitle>
        <CardDescription>
          Select a robot avatar for your profile
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-5 gap-4">
          {AVATARS.map((avatar) => (
            <button
              key={avatar}
              onClick={() => setSelectedAvatar(avatar)}
              className="relative group"
            >
              <Avatar className="h-16 w-16 cursor-pointer transition-transform group-hover:scale-110">
                <AvatarImage src={`/avatars/${avatar}`} alt={avatar} />
                <AvatarFallback>R</AvatarFallback>
              </Avatar>
              {selectedAvatar === avatar && (
                <div className="absolute inset-0 flex items-center justify-center bg-primary/20 rounded-full">
                  <Check className="h-8 w-8 text-primary" />
                </div>
              )}
            </button>
          ))}
        </div>
        <Button onClick={handleSave} disabled={isLoading || selectedAvatar === user?.avatar}>
          {isLoading ? "Saving..." : "Save Avatar"}
        </Button>
      </CardContent>
    </Card>
  );
}
