"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Card, Button, Heading, Text, HStack, VStack, TextInput, Switch, Badge } from "@astryxdesign/core"
import { Settings, CheckSquare, Users, Link as LinkIcon, Trash, Plus } from "lucide-react"

export function EventSettingsTab({ event }: { event: any }) {
  const [saving, setSaving] = useState(false)
  
  // Checklist State
  const [checklist, setChecklist] = useState<any[]>(event.checklist || [])
  const [newTask, setNewTask] = useState("")

  // Staff State
  const [staff, setStaff] = useState<any[]>(event.staff || [])
  const [newStaffEmail, setNewStaffEmail] = useState("")
  const [newStaffRole, setNewStaffRole] = useState("volunteer")

  // Sub-event State
  const [parentId, setParentId] = useState(event.parentId || "")

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/events/${event.id}`, { 
        method: 'PATCH', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checklist, staff, parentId: parentId || null }) 
      })
      if (!res.ok) throw new Error("Failed to save settings")
      toast.success("Settings saved successfully")
    } catch (e) {
      toast.error("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  const addChecklistItem = () => {
    if (!newTask) return
    setChecklist([...checklist, { id: crypto.randomUUID(), title: newTask, completed: false }])
    setNewTask("")
  }

  const addStaffMember = () => {
    if (!newStaffEmail) return
    setStaff([...staff, { id: crypto.randomUUID(), email: newStaffEmail, role: newStaffRole }])
    setNewStaffEmail("")
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card padding={6}>
          <VStack gap={6}>
            <VStack gap={1}>
              <HStack align="center" gap={2}>
                <LinkIcon className="w-5 h-5 text-muted-foreground" />
                <Heading level={3} className="text-lg">Event Hierarchy</Heading>
              </HStack>
              <Text type="supporting">Configure parent and child event relationships.</Text>
            </VStack>

            <VStack gap={4}>
              <TextInput
                label="Parent Event ID"
                value={parentId}
                onChange={setParentId}
                placeholder="Leave blank for top-level events"
              />
              <Text type="supporting" className="text-xs">
                If this is a sub-event (e.g. a specific track or workshop), enter the main event's ID here.
              </Text>
            </VStack>
          </VStack>
        </Card>

        <Card padding={6}>
          <VStack gap={6}>
            <VStack gap={1}>
              <HStack align="center" gap={2}>
                <CheckSquare className="w-5 h-5 text-muted-foreground" />
                <Heading level={3} className="text-lg">Task Checklist</Heading>
              </HStack>
              <Text type="supporting">Track required tasks for this event.</Text>
            </VStack>

            <VStack gap={4}>
              <VStack gap={2}>
                {checklist.map((task, idx) => (
                  <HStack key={task.id} align="center" justify="between" className="p-2 border rounded-md">
                    <HStack align="center" gap={3}>
                      <Switch 
                        label={`Toggle task: ${task.title}`}
                        isLabelHidden
                        value={task.completed} 
                        onChange={(val) => {
                          const newChecklist = [...checklist]
                          newChecklist[idx].completed = val
                          setChecklist(newChecklist)
                        }} 
                      />
                      <Text className={task.completed ? "line-through text-muted-foreground" : ""}>{task.title}</Text>
                    </HStack>
                    <Button
                      variant="ghost"
                      isIconOnly
                      size="sm"
                      label="Delete task"
                      icon={<Trash className="w-4 h-4 text-red-500" />}
                      onClick={() => setChecklist(checklist.filter(t => t.id !== task.id))}
                    />
                  </HStack>
                ))}
              </VStack>
              <HStack gap={2}>
                <TextInput
                  label="New task description"
                  isLabelHidden
                  placeholder="New task description..."
                  value={newTask}
                  onChange={setNewTask}
                />
                <Button label="Add" onClick={addChecklistItem} />
              </HStack>
            </VStack>
          </VStack>
        </Card>
      </div>

      <Card padding={6}>
        <VStack gap={6}>
          <VStack gap={1}>
            <HStack align="center" gap={2}>
              <Users className="w-5 h-5 text-muted-foreground" />
              <Heading level={3} className="text-lg">Staff Assignment</Heading>
            </HStack>
            <Text type="supporting">Manage staff and volunteers assigned to this event.</Text>
          </VStack>

          <VStack gap={4}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {staff.map((member) => (
                <div key={member.id} className="p-4 border rounded-lg flex flex-col gap-2">
                  <HStack justify="between">
                    <Text weight="medium">{member.email}</Text>
                    <Badge label={member.role} variant="neutral" />
                  </HStack>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-red-500 self-start p-0 h-auto" 
                    label="Remove Staff"
                    onClick={() => setStaff(staff.filter(s => s.id !== member.id))}
                  />
                </div>
              ))}
            </div>

            <HStack gap={2} align="end" className="pt-4 border-t mt-2">
              <TextInput
                label="Staff Email"
                placeholder="email@example.com"
                value={newStaffEmail}
                onChange={setNewStaffEmail}
              />
              <TextInput
                label="Role"
                placeholder="e.g. volunteer, speaker"
                value={newStaffRole}
                onChange={setNewStaffRole}
              />
              <Button label="Assign" icon={<Plus className="w-4 h-4" />} onClick={addStaffMember} />
            </HStack>
          </VStack>
        </VStack>
      </Card>
      
      <div className="flex justify-end pt-4">
        <Button 
          variant="primary" 
          label={saving ? "Saving..." : "Save Settings"} 
          isDisabled={saving}
          onClick={handleSave} 
        />
      </div>
    </div>
  )
}
