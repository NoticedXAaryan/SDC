"use client"

import * as React from "react"
import { Card, Button, Heading, Text, HStack, VStack } from "@astryxdesign/core"
import { QrCode, ScanLine, Keyboard, WifiOff, CheckCircle2, XCircle } from "lucide-react"
import { TextInput, Selector } from "@astryxdesign/core"

export function EventScannerTab({ event }: { event: any }) {
  const [mode, setMode] = React.useState<"camera" | "hardware" | "manual">("camera")
  const [session, setSession] = React.useState<string>("all")
  const [hardwareInput, setHardwareInput] = React.useState("")
  const [manualInput, setManualInput] = React.useState("")
  
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="md:col-span-2 space-y-6">
        <Card padding={0} className="overflow-hidden">
          <div className="bg-muted/30 border-b p-6">
            <HStack align="center" justify="between" className="flex-col md:flex-row gap-4">
              <VStack gap={1}>
                <Heading level={3} className="text-lg">Scanner Interface</Heading>
                <Text type="supporting">Scan passes or look up attendees</Text>
              </VStack>
              
              <HStack align="center" className="bg-muted p-1 rounded-lg">
                <Button 
                  variant={mode === "camera" ? "secondary" : "ghost"} 
                  size="sm" 
                  onClick={() => setMode("camera")}
                  label="Camera"
                  icon={<QrCode className="w-4 h-4" />}
                />
                <Button 
                  variant={mode === "hardware" ? "secondary" : "ghost"} 
                  size="sm" 
                  onClick={() => setMode("hardware")}
                  label="Hardware"
                  icon={<ScanLine className="w-4 h-4" />}
                />
                <Button 
                  variant={mode === "manual" ? "secondary" : "ghost"} 
                  size="sm" 
                  onClick={() => setMode("manual")}
                  label="Manual"
                  icon={<Keyboard className="w-4 h-4" />}
                />
              </HStack>
            </HStack>
          </div>
          <div>
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
              </div>
            )}
            
            {mode === "hardware" && (
              <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
                <ScanLine className="w-16 h-16 text-muted-foreground opacity-50" />
                <div>
                  <h3 className="font-medium text-lg">Ready to scan</h3>
                  <p className="text-sm text-muted-foreground">Click the input below and use your hardware scanner.</p>
                </div>
                <TextInput label="Scanner Input" htmlName="scanner-input" placeholder="Scan QR code here..." className="max-w-md text-center" hasAutoFocus value={hardwareInput} onChange={setHardwareInput} />
              </div>
            )}
            
            {mode === "manual" && (
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <TextInput label="Pass Code or Email" htmlName="lookup" placeholder="e.g. SDC-12345 or email@example.com" value={manualInput} onChange={setManualInput} />
                    <Button label="Lookup" />
                  </div>
                </div>
                
                <div className="border rounded-lg p-6 flex flex-col items-center justify-center text-center text-muted-foreground">
                  <Keyboard className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">Enter a code or email to find a registration.</p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
      
      <div className="space-y-6">
        <Card padding={6}>
          <VStack gap={4}>
            <Heading level={3} className="text-lg">Scanner Options</Heading>
            <div className="space-y-2">
              <Selector 
                label="Check-in Context"
                value={session} 
                onChange={(val) => setSession(val || "all")}
                options={[
                  { value: "all", label: "Entire Event (General Admission)" },
                  { value: "session-1", label: "Opening Keynote" },
                  { value: "session-2", label: "Workshop A" },
                ]}
              />
            </div>
            
            <HStack justify="between" align="center" className="pt-4 border-t text-sm">
              <span className="text-muted-foreground">Offline Sync</span>
              <HStack align="center" gap={2}>
                <WifiOff className="w-4 h-4 text-amber-500" />
                <span className="font-medium">2 pending</span>
                <Button variant="ghost" size="sm" className="ml-2 h-7 text-xs" label="Sync" />
              </HStack>
            </HStack>
          </VStack>
        </Card>

        <Card padding={6}>
          <VStack gap={4}>
            <Heading level={3} className="text-lg">Recent Scans</Heading>
            <VStack gap={4}>
              <HStack align="center" justify="between" className="border-b pb-3">
                <HStack align="center" gap={3}>
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <VStack gap={0}>
                    <Text weight="medium" className="text-sm">Aaryan</Text>
                    <Text type="supporting" className="text-xs">General Admission • 10:42 AM</Text>
                  </VStack>
                </HStack>
                <Button variant="ghost" size="sm" className="text-xs h-7" label="Undo" />
              </HStack>
              <HStack align="center" justify="between" className="border-b pb-3">
                <HStack align="center" gap={3}>
                  <XCircle className="w-5 h-5 text-red-500" />
                  <VStack gap={0}>
                    <Text weight="medium" className="text-sm">Unknown Code</Text>
                    <Text type="supporting" className="text-xs">SDC-99999 • 10:40 AM</Text>
                  </VStack>
                </HStack>
              </HStack>
              <HStack align="center" justify="between">
                <HStack align="center" gap={3}>
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <VStack gap={0}>
                    <Text weight="medium" className="text-sm">Jane Smith</Text>
                    <Text type="supporting" className="text-xs">General Admission • 10:35 AM</Text>
                  </VStack>
                </HStack>
                <Button variant="ghost" size="sm" className="text-xs h-7" label="Undo" />
              </HStack>
            </VStack>
          </VStack>
        </Card>
      </div>
    </div>
  )
}
