"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, Upload, X } from "lucide-react";
import { addPendingCheckIn, getPendingCheckIns, removePendingCheckIn } from "@/lib/offline/db";

export function QrScannerFixed({ onScan }: { onScan: (t: string) => void }) {
  const [status, setStatus] = useState<"idle"|"starting"|"scanning"|"error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const qrRef = useRef<Html5Qrcode | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const isSecure = typeof window !== "undefined" ? window.isSecureContext : true;

  const startCamera = async () => {
    setErrorMsg("");
    if (!isSecure) { setErrorMsg("Camera needs HTTPS. Use localhost or https via ngrok."); setStatus("error"); return; }
    try {
      setStatus("starting");
      await navigator.mediaDevices.getUserMedia({ video: true }).then(s=>s.getTracks().forEach(t=>t.stop()));
      const qr = new Html5Qrcode("qr-reader", { formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE], verbose: false });
      qrRef.current = qr;
      try {
        await qr.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 250, height: 250 } }, (d) => { onScan(d); stopCamera(); }, ()=>{});
      } catch {
        await qr.start({ facingMode: "user" }, { fps: 10, qrbox: 250 }, (d) => { onScan(d); stopCamera(); }, ()=>{});
      }
      setStatus("scanning");
    } catch (e: any) {
      setErrorMsg(e?.name==="NotAllowedError" ? "Permission denied. Enable in Settings > Privacy > Camera." : e?.message);
      setStatus("error");
    }
  };
  
  const stopCamera = async () => { 
    try { 
      if (qrRef.current?.isScanning) await qrRef.current.stop(); 
      qrRef.current?.clear();
    } catch {}; 
    setStatus("idle"); 
  };
  
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 5*1024*1024) { setErrorMsg("Max 5MB"); return; }
    try {
      setStatus("starting");
      const qr = new Html5Qrcode("qr-reader-file", { verbose: false });
      const result = await qr.scanFile(file, true);
      onScan(result); setStatus("idle");
    } catch { setErrorMsg("Could not read QR. Crop tightly, avoid HEIC."); setStatus("error"); }
    finally { if (fileRef.current) fileRef.current.value=""; }
  };
  
  useEffect(()=>()=>{ stopCamera(); },[]);
  

  useEffect(()=>()=>{ stopCamera() },[])
  return (
    <div className="space-y-4">
      <div id="qr-reader" className="w-full aspect-square rounded-lg bg-black/5 overflow-hidden" />
      <div id="qr-reader-file" className="hidden" />
      {errorMsg && <Alert variant="destructive"><AlertDescription>{errorMsg}</AlertDescription></Alert>}
      <div className="flex gap-2">
        {status!=="scanning" ? <Button onClick={startCamera} className="flex-1"><Camera className="mr-2 h-4 w-4" />Start Camera</Button>
        : <Button variant="outline" onClick={stopCamera} className="flex-1"><X className="mr-2 h-4 w-4" />Stop</Button>}
        <Button variant="secondary" onClick={()=>fileRef.current?.click()} className="flex-1"><Upload className="mr-2 h-4 w-4" />Upload</Button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
    </div>
  )
}

interface QrScannerProps {
  eventId: string;
}

export function QrScanner({ eventId }: QrScannerProps) {
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string } | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

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

  const handleScan = useCallback(async (decodedText: string) => {
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

    setTimeout(() => {
      setScanResult(null);
    }, 3000);
  }, [eventId]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-medium">Event Scanner</h3>
          {pendingCount > 0 && (
            <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full font-semibold">
              {pendingCount} Queued
            </span>
          )}
        </div>
      </div>
      
      <QrScannerFixed onScan={handleScan} />

      {scanResult && (
        <div className={`p-4 rounded-lg font-medium text-center text-lg ${scanResult.success ? "bg-green-100 text-green-800 border-green-200" : "bg-red-100 text-red-800 border-red-200"} border`}>
          {scanResult.message}
        </div>
      )}
    </div>
  );
}
