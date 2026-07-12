"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { refreshPassAction } from "@/lib/actions/passes";

export function RotatingQR({ 
  initialPass, 
  eventId, 
  passCode 
}: { 
  initialPass: string; 
  eventId: string; 
  passCode: string;
}) {
  const [pass, setPass] = useState(initialPass);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Refresh the pass every 20 seconds to prevent expiry
    const interval = setInterval(async () => {
      try {
        const newPass = await refreshPassAction(eventId, passCode);
        setPass(newPass);
        setError(null);
      } catch (err) {
        console.error("Failed to refresh pass", err);
        setError("Connection lost. QR might be stale.");
      }
    }, 20000);

    return () => clearInterval(interval);
  }, [eventId, passCode]);

  return (
    <div className="flex flex-col items-center">
      <div className="p-4 bg-white rounded-xl shadow-sm border relative">
        <QRCodeSVG 
          value={pass} 
          size={250}
          level="H"
          includeMargin={true}
        />
        {error && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center text-center p-4">
            <p className="text-red-600 font-semibold text-sm">{error}</p>
          </div>
        )}
      </div>
      <div className="mt-4 p-3 bg-muted rounded-lg border text-xs font-mono break-all text-muted-foreground w-full text-center">
        {pass}
      </div>
      <p className="text-xs text-muted-foreground mt-4 animate-pulse">
        QR code auto-updates every 20s
      </p>
    </div>
  );
}
