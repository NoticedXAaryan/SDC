"use client"

import { useEffect, useState } from "react"
import { Card, Button, Heading, Text, HStack, VStack, Badge } from "@astryxdesign/core"
import { Mail, MessageSquare, Send, RefreshCcw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

export function EventCommunicationsTab({ event }: { event: any }) {
  const [comms, setComms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [targetAudience, setTargetAudience] = useState("all")

  const fetchComms = async () => {
    try {
      const res = await fetch(`/api/events/${event.id}/communications`)
      if (res.ok) {
        const data = await res.json()
        setComms(data.communications)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchComms()
  }, [event.id])

  const handleSend = async () => {
    if (!subject || !body) {
      toast.error("Subject and message are required.")
      return
    }

    setSending(true)
    try {
      const res = await fetch(`/api/events/${event.id}/communications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body, targetAudience }),
      })

      if (res.ok) {
        toast.success("Announcement queued for broadcast")
        setSubject("")
        setBody("")
        fetchComms()
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to send announcement")
      }
    } catch (e) {
      toast.error("Network error")
    } finally {
      setSending(false)
    }
  }
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
                <Select value={targetAudience} onValueChange={(val) => setTargetAudience(val || "all")}>
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
                <Input placeholder="Update regarding [Event Name]" value={subject} onChange={(e) => setSubject(e.target.value)} disabled={sending} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Message</label>
                <Textarea placeholder="Type your message here..." className="min-h-[150px]" value={body} onChange={(e) => setBody(e.target.value)} disabled={sending} />
              </div>
              <div>
                <Button label={sending ? "Sending..." : "Send Announcement"} icon={sending ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} onClick={handleSend} isDisabled={sending} className="w-full sm:w-auto" />
              </div>
            </VStack>
          </VStack>
        </Card>
      </div>

      <div className="space-y-6">
        <Card padding={6}>
          <VStack gap={4}>
            <Heading level={3} className="text-lg">Communication History</Heading>
            {loading ? (
              <div className="flex justify-center p-6"><RefreshCcw className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : comms.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 text-center border rounded-lg border-dashed">
                <MessageSquare className="w-8 h-8 text-muted-foreground opacity-50 mb-2" />
                <p className="text-sm font-medium text-foreground">No previous communications</p>
                <p className="text-xs text-muted-foreground mt-1">Announcements sent will appear here</p>
              </div>
            ) : (
              <VStack gap={4} className="max-h-[300px] overflow-y-auto pr-2">
                {comms.map((comm: any) => (
                  <div key={comm.id} className="p-3 border rounded-lg bg-muted/20 space-y-2">
                    <HStack justify="between" align="start">
                      <Text weight="medium" className="text-sm line-clamp-1">{comm.subject}</Text>
                      <Badge variant={comm.status === "sent" ? "success" : "neutral"} label={comm.status} />
                    </HStack>
                    <Text type="supporting" className="text-xs">
                      To: {comm.targetAudience} • Sent: {new Date(comm.createdAt).toLocaleDateString()}
                    </Text>
                  </div>
                ))}
              </VStack>
            )}
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
