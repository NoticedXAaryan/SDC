"use client";

import { useState, useEffect } from "react";
import { useSession, authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AtSign, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const { data: session, isPending } = useSession();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [username, setUsername] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [usernameError, setUsernameError] = useState("");
  const [usernameSuccess, setUsernameSuccess] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (session?.user && (session.user as any).username) {
      setUsername((session.user as any).username);
    }
  }, [session]);

  // Debounce username check
  useEffect(() => {
    if (!username || username === (session?.user as any)?.username || username.length < 3) {
      setIsAvailable(null);
      setUsernameError("");
      return;
    }
    
    const checkUsername = async () => {
      setIsChecking(true);
      setUsernameError("");
      try {
        const res = await fetch(`/api/username/check?u=${encodeURIComponent(username)}`);
        const data = await res.json();
        
        if (data.available) {
          setIsAvailable(true);
        } else {
          setIsAvailable(false);
          if (data.message) setUsernameError(data.message);
        }
      } catch (err) {
        setUsernameError("Failed to check username");
      } finally {
        setIsChecking(false);
      }
    };
    
    const timeout = setTimeout(checkUsername, 500);
    return () => clearTimeout(timeout);
  }, [username, session]);

  const handleUpdateUsername = async () => {
    if (!username || !isAvailable) return;
    
    setIsUpdating(true);
    setUsernameError("");
    setUsernameSuccess("");
    try {
      const res = await fetch("/api/users/me/username", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username })
      });
      const data = await res.json();
      if (data.success) {
        setUsernameSuccess(`Handle successfully updated to @${data.username}!`);
      } else {
        setUsernameError(data.error || "Failed to update handle");
      }
    } catch (err) {
      setUsernameError("An error occurred");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isPending) {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  const user = session.user;
  const initials = user.name?.substring(0, 2).toUpperCase() || "US";
  const currentUsername = (user as any).username;

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

      <Card>
        <CardHeader>
          <CardTitle>Username Handle</CardTitle>
          <CardDescription>Your unique @handle used for mentions and public profile. You can change this once every 30 days, maximum 3 times.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 max-w-md">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <AtSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="username"
                className="pl-9"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              />
            </div>
            
            <div className="h-5">
              {isChecking && <p className="text-sm text-muted-foreground flex items-center"><Loader2 className="h-3 w-3 mr-2 animate-spin" /> Checking availability...</p>}
              {!isChecking && isAvailable === true && username !== currentUsername && (
                <p className="text-sm text-green-600 flex items-center"><CheckCircle2 className="h-3 w-3 mr-1" /> Available!</p>
              )}
              {!isChecking && usernameError && <p className="text-sm text-red-500">{usernameError}</p>}
              {!isChecking && usernameSuccess && <p className="text-sm text-green-600">{usernameSuccess}</p>}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleUpdateUsername} 
            disabled={!isAvailable || isUpdating || isChecking || username === currentUsername}
          >
            {isUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Update Handle
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
