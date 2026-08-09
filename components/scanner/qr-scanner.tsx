"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import * as faceapi from "@vladmandic/face-api";
import { Button } from "@astryxdesign/core/Button";
import { Banner } from "@astryxdesign/core/Banner";
import { Camera, Upload, X, ScanFace, Loader2 } from "lucide-react";
import { addPendingCheckIn, getPendingCheckIns, removePendingCheckIn } from "@/lib/offline/db";

export function QrScannerCamera({ onScan }: { onScan: (t: string) => void }) {
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
    } catch (err) {
      console.error("Failed to stop camera", err);
    } 
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
  
  useEffect(() => {
    return () => { stopCamera(); };
  }, []);
  
  return (
    <div className="space-y-4">
      <div id="qr-reader" className="w-full aspect-square rounded-lg bg-black/5 overflow-hidden" />
      <div id="qr-reader-file" className="hidden" />
      {errorMsg && (
        <Banner status="error" title={errorMsg} />
      )}
      <div className="flex gap-2">
        {status !== "scanning" ? (
          <Button onClick={startCamera} className="flex-1" icon={<Camera className="h-4 w-4" />} label="Start Camera" />
        ) : (
          <Button variant="secondary" onClick={stopCamera} className="flex-1" icon={<X className="h-4 w-4" />} label="Stop" />
        )}
        <Button variant="secondary" onClick={() => fileRef.current?.click()} className="flex-1" icon={<Upload className="h-4 w-4" />} label="Upload" />
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
  
  const [faceMatchEnabled, setFaceMatchEnabled] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);

  useEffect(() => {
    if (faceMatchEnabled && !modelsLoaded && !loadingModels) {
      setLoadingModels(true);
      const loadModels = async () => {
        try {
          const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/";
          await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
          ]);
          setModelsLoaded(true);
        } catch (err) {
          console.error("Failed to load models:", err);
          setFaceMatchEnabled(false);
        } finally {
          setLoadingModels(false);
        }
      };
      loadModels();
    }
  }, [faceMatchEnabled, modelsLoaded, loadingModels]);

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
        if (faceMatchEnabled) {
          setScanResult({ success: false, message: "Face match requires internet connection" });
          return;
        }
        await addPendingCheckIn(eventId, decodedText);
        setScanResult({ success: true, message: "Offline - queued for sync" });
        setPendingCount(prev => prev + 1);
      } else {
        let scannedFaceDescriptor = null;
        
        if (faceMatchEnabled) {
          const videoEl = document.querySelector("#qr-reader video") as HTMLVideoElement;
          if (videoEl) {
            setScanResult({ success: true, message: "Analyzing face..." });
            const detection = await faceapi.detectSingleFace(
              videoEl, 
              new faceapi.TinyFaceDetectorOptions()
            ).withFaceLandmarks().withFaceDescriptor();
            
            if (detection) {
              scannedFaceDescriptor = Array.from(detection.descriptor);
            } else {
              setScanResult({ success: false, message: "No face detected. Please face the camera." });
              return;
            }
          }
        }
        
        const res = await fetch("/api/scanner/check-in", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: decodedText, eventId, scannedFaceDescriptor })
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
  }, [eventId, faceMatchEnabled]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-medium">Event Scanner</h3>
          {pendingCount > 0 && (
            <span className="bg-[var(--warning-background)] text-[var(--warning-foreground)] text-xs px-2 py-1 rounded-full font-semibold">
              {pendingCount} Queued
            </span>
          )}
        </div>
        
        <Button 
          variant={faceMatchEnabled ? "primary" : "secondary"} 
          size="sm"
          onClick={() => setFaceMatchEnabled(!faceMatchEnabled)}
          icon={loadingModels ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanFace className="w-4 h-4" />}
          label={faceMatchEnabled ? "Face Match On" : "Face Match Off"}
        />
      </div>
      
      <QrScannerCamera onScan={handleScan} />

      {scanResult && (
        <Banner 
          status={scanResult.success ? "success" : "error"} 
          title={scanResult.message} 
        />
      )}
    </div>
  );
}
