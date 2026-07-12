"use client";

import { useEffect, useState, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useParams } from "next/navigation";

export default function ScannerPage() {
  const { slug } = useParams();
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    // Only initialize scanner on client
    if (typeof window !== "undefined" && !scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );
      
      scannerRef.current.render(onScanSuccess, onScanFailure);
    }
    
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, []);

  async function onScanSuccess(decodedText: string, decodedResult: any) {
    if (loading) return; // Prevent multiple requests
    
    setScanResult(decodedText);
    setLoading(true);
    setMessage(null);
    
    try {
      const res = await fetch(`/api/events/${slug}/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signedPass: decodedText }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setMessage({ type: "success", text: `Success: Checked in ${data.user.name}` });
      } else {
        setMessage({ type: "error", text: `Error: ${data.error}` });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Network error during check-in." });
    } finally {
      // Pause scanner briefly, then clear result
      setTimeout(() => {
        setLoading(false);
      }, 2000);
    }
  }

  function onScanFailure(error: any) {
    // Suppress console spam for "No QR code found"
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">QR Scanner</h1>
        <p className="text-muted-foreground mt-2">Scan attendee QR passes for event check-in.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scanner</CardTitle>
          <CardDescription>Position the QR code within the frame.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div id="reader" className="w-full max-w-md mx-auto rounded-lg overflow-hidden border"></div>
          
          {loading && (
            <div className="text-center text-sm font-medium text-blue-600">
              Processing scan...
            </div>
          )}
          
          {message && (
            <div className={`p-4 rounded-lg text-center font-medium ${
              message.type === "success" 
                ? "bg-green-50 text-green-700 border border-green-200" 
                : "bg-red-50 text-red-700 border border-red-200"
            }`}>
              {message.text}
            </div>
          )}
          
          <div className="text-center pt-4">
            <button 
              onClick={() => setMessage(null)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Clear Status
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
