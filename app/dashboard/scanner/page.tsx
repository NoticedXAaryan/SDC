"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Html5QrcodeScanner, Html5Qrcode } from "html5-qrcode";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function QRScannerPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [loadingEvents, setLoadingEvents] = useState(true);
  
  // Scanner state
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState<{ passCode: string; status: 'success' | 'error' | 'duplicate', message: string } | null>(null);
  
  // Walk-in state
  const [walkInName, setWalkInName] = useState("");
  const [walkInEmail, setWalkInEmail] = useState("");
  const [submittingWalkIn, setSubmittingWalkIn] = useState(false);
  
  const { toast } = useToast();
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    // Fetch upcoming events to choose which one to scan for
    const fetchEvents = async () => {
      try {
        const res = await fetch("/api/events?limit=50&status=published");
        if (res.ok) {
          const data = await res.json();
          setEvents(data.events || data); // handle both paginated and flat responses
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingEvents(false);
      }
    };
    fetchEvents();
  }, []);

  const handleScanSuccess = async (decodedText: string) => {
    if (!selectedEventId) return;
    
    // Simple debounce: don't double scan the same code immediately if it was just successfully scanned
    if (lastResult?.passCode === decodedText && (Date.now() - (window as any).lastScanTime < 3000)) {
      return;
    }
    (window as any).lastScanTime = Date.now();

    try {
      const res = await fetch(`/api/events/${selectedEventId}/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passCode: decodedText })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setLastResult({ 
          passCode: decodedText, 
          status: data.alreadyCheckedIn ? 'duplicate' : 'success',
          message: data.message
        });
        toast({
          title: data.alreadyCheckedIn ? "Already Checked In" : "Success",
          description: data.alreadyCheckedIn ? "This pass has already been used." : "Check-in confirmed.",
          variant: data.alreadyCheckedIn ? "default" : "default"
        });
        
        // Play beep sound
        const audio = new Audio('/beep.mp3');
        audio.play().catch(() => {});
      } else {
        setLastResult({ passCode: decodedText, status: 'error', message: data.error });
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleScanner = () => {
    if (scanning) {
      scannerRef.current?.stop().catch(console.error);
      setScanning(false);
    } else {
      if (!selectedEventId) {
        toast({ title: "Select an event", description: "You must select an event first.", variant: "destructive" });
        return;
      }
      setScanning(true);
      const html5QrCode = new Html5Qrcode("reader");
      scannerRef.current = html5QrCode;
      
      html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => handleScanSuccess(decodedText),
        (errorMessage) => { /* ignore normal errors */ }
      ).catch((err) => {
        console.error(err);
        setScanning(false);
        toast({ title: "Camera Error", description: "Could not start camera.", variant: "destructive" });
      });
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const handleWalkInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) {
      toast({ title: "Select an event", description: "You must select an event first.", variant: "destructive" });
      return;
    }
    setSubmittingWalkIn(true);
    try {
      const res = await fetch(`/api/events/${selectedEventId}/walk-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: walkInName, email: walkInEmail })
      });
      const data = await res.json();
      
      if (res.ok) {
        toast({ title: "Walk-in Registered", description: "User has been checked in." });
        setWalkInName("");
        setWalkInEmail("");
      } else {
        toast({ title: "Error", description: data.error || "Failed to register walk-in.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Network error occurred.", variant: "destructive" });
    } finally {
      setSubmittingWalkIn(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">QR Scanner</h1>
        <p className="text-muted-foreground">Scan attendee passes for check-in.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Event</CardTitle>
          <CardDescription>Choose the active event you are scanning for.</CardDescription>
        </CardHeader>
        <CardContent>
          <Select 
            value={selectedEventId} 
            onValueChange={(val) => setSelectedEventId(val as string)} 
            disabled={scanning || loadingEvents}
          >
            <SelectTrigger>
              <SelectValue placeholder={loadingEvents ? "Loading..." : "Select Event..."} />
            </SelectTrigger>
            <SelectContent>
              {events.map((e: any) => (
                <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Tabs defaultValue="scan">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="scan">QR Scanner</TabsTrigger>
          <TabsTrigger value="walkin">Walk-in Register</TabsTrigger>
        </TabsList>

        <TabsContent value="scan">
          <Card>
            <CardHeader>
              <CardTitle>Scanner</CardTitle>
              <CardDescription>Point your camera at the attendee's QR code.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div id="reader" className="w-full overflow-hidden rounded-md bg-muted/50 aspect-square flex items-center justify-center">
                {!scanning && <span className="text-muted-foreground">Camera off</span>}
              </div>
              
              <Button onClick={toggleScanner} variant={scanning ? "destructive" : "default"} className="w-full">
                {scanning ? "Stop Scanner" : "Start Scanner"}
              </Button>

              {lastResult && (
                <div className={`p-4 rounded-md mt-4 text-center ${lastResult.status === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : lastResult.status === 'duplicate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                  <div className="font-bold">{lastResult.status === 'success' ? '✅ Check-in Success' : lastResult.status === 'duplicate' ? '⚠️ Already Checked In' : '❌ Scan Error'}</div>
                  <div className="text-sm mt-1">{lastResult.message}</div>
                  <div className="text-xs mt-2 opacity-70 font-mono">{lastResult.passCode}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="walkin">
          <Card>
            <CardHeader>
              <CardTitle>Walk-in Registration</CardTitle>
              <CardDescription>Register someone who didn't pre-register online.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleWalkInSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    placeholder="John Doe" 
                    value={walkInName}
                    onChange={(e) => setWalkInName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="john@example.com" 
                    value={walkInEmail}
                    onChange={(e) => setWalkInEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={submittingWalkIn}>
                  {submittingWalkIn ? "Registering..." : "Register & Check-in"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
