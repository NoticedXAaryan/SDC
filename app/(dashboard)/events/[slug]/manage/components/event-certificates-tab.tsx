"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Award, FileSignature, Settings } from "lucide-react"

export function EventCertificatesTab({ event }: { event: any }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" /> Issue Certificates
          </CardTitle>
          <CardDescription>Generate and issue certificates to checked-in attendees</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg flex justify-between items-center">
            <div>
              <p className="font-medium text-sm">Eligible Attendees</p>
              <p className="text-xs text-muted-foreground">Based on verified check-ins</p>
            </div>
            <div className="text-2xl font-bold">0</div>
          </div>
          
          <Button className="w-full" disabled>
            <FileSignature className="w-4 h-4 mr-2" /> Issue Certificates
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            No attendees are currently eligible for certificates.
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" /> Certificate Settings
          </CardTitle>
          <CardDescription>Configure which template to use</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-8 border rounded-lg border-dashed flex flex-col items-center justify-center text-center text-muted-foreground">
            <Award className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm font-medium text-foreground">No template selected</p>
            <p className="text-xs mt-1">Configure a template in the main certificates settings</p>
            <Button variant="outline" size="sm" className="mt-4">Browse Templates</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
