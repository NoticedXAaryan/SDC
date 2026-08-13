"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface AdminEventControlsProps {
  eventId: string
  currentStatus: string
}

export function AdminEventControls({ eventId, currentStatus }: AdminEventControlsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleUpdateStatus = async (status: string) => {
    try {
      setIsLoading(true)
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to update status")
      }
      
      toast.success("Event Updated", {
        description: `Event status changed to ${status}.`
      })
      
      router.refresh()
    } catch (error: any) {
      toast.error("Update Failed", {
        description: error.message
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 mt-4">
      {currentStatus !== "published" && (
        <Button 
          onClick={() => handleUpdateStatus("published")} 
          disabled={isLoading}
          className="w-full"
        >
          Publish Event
        </Button>
      )}
      {currentStatus !== "cancelled" && (
        <Button 
          variant="destructive" 
          onClick={() => handleUpdateStatus("cancelled")} 
          disabled={isLoading}
          className="w-full"
        >
          Cancel Event
        </Button>
      )}
      <Button 
        variant="outline" 
        onClick={() => router.push(`/events/edit/${eventId}`)} 
        disabled={isLoading}
        className="w-full"
      >
        Edit Event
      </Button>
    </div>
  )
}
