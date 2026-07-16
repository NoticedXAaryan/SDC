"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, UserCircle, Rocket, AtSign, Loader2 } from "lucide-react";

export default function SetupWizardPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [isReserving, setIsReserving] = useState(false);
  const [step, setStep] = useState(1);

  // Debounce username check
  useEffect(() => {
    if (username.length < 3) {
      setIsAvailable(null);
      setError("");
      setSuggestions([]);
      return;
    }
    
    const checkUsername = async () => {
      setIsChecking(true);
      setError("");
      try {
        const res = await fetch(`/api/username/check?u=${encodeURIComponent(username)}`);
        const data = await res.json();
        
        if (data.available) {
          setIsAvailable(true);
          setSuggestions([]);
        } else {
          setIsAvailable(false);
          if (data.message) setError(data.message);
          if (data.suggestions) setSuggestions(data.suggestions);
        }
      } catch (err) {
        setError("Failed to check username");
      } finally {
        setIsChecking(false);
      }
    };
    
    const timeout = setTimeout(checkUsername, 500);
    return () => clearTimeout(timeout);
  }, [username]);

  const handleReserve = async () => {
    if (!username || !isAvailable) return;
    
    setIsReserving(true);
    try {
      const res = await fetch("/api/username/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Handle @${data.username} claimed!`);
        setStep(2);
      } else {
        toast.error(data.error || "Failed to claim handle");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setIsReserving(false);
    }
  };

  const handleSkip = () => {
    // Generate a random one and proceed
    const randomUsername = `user_${Math.floor(Math.random() * 100000)}`;
    fetch("/api/username/reserve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: randomUsername })
    }).then(() => {
      setStep(2);
    }).catch(() => {
      setStep(2);
    });
  };

  const handleFinish = async () => {
    toast.success("Profile setup complete! Welcome to SDC.");
    router.push("/dashboard");
  };

  if (step === 1) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-muted/20">
        <Card className="w-full max-w-xl">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-4">
              <AtSign className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Choose your handle</CardTitle>
            <CardDescription>
              This is how you'll be known in the OS. Lowercase alphanumeric and underscores only.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <AtSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  placeholder="aaryan_19"
                  className="pl-9"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                />
              </div>
              
              {isChecking && <p className="text-sm text-muted-foreground flex items-center"><Loader2 className="h-3 w-3 mr-2 animate-spin" /> Checking...</p>}
              
              {!isChecking && isAvailable === true && (
                <p className="text-sm text-green-600 flex items-center"><CheckCircle2 className="h-3 w-3 mr-1" /> Available!</p>
              )}
              
              {!isChecking && error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
              
              {!isChecking && isAvailable === false && suggestions.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground mb-1">Suggestions:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map(s => (
                      <Button key={s} variant="outline" size="sm" onClick={() => setUsername(s)}>
                        {s}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="ghost" onClick={handleSkip} disabled={isReserving}>Skip for now</Button>
            <Button onClick={handleReserve} disabled={!isAvailable || isReserving || isChecking}>
              {isReserving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Claim Handle
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-muted/20">
      <Card className="w-full max-w-xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-4">
            <Rocket className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Welcome to SDC!</CardTitle>
          <CardDescription>
            You have successfully joined the club. Let's finish setting up your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-lg border bg-card">
              <CheckCircle2 className="h-6 w-6 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Application Approved</h4>
                <p className="text-sm text-muted-foreground">Your onboarding profile has been synced.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-lg border bg-card">
              <UserCircle className="h-6 w-6 text-blue-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Verify Profile Data</h4>
                <p className="text-sm text-muted-foreground">Check your profile settings later to make sure your GitHub and LinkedIn links are correct.</p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleFinish} className="w-full" size="lg">
            Go to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
