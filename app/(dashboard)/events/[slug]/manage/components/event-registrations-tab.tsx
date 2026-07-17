"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { DataTableColumnHeader } from "@/components/app/data-table/data-table-column-header"
import { DataTablePagination } from "@/components/app/data-table/data-table-pagination"
import { StatusBadge } from "@/components/app/status-badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function EventRegistrationsTab({ event }: { event: any }) {
  // Mock data for UI presentation
  const registrations = [
    { id: "1", user: { name: "Aaryan", email: "aaryan@example.com" }, status: "confirmed", checkedIn: true, registeredAt: new Date().toISOString() },
    { id: "2", user: { name: "Jane Smith", email: "jane@example.com" }, status: "confirmed", checkedIn: false, registeredAt: new Date().toISOString() },
    { id: "3", user: { name: "John Doe", email: "john@example.com" }, status: "cancelled", checkedIn: false, registeredAt: new Date().toISOString() },
  ]
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Registrations</CardTitle>
          <CardDescription>Manage attendees and waitlist</CardDescription>
        </div>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" /> Export CSV
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search attendees..." className="pl-8" />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Attendee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registrations.map((reg) => (
                <TableRow key={reg.id}>
                  <TableCell>
                    <div className="font-medium">{reg.user.name}</div>
                    <div className="text-sm text-muted-foreground">{reg.user.email}</div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge 
                      variant={reg.status === "confirmed" ? "success" : reg.status === "cancelled" ? "destructive" : "warning"} 
                      label={reg.status.charAt(0).toUpperCase() + reg.status.slice(1)} 
                    />
                  </TableCell>
                  <TableCell>
                    {reg.checkedIn ? (
                      <span className="text-green-600 font-medium text-sm">Checked In</span>
                    ) : (
                      <span className="text-muted-foreground text-sm">Pending</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(reg.registeredAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">View</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* We would use DataTablePagination here in a real implementation with @tanstack/react-table */}
        <div className="mt-4 flex items-center justify-between px-2">
          <div className="text-sm text-muted-foreground">
            Showing 1 to 3 of 3 entries
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="outline" size="sm" disabled>Next</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
