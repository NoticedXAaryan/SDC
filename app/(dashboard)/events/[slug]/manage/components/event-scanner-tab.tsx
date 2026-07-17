"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { QrCode, ScanLine, Keyboard, WifiOff, CheckCircle2, XCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function EventScannerTab({ event }: { event: any }) {
  const [mode, setMode] = React.useState<"camera" | "hardware" | "manual">("camera")
  const [session, setSession] = React.useState<string>("all")
  
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="md:col-span-2 space-y-6">
        <Card className="overflow-hidden">
          <CardHeader className="bg-muted/30 border-b">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Scanner Interface</CardTitle>
                <CardDescription>Scan passes or look up attendees</CardDescription>
              </div>
              
              <div className="flex bg-muted p-1 rounded-lg">
                <Button 
                  variant={mode === "camera" ? "secondary" : "ghost"} 
                  size="sm" 
                  onClick={() => setMode("camera")}
                  className="px-3"
                >
                  <QrCode className="w-4 h-4 mr-2" /> Camera
                </Button>
                <Button 
                  variant={mode === "hardware" ? "secondary" : "ghost"} 
                  size="sm" 
                  onClick={() => setMode("hardware")}
                  className="px-3"
                >
                  <ScanLine className="w-4 h-4 mr-2" /> Hardware
                </Button>
                <Button 
                  variant={mode === "manual" ? "secondary" : "ghost"} 
                  size="sm" 
                  onClick={() => setMode("manual")}
                  className="px-3"
                >
                  <Keyboard className="w-4 h-4 mr-2" /> Manual
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {mode === "camera" && (
              <div className="aspect-video bg-black flex flex-col items-center justify-center relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-64 h-64 border-2 border-primary/50 rounded-lg relative">
                    <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-primary" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-primary" />
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-primary" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-primary" />
                  </div>
                </div>
                <p className="text-white/70 text-sm mt-72">Requesting camera access...</p>
                
                {/* Mock successful scan overlay for demonstration */}
                {/* 
                <div className="absolute inset-0 bg-green-500/20 backdrop-blur-sm flex flex-col items-center justify-center">
                  <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
                  <h3 className="text-2xl font-bold text-white">Valid Pass</h3>
                  <p className="text-white/80">Aaryan (Member)</p>
                </div>
                */}
              </div>
            )}
            
            {mode === "hardware" && (
              <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
                <ScanLine className="w-16 h-16 text-muted-foreground opacity-50" />
                <div>
                  <h3 className="font-medium text-lg">Ready to scan</h3>
                  <p className="text-sm text-muted-foreground">Click the input below and use your hardware scanner.</p>
                </div>
                <Input placeholder="Scan barcode here..." className="max-w-md text-center" autoFocus />
              </div>
            )}
            
            {mode === "manual" && (
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Pass Code or Email</label>
                  <div className="flex gap-2">
                    <Input placeholder="e.g. SDC-12345 or email@example.com" />
                    <Button>Lookup</Button>
                  </div>
                </div>
                
                <div className="border rounded-lg p-6 flex flex-col items-center justify-center text-center text-muted-foreground">
                  <Keyboard className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">Enter a code or email to find a registration.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Scanner Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Check-in Context</label>
              <Select value={session} onValueChange={setSession}>
                <SelectTrigger>
                  <SelectValue placeholder="Select session" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Entire Event (General Admission)</SelectItem>
                  <SelectItem value="session-1">Opening Keynote</SelectItem>
                  <SelectItem value="session-2">Workshop A</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="pt-4 border-t flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Offline Sync</span>
              <div className="flex items-center gap-2">
                <WifiOff className="w-4 h-4 text-amber-500" />
                <span className="font-medium">2 pending</span>
                <Button variant="outline" size="sm" className="ml-2 h-7 text-xs">Sync</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Scans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Aaryan</p>
                    <p className="text-xs text-muted-foreground">General Admission • 10:42 AM</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-xs h-7">Undo</Button>
              </div>
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="text-sm font-medium">Unknown Code</p>
                    <p className="text-xs text-muted-foreground">SDC-99999 • 10:40 AM</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Jane Smith</p>
                    <p className="text-xs text-muted-foreground">General Admission • 10:35 AM</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-xs h-7">Undo</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
