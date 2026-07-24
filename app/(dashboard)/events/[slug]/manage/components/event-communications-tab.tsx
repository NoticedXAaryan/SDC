"use client"

import * as React from "react"
import { Card, Button, Heading, Text, HStack, VStack } from "@astryxdesign/core"
import { Mail, MessageSquare, Send } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function EventCommunicationsTab({ event }: { event: any }) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="md:col-span-2 space-y-6">
        <Card padding={6}>
          <VStack gap={6}>
            <VStack gap={1}>
              <Heading level={3} className="text-lg">Send Announcement</Heading>
              <Text type="supporting">Send an email update to event attendees</Text>
            </VStack>
            <VStack gap={4}>
              <div className="space-y-2">
                <label className="text-sm font-medium">To</label>
                <Select defaultValue="all">
                  <SelectTrigger>
                    <SelectValue placeholder="Select recipients" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Registered (including waitlist)</SelectItem>
                    <SelectItem value="confirmed">Confirmed Only</SelectItem>
                    <SelectItem value="waitlist">Waitlist Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Subject</label>
                <Input placeholder="Update regarding [Event Name]" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Message</label>
                <Textarea placeholder="Type your message here..." className="min-h-[150px]" />
              </div>
              <div>
                <Button label="Send Announcement" icon={<Send className="w-4 h-4" />} className="w-full sm:w-auto" />
              </div>
            </VStack>
          </VStack>
        </Card>
      </div>

      <div className="space-y-6">
        <Card padding={6}>
          <VStack gap={4}>
            <Heading level={3} className="text-lg">Communication History</Heading>
            <div className="flex flex-col items-center justify-center p-6 text-center border rounded-lg border-dashed">
              <MessageSquare className="w-8 h-8 text-muted-foreground opacity-50 mb-2" />
              <p className="text-sm font-medium text-foreground">No previous communications</p>
              <p className="text-xs text-muted-foreground mt-1">Announcements sent will appear here</p>
            </div>
          </VStack>
        </Card>

        <Card padding={6}>
          <VStack gap={4}>
            <Heading level={3} className="text-lg">Automated Emails</Heading>
            <VStack gap={4}>
              <HStack align="center" justify="between">
                <VStack gap={1}>
                  <Text weight="medium" className="text-sm">Registration Confirmation</Text>
                  <Text type="supporting" className="text-xs">Sent upon successful signup</Text>
                </VStack>
                <Button variant="secondary" size="sm" label="Edit" />
              </HStack>
              <HStack align="center" justify="between" className="pt-4 border-t">
                <VStack gap={1}>
                  <Text weight="medium" className="text-sm">Reminder (24h)</Text>
                  <Text type="supporting" className="text-xs">Sent 24 hours before event</Text>
                </VStack>
                <Button variant="secondary" size="sm" label="Edit" />
              </HStack>
            </VStack>
          </VStack>
        </Card>
      </div>
    </div>
  )
}
