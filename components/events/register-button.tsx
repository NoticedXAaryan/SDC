"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { registerForEventAction } from "@/app/actions/events";
import { useRouter } from "next/navigation";

interface RegisterButtonProps {
  eventId: string;
}

export function RegisterButton({ eventId }: RegisterButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleRegister = async () => {
    setLoading(true);
    setError("");
    
    const result = await registerForEventAction(eventId);
    
    if (result.success) {
      router.refresh();
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={handleRegister} disabled={loading} size="lg" className="w-full sm:w-auto">
        {loading ? "Registering..." : "Register Now"}
      </Button>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
