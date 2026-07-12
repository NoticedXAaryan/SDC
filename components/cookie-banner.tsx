"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) {
      setShow(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem("cookie_consent", "all");
    setShow(false);
  };

  const decline = () => {
    localStorage.setItem("cookie_consent", "necessary");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 border-t bg-background shadow-lg z-50 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="text-sm">
        We use cookies to improve your experience and for analytics. By continuing to use this site, you agree to our <a href="/privacy" className="underline">Privacy Policy</a>.
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={decline}>Decline Optional</Button>
        <Button size="sm" onClick={accept}>Accept All</Button>
      </div>
    </div>
  );
}
