"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Loader2, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function FacultyDashboardPage() {
  const [isFrozen, setIsFrozen] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/faculty/settings");
        if (res.ok) {
          const data = await res.json();
          setIsFrozen(data.isFrozen);
        }
      } catch (err) {
        console.error("Failed to fetch settings", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleToggleFreeze = async () => {
    if (!confirm(isFrozen ? "Are you sure you want to unfreeze club operations?" : "Are you sure you want to FREEZE all club operations? Members will be unable to make changes.")) {
      return;
    }
    setToggling(true);
    try {
      const res = await fetch("/api/faculty/freeze", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFrozen: !isFrozen })
      });
      if (!res.ok) throw new Error("Failed to toggle freeze");
      const data = await res.json();
      setIsFrozen(data.isFrozen);
      toast({
        title: "Success",
        description: `Club operations are now ${data.isFrozen ? "FROZEN" : "UNFROZEN"}.`
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "An error occurred while toggling freeze state.",
        variant: "destructive"
      });
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Faculty Dashboard</h1>
        <p className="text-muted-foreground">Manage high-level club operations and overrides.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className={isFrozen ? "border-red-500 bg-red-500/5" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-500" />
              Emergency Freeze
            </CardTitle>
            <CardDescription>
              Halt all state-mutating operations across the club. Leads will not be able to create events, approve expenses, or accept applications.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Checking state...
              </div>
            ) : isFrozen ? (
              <div className="flex items-center gap-2 text-sm text-red-500 font-medium">
                <AlertCircle className="h-4 w-4" /> Club operations are currently FROZEN
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-green-500 font-medium">
                <CheckCircle2 className="h-4 w-4" /> Club operations are normal
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              variant={isFrozen ? "default" : "destructive"} 
              onClick={handleToggleFreeze}
              disabled={loading || toggling}
              className="w-full"
            >
              {toggling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isFrozen ? "Unfreeze Operations" : "Freeze Operations"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
