"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RegisterButton({ eventId }: { eventId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleRegister() {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/register`, {
        method: "POST",
      });
      
      const data = await res.json();
      
      if (res.ok) {
        alert(data.message || "Registration successful!");
        router.refresh();
      } else {
        alert(data.error || "Failed to register.");
      }
    } catch (error) {
      alert("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleRegister}
      disabled={loading}
      className="flex w-full items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
    >
      {loading ? "Registering..." : "Register Now"}
    </button>
  );
}
