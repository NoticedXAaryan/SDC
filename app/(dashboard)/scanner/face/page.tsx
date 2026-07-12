"use client";

import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function FaceScannerPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<string>("Initializing...");

  useEffect(() => {
    const loadModels = async () => {
      try {
        // Models need to be placed in public/models
        await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
        await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
        await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
        setIsModelsLoaded(true);
        setScanStatus("Models loaded. Ready to scan.");
      } catch (err) {
        console.error("Failed to load models", err);
        setScanStatus("Error loading face models. Make sure they are in /public/models");
      }
    };
    loadModels();
  }, []);

  const startVideo = () => {
    setIsScanning(true);
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        console.error("Failed to start video", err);
        setScanStatus("Failed to access camera.");
        setIsScanning(false);
      });
  };

  const handleVideoPlay = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setScanStatus("Scanning...");
    const displaySize = { width: videoRef.current.width, height: videoRef.current.height };
    faceapi.matchDimensions(canvasRef.current, displaySize);
    
    setInterval(async () => {
      if (videoRef.current && isScanning) {
        const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptors();
          
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        if (canvasRef.current) {
          canvasRef.current.getContext('2d')?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
        }

        if (detections.length > 0) {
          // Here we would match against enrolled descriptors via API
          // For now, mock successful scan
          setScanStatus("Face detected. Matching...");
          // Simulate API call
          setTimeout(() => {
            setScanStatus("Match found! Attendee Checked In.");
          }, 1000);
        } else {
          setScanStatus("No face detected.");
        }
      }
    }, 2000);
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Face Attendance Scanner</CardTitle>
          <CardDescription>Anti-proxy biometric check-in layer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-between items-center">
            <p className="font-medium">{scanStatus}</p>
            <Button onClick={startVideo} disabled={!isModelsLoaded || isScanning}>
              {isScanning ? "Scanning..." : "Start Camera"}
            </Button>
          </div>
          
          <div className="relative border rounded-lg overflow-hidden bg-black flex justify-center">
            <video 
              ref={videoRef} 
              autoPlay 
              muted 
              width="720" 
              height="560" 
              onPlay={handleVideoPlay}
              className="max-w-full"
            />
            <canvas 
              ref={canvasRef} 
              className="absolute top-0 left-1/2 transform -translate-x-1/2" 
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
