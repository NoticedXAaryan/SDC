"use client";

import { useState, useEffect } from "react";
import { useSession, authClient } from "@/lib/auth-client";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Avatar } from "@astryxdesign/core/Avatar";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { HStack } from "@astryxdesign/core/HStack";
import { Loader2, AtSign, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/astryx/page-header";

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
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
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
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader title="Settings" description="Manage your account preferences." />

      <Card padding={6}>
        <VStack gap={6}>
          <VStack gap={1}>
            <Text weight="bold" className="text-xl">Profile Details</Text>
            <Text type="supporting" className="text-sm">Manage your account settings and profile picture.</Text>
          </VStack>
          
          <HStack gap={6} align="center">
            <Avatar size="lg" src={user.image || undefined} name={user.name || initials} />

            <VStack gap={2}>
              <Text weight="medium" className="text-lg">Profile Picture</Text>
              <Text type="supporting" className="text-sm">
                Upload a new profile picture. Recommended size is 256x256px. Max 5MB.
              </Text>
              
              <div className="mt-2">
                <label className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
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
              
              {error && <Text className="text-sm text-red-500 font-medium">{error}</Text>}
              {success && <Text className="text-sm text-green-500 font-medium">{success}</Text>}
            </VStack>
          </HStack>

          <div className="space-y-4 pt-6 border-t border-border">
            <div className="grid gap-2">
              <Text type="supporting" className="font-medium text-sm">Name</Text>
              <Text weight="medium">{user.name}</Text>
            </div>
            <div className="grid gap-2">
              <Text type="supporting" className="font-medium text-sm">Email</Text>
              <Text weight="medium">{user.email}</Text>
            </div>
            <div className="grid gap-2">
              <Text type="supporting" className="font-medium text-sm">Role</Text>
              <Text weight="medium" className="capitalize">{user.role?.replace("_", " ")}</Text>
            </div>
          </div>
        </VStack>
      </Card>

      <Card padding={6}>
        <VStack gap={6}>
          <VStack gap={1}>
            <Text weight="bold" className="text-xl">Username Handle</Text>
            <Text type="supporting" className="text-sm">Your unique @handle used for mentions and public profile. You can change this once every 30 days, maximum 3 times.</Text>
          </VStack>
          
          <div className="space-y-2 max-w-md">
            <div className="relative">
              <AtSign className="absolute left-3 top-[38px] h-4 w-4 text-muted-foreground z-10" />
              <TextInput
                htmlName="username"
                label="Username"
                className="pl-9"
                value={username}
                onChange={(val) => setUsername(val.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              />
            </div>
            
            <div className="h-5">
              {isChecking && <Text type="supporting" className="text-sm flex items-center"><Loader2 className="h-3 w-3 mr-2 animate-spin" /> Checking availability...</Text>}
              {!isChecking && isAvailable === true && username !== currentUsername && (
                <Text className="text-sm text-green-600 flex items-center"><CheckCircle2 className="h-3 w-3 mr-1" /> Available!</Text>
              )}
              {!isChecking && usernameError && <Text className="text-sm text-red-500">{usernameError}</Text>}
              {!isChecking && usernameSuccess && <Text className="text-sm text-green-600">{usernameSuccess}</Text>}
            </div>
          </div>
          
          <div className="pt-2">
            <Button 
              label="Update Handle"
              onClick={handleUpdateUsername} 
              isDisabled={!isAvailable || isUpdating || isChecking || username === currentUsername}
              icon={isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
            />
          </div>
        </VStack>
      </Card>
      
      <ActiveSessionsCard />
    </div>
  );
}

function ActiveSessionsCard() {
  const [activeSessions, setActiveSessions] = useState<any[] | null>(null);
  const [isPending, setIsPending] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);

  useEffect(() => {
    authClient.listSessions().then(({ data }) => {
      setActiveSessions(data || []);
      setIsPending(false);
    }).catch(() => setIsPending(false));
  }, []);

  const handleRevoke = async (token: string) => {
    setRevoking(token);
    try {
      await authClient.revokeSession({ token });
      window.location.reload();
    } catch (err) {
      console.error(err);
    } finally {
      setRevoking(null);
    }
  };

  const handleRevokeAllOther = async () => {
    setRevokingAll(true);
    try {
      await authClient.revokeOtherSessions();
      window.location.reload();
    } catch (err) {
      console.error(err);
    } finally {
      setRevokingAll(false);
    }
  };

  return (
    <Card padding={6}>
      <VStack gap={6}>
        <HStack justify="between" align="start">
          <VStack gap={1}>
            <Text weight="bold" className="text-xl">Active Sessions</Text>
            <Text type="supporting" className="text-sm">Manage your active devices and sessions.</Text>
          </VStack>
          <Button 
            variant="ghost" 
            label="Logout other devices"
            onClick={handleRevokeAllOther}
            isDisabled={revokingAll || !activeSessions || activeSessions.length <= 1}
            icon={revokingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
          />
        </HStack>
        
        <div className="space-y-4">
          {isPending ? (
            <div className="flex items-center text-muted-foreground"><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading sessions...</div>
          ) : (
            <div className="space-y-4">
              {activeSessions?.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/10">
                  <div>
                    <Text weight="medium">{s.userAgent || "Unknown Device"}</Text>
                    <Text type="supporting" className="text-sm">IP: {s.ipAddress || "Unknown"}</Text>
                    <Text type="supporting" className="text-xs mt-1">Started: {new Date(s.createdAt).toLocaleString()}</Text>
                  </div>
                  <Button 
                    variant="ghost" 
                    className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                    isDisabled={revoking === s.token} 
                    onClick={() => handleRevoke(s.token)}
                    label={revoking === s.token ? "Revoking..." : "Revoke"}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </VStack>
    </Card>
  );
}
