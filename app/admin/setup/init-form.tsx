"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Text } from "@astryxdesign/core/Text";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function InitForm() {
  const [isLoading, setIsLoading] = useState(false);

  const handleInit = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/setup");
      const data = await res.json();
      
      if (res.ok) {
        toast.success(data.message || "System initialized successfully.");
        // Redirect to login or refresh
        setTimeout(() => window.location.href = "/login", 1500);
      } else {
        toast.error(data.error || "Failed to initialize system.");
      }
    } catch (err) {
      toast.error("An error occurred during initialization.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Button 
        onClick={handleInit} 
        disabled={isLoading}
        size="lg"
        className="w-full font-semibold"
      >
        {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
        Initialize Master Owner Account
      </Button>
      <Text type="supporting" className="text-xs text-center">
        This action will provision the owner account using the credentials defined in the environment variables (ADMIN_EMAIL, ADMIN_PASSWORD).
      </Text>
    </div>
  );
}
