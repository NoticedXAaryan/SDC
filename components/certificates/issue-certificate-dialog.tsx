"use client";

import { useState } from "react";
import { Button, Dialog, DialogHeader, TextInput, HStack, VStack, Text, Selector, TabList, Tab, Icon } from "@astryxdesign/core";
import { toast } from "sonner";
import { Send, Loader2, Users, User } from "lucide-react";

type Event = {
  id: string;
  title: string;
};

interface IssueCertificateDialogProps {
  templateId: string;
  templateName: string;
  events: Event[];
}

export function IssueCertificateDialog({ templateId, templateName, events }: IssueCertificateDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [selectedEventId, setSelectedEventId] = useState("");
  const [activeTab, setActiveTab] = useState("group");

  async function handleIssueIndividual(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/certificates/issue-single", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, templateId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to issue certificate");
      }

      toast.success(`Certificate issue job queued for ${email}`);
      setIsOpen(false);
      setEmail("");
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleIssueGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEventId) {
      toast.error("Please select an event");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/certificates/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: selectedEventId, templateId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to issue certificates");
      }

      toast.success("Bulk certificate issue job queued");
      setIsOpen(false);
      setSelectedEventId("");
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Button 
        variant="secondary"
        onClick={() => setIsOpen(true)}
        icon={<Send className="w-4 h-4" />}
        label="Issue"
      />
      <Dialog isOpen={isOpen} onOpenChange={setIsOpen}>
        <DialogHeader title="Issue Certificates" />
        <VStack gap={4} className="py-4">
          <Text type="supporting" className="text-sm">
            Issue "{templateName}" to a group of event attendees or an individual.
          </Text>

          <TabList 
            value={activeTab}
            onChange={(tab) => setActiveTab(tab)}
          >
            <Tab value="group" label="Event Group" />
            <Tab value="individual" label="Individual" />
          </TabList>
          
          {activeTab === "group" && (
            <form onSubmit={handleIssueGroup}>
              <VStack gap={4}>
                <VStack gap={2}>
                  <Selector 
                    label="Select Event"
                    value={selectedEventId}
                    onChange={(val) => setSelectedEventId(val || "")}
                    options={events.map(e => ({ label: e.title, value: e.id }))}
                    placeholder="Select an event..."
                    isDisabled={isLoading}
                  />
                  <Text type="supporting" className="text-xs">
                    This will queue a certificate for all attendees of this event.
                  </Text>
                </VStack>
                <Button 
                  type="submit" 
                  isDisabled={isLoading} 
                  label={isLoading ? "Issuing..." : "Issue to All Attendees"}
                  icon={isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
                />
              </VStack>
            </form>
          )}
          
          {activeTab === "individual" && (
            <form onSubmit={handleIssueIndividual}>
              <VStack gap={4}>
                <VStack gap={2}>
                  <TextInput 
                    id="email" 
                    label="User Email"
                    type="email"
                    placeholder="user@example.com" 
                    value={email} 
                    onChange={val => setEmail(val)} 
                    isDisabled={isLoading}
                  />
                  <Text type="supporting" className="text-xs">
                    The user must already have an account on the platform.
                  </Text>
                </VStack>
                <Button 
                  type="submit" 
                  isDisabled={isLoading} 
                  label={isLoading ? "Issuing..." : "Issue to User"}
                  icon={isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
                />
              </VStack>
            </form>
          )}
        </VStack>
      </Dialog>
    </>
  );
}
