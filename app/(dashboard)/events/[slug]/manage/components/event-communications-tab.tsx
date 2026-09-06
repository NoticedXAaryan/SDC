"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, Button, Heading, Text, HStack, VStack, Badge } from "@astryxdesign/core"
import { Mail, MessageSquare, Send, RefreshCcw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

type EventCommunication = {
  id: string
  subject: string
  targetAudience: string
  status: string
  sentCount: number
  createdAt: string
}

export function EventCommunicationsTab({ event }: { event: { id: string; title: string } }) {
  const [comms, setComms] = useState<EventCommunication[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [targetAudience, setTargetAudience] = useState("all")

  const fetchComms = useCallback(async () => {
    setLoadError(null)
    try {
      const res = await fetch(`/api/events/${event.id}/communications`)
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || "Communication history could not be loaded")
      setComms(data.communications)
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Communication history could not be loaded")
    } finally {
      setLoading(false)
    }
  }, [event.id])

  useEffect(() => {
    fetchComms()
  }, [fetchComms])

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      toast.error("Subject and message are required.")
      return
    }

    setSending(true)
    try {
      const res = await fetch(`/api/events/${event.id}/communications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: subject.trim(), body: body.trim(), targetAudience }),
      })

      if (res.ok) {
        toast.success("Announcement queued for broadcast")
        setSubject("")
        setBody("")
        void fetchComms()
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to send announcement")
      }
    } catch {
      toast.error("The announcement could not be queued. Check the worker connection and try again.")
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
                <label htmlFor="announcement-audience" className="text-sm font-medium">To</label>
                <Select value={targetAudience} onValueChange={(val) => setTargetAudience(val || "all")}>
                  <SelectTrigger id="announcement-audience">
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
                <label htmlFor="announcement-subject" className="text-sm font-medium">Subject</label>
                <Input id="announcement-subject" name="subject" autoComplete="off" maxLength={200} placeholder={`Update about ${event.title}…`} value={subject} onChange={(e) => setSubject(e.target.value)} disabled={sending} />
              </div>
              <div className="space-y-2">
                <label htmlFor="announcement-message" className="text-sm font-medium">Message</label>
                <Textarea id="announcement-message" name="message" autoComplete="off" maxLength={10000} placeholder="Share the schedule, venue, or preparation details…" className="min-h-[150px]" value={body} onChange={(e) => setBody(e.target.value)} disabled={sending} />
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
              <div className="flex justify-center p-6" role="status" aria-label="Loading communication history"><RefreshCcw className="w-6 h-6 animate-spin text-muted-foreground" aria-hidden="true" /></div>
            ) : loadError ? (
              <div className="rounded-lg border border-dashed p-6 text-center">
                <p className="text-sm font-medium text-foreground">History unavailable</p>
                <p className="mt-1 text-xs text-muted-foreground">{loadError}</p>
                <Button
                  variant="secondary"
                  size="sm"
                  label="Try again"
                  icon={<RefreshCcw className="h-4 w-4" />}
                  onClick={() => void fetchComms()}
                  className="mt-4"
                />
              </div>
            ) : comms.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 text-center border rounded-lg border-dashed">
                <MessageSquare className="w-8 h-8 text-muted-foreground opacity-50 mb-2" />
                <p className="text-sm font-medium text-foreground">No previous communications</p>
                <p className="text-xs text-muted-foreground mt-1">Announcements sent will appear here</p>
              </div>
            ) : (
              <VStack gap={4} className="max-h-[300px] overflow-y-auto pr-2">
                {comms.map((comm) => (
                  <div key={comm.id} className="p-3 border rounded-lg bg-muted/20 space-y-2">
                    <HStack justify="between" align="start">
                      <Text weight="medium" className="text-sm line-clamp-1">{comm.subject}</Text>
                      <Badge
                        variant={comm.status === "sent" ? "success" : comm.status === "failed" ? "error" : "neutral"}
                        label={comm.status}
                      />
                    </HStack>
                    <Text type="supporting" className="text-xs">
                      To: {comm.targetAudience} • {comm.sentCount} delivered • {new Date(comm.createdAt).toLocaleDateString()}
                    </Text>
                  </div>
                ))}
              </VStack>
            )}
          </VStack>
        </Card>

        <Card padding={6}>
          <VStack gap={4}>
            <HStack align="center" gap={2}>
              <Mail className="h-4 w-4 text-muted-foreground" />
              <Heading level={3} className="text-lg">Automated Emails</Heading>
            </HStack>
            <Text type="supporting" className="text-xs">
              These operational messages use the club-wide email templates and run through the worker queue.
            </Text>
            <VStack gap={4}>
              <HStack align="center" justify="between">
                <VStack gap={1}>
                  <Text weight="medium" className="text-sm">Registration Confirmation</Text>
                  <Text type="supporting" className="text-xs">Sent upon successful signup</Text>
                </VStack>
                <Badge variant="success" label="Automatic" />
              </HStack>
              <HStack align="center" justify="between" className="pt-4 border-t">
                <VStack gap={1}>
                  <Text weight="medium" className="text-sm">Reminder (24h)</Text>
                  <Text type="supporting" className="text-xs">Sent 24 hours before event</Text>
                </VStack>
                <Badge variant="neutral" label="Daily 8 AM" />
              </HStack>
            </VStack>
          </VStack>
        </Card>
      </div>
    </div>
  )
}
