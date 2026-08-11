"use client";

import { useState, useTransition } from "react";
import { updateContentStatus, createContentIdea } from "../actions";
import { Card, VStack, HStack, Text, Badge, Button, Heading, DropdownMenu } from "@astryxdesign/core";
import { Plus, MoreVertical } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const COLUMNS = [
  { id: "idea", title: "Ideas" },
  { id: "drafting", title: "Drafting" },
  { id: "review", title: "In Review" },
  { id: "scheduled", title: "Scheduled" },
  { id: "published", title: "Published" },
];

export function ContentBoard({ initialItems }: { initialItems: any[] }) {
  const [items, setItems] = useState(initialItems);
  const [isPending, startTransition] = useTransition();

  // Create idea state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [platform, setPlatform] = useState("");

  const handleStatusChange = (id: string, newStatus: string) => {
    // Optimistic update
    setItems((prev) => 
      prev.map((item) => item.content.id === id ? { ...item, content: { ...item.content, status: newStatus } } : item)
    );

    startTransition(() => {
      updateContentStatus(id, newStatus).catch(() => {
        // Revert on error
        setItems(initialItems);
      });
    });
  };

  const handleCreate = () => {
    if (!title) return;
    
    startTransition(() => {
      createContentIdea(title, description, platform || "general").then(() => {
        setIsCreateOpen(false);
        setTitle("");
        setDescription("");
        setPlatform("");
        window.location.reload(); // Simple refresh to pick up new item from server
      });
    });
  };

  return (
    <VStack gap={6}>
      <HStack justify="between" align="center">
        <div>
          <Heading level={1}>Content Calendar</Heading>
          <Text type="supporting">Manage social media posts and blog content across platforms.</Text>
        </div>

        <Button variant="primary" label="New Idea" icon={<Plus className="w-4 h-4" />} onClick={() => setIsCreateOpen(true)} />

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Content Idea</DialogTitle>
            </DialogHeader>
            <VStack gap={4} className="py-4">
              <VStack gap={2}>
                <Text weight="medium">Title</Text>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Next.js 14 Guide" />
              </VStack>
              <VStack gap={2}>
                <Text weight="medium">Description</Text>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief outline..." />
              </VStack>
              <VStack gap={2}>
                <Text weight="medium">Platform</Text>
                <Input value={platform} onChange={(e) => setPlatform(e.target.value)} placeholder="e.g. twitter, blog, linkedin" />
              </VStack>
            </VStack>
            <DialogFooter>
              <Button variant="secondary" label="Cancel" onClick={() => setIsCreateOpen(false)} />
              <Button variant="primary" label={isPending ? "Creating..." : "Create"} onClick={handleCreate} isDisabled={!title || isPending} />
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </HStack>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const colItems = items.filter((i) => i.content.status === col.id);
          
          return (
            <div key={col.id} className="min-w-[300px] flex-1 bg-muted/30 rounded-xl p-4 flex flex-col gap-4">
              <HStack justify="between" align="center" className="px-1">
                <Text weight="semibold">{col.title}</Text>
                <Badge label={colItems.length.toString()} variant="neutral" />
              </HStack>
              
              <VStack gap={3}>
                {colItems.map(({ content, author }) => {
                  // Astryx DropdownMenu items format
                  const dropdownItems = COLUMNS.filter(c => c.id !== content.status).map(c => ({
                    id: c.id,
                    label: `Move to ${c.title}`,
                    onSelect: () => handleStatusChange(content.id, c.id)
                  }));

                  return (
                    <Card key={content.id} padding={4}>
                      <VStack gap={3}>
                        <HStack justify="between" align="start">
                          <Badge 
                            label={content.platform || "General"} 
                            variant="info" 
                            className="uppercase text-[10px]" 
                          />
                          <DropdownMenu 
                            items={dropdownItems} 
                            button={{
                              label: "More Options",
                              variant: "ghost",
                              isIconOnly: true,
                              size: "sm",
                              icon: <MoreVertical className="w-4 h-4" />
                            }} 
                          />
                        </HStack>
                        <Heading level={4} className="text-base leading-tight">
                          {content.title}
                        </Heading>
                        {content.description && (
                          <Text type="supporting" className="text-xs line-clamp-2">
                            {content.description}
                          </Text>
                        )}
                        <HStack justify="between" align="center" className="pt-2 border-t mt-1">
                          <Text type="supporting" className="text-[10px]">By {author?.name || "Unknown"}</Text>
                          {content.scheduledFor && (
                            <Text className="text-[10px] font-medium text-blue-600">
                              {new Date(content.scheduledFor).toLocaleDateString()}
                            </Text>
                          )}
                        </HStack>
                      </VStack>
                    </Card>
                  );
                })}
                {colItems.length === 0 && (
                  <div className="text-center p-4 border border-dashed rounded-lg text-xs text-muted-foreground">
                    No items
                  </div>
                )}
              </VStack>
            </div>
          );
        })}
      </div>
    </VStack>
  );
}
