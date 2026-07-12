"use client";

import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { addPendingCheckIn, getPendingCheckIns, removePendingCheckIn } from "@/lib/offline/db";

interface QrScannerProps {
  eventId: string;
}

export function QrScanner({ eventId }: QrScannerProps) {
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const syncPending = async () => {
    try {
      const pending = await getPendingCheckIns();
      setPendingCount(pending.length);
      if (pending.length === 0) return;
      
      const res = await fetch("/api/scanner/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkIns: pending })
      });
      const data = await res.json();
      if (data.success) {
        for (const result of data.results) {
          if (result.success || result.error === "Invalid status") {
            await removePendingCheckIn(result.id);
          }
        }
        const remaining = await getPendingCheckIns();
        setPendingCount(remaining.length);
      }
    } catch (err) {
      console.error("Failed to sync", err);
    }
  };

  useEffect(() => {
    syncPending();
    window.addEventListener("online", syncPending);
    return () => window.removeEventListener("online", syncPending);
  }, []);

  useEffect(() => {
    // We only mount the scanner if scanning is active
    if (isScanning && !scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );

      scannerRef.current.render(async (decodedText) => {
        // Pause scanning while processing
        scannerRef.current?.pause(true);
        setScanResult(null);

        try {
          if (!navigator.onLine) {
            await addPendingCheckIn(eventId, decodedText);
            setScanResult({ success: true, message: "Offline - queued for sync" });
            setPendingCount(prev => prev + 1);
          } else {
            const res = await fetch("/api/scanner/check-in", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token: decodedText, eventId })
            });
            
            const data = await res.json();
            if (data.success) {
              setScanResult({ success: true, message: data.message });
            } else {
              setScanResult({ success: false, message: data.error });
            }
          }
        } catch (err) {
          await addPendingCheckIn(eventId, decodedText);
          setScanResult({ success: true, message: "Network error - queued for sync" });
          setPendingCount(prev => prev + 1);
        }

        // Resume scanning after 3 seconds automatically
        setTimeout(() => {
          setScanResult(null);
          scannerRef.current?.resume();
        }, 3000);
      }, (error) => {
        // Handle scan errors silently
      });
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(e => console.error(e));
        scannerRef.current = null;
      }
    };
  }, [isScanning, eventId]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-medium">Camera Scanner</h3>
          {pendingCount > 0 && (
            <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full font-semibold">
              {pendingCount} Queued
            </span>
          )}
        </div>
        <Button onClick={() => setIsScanning(!isScanning)} variant={isScanning ? "destructive" : "default"}>
          {isScanning ? "Stop Scanner" : "Start Scanner"}
        </Button>
      </div>
      
      {isScanning && (
        <div className="border rounded-lg overflow-hidden bg-black text-white">
          <div id="qr-reader" className="w-full"></div>
        </div>
      )}

      {scanResult && (
        <div className={`p-4 rounded-lg font-medium text-center text-lg ${scanResult.success ? "bg-green-100 text-green-800 border-green-200" : "bg-red-100 text-red-800 border-red-200"} border`}>
          {scanResult.message}
        </div>
      )}
    </div>
  );
}
