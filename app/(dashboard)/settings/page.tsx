"use client";

import { useState } from "react";
import { useSession, authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function SettingsPage() {
  const { data: session, isPending } = useSession();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (isPending) {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  const user = session.user;
  const initials = user.name?.substring(0, 2).toUpperCase() || "US";

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("File must be less than 5MB");
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await res.json();
      
      // Update the user profile with Better Auth client
      await authClient.updateUser({
        image: data.url
      });

      setSuccess("Profile picture updated successfully! It may take a moment to reflect everywhere.");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
          <CardDescription>Manage your account settings and profile picture.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div className="flex flex-col md:flex-row items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user.image || ""} alt={user.name || "User"} />
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>

            <div className="space-y-2">
              <h3 className="font-medium text-lg">Profile Picture</h3>
              <p className="text-sm text-muted-foreground">
                Upload a new profile picture. Recommended size is 256x256px. Max 5MB.
              </p>
              
              <div className="flex items-center gap-4 mt-2">
                <label className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                  {uploading ? "Uploading..." : "Upload new picture"}
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/png, image/jpeg, image/webp" 
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                </label>
              </div>
              
              {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
              {success && <p className="text-sm text-green-500 font-medium">{success}</p>}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="grid gap-2">
              <div className="font-medium text-sm text-muted-foreground">Name</div>
              <div className="font-medium">{user.name}</div>
            </div>
            <div className="grid gap-2">
              <div className="font-medium text-sm text-muted-foreground">Email</div>
              <div className="font-medium">{user.email}</div>
            </div>
            <div className="grid gap-2">
              <div className="font-medium text-sm text-muted-foreground">Role</div>
              <div className="font-medium capitalize">{user.role?.replace("_", " ")}</div>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
