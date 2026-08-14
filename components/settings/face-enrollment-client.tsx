"use client";

import { useEffect, useRef, useState } from "react";
import * as faceapi from "@vladmandic/face-api";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { HStack } from "@astryxdesign/core/HStack";
import { Banner } from "@astryxdesign/core/Banner";
import { Loader2, Camera, UserCheck, ArrowLeft, Trash2, ScanFace } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/";

export function FaceEnrollmentClient({ isEnrolled }: { isEnrolled: boolean }) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const startCamera = async () => {
    if (!modelsLoaded) return;
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Camera access denied or unavailable.");
    }
  };

  useEffect(() => {
    const loadModels = async () => {
      setStatusMsg("Loading ML models...");
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        setModelsLoaded(true);
        setStatusMsg("");
      } catch (err) {
        console.error("Failed to load models:", err);
        setErrorMsg("Failed to load face recognition models. Check network.");
      }
    };
    loadModels();
    
    return () => {
      stopCamera();
    };
  }, []);
  

  const handleEnroll = async () => {
    if (!videoRef.current || !cameraActive) return;
    
    setEnrolling(true);
    setStatusMsg("Analyzing face...");
    setErrorMsg("");
    
    try {
      const detection = await faceapi.detectSingleFace(
        videoRef.current, 
        new faceapi.TinyFaceDetectorOptions()
      ).withFaceLandmarks().withFaceDescriptor();
      
      if (!detection) {
        setErrorMsg("No face detected. Please ensure your face is clearly visible.");
        setEnrolling(false);
        setStatusMsg("");
        return;
      }
      
      if (detection.detection.score < 0.7) {
        setErrorMsg("Face not clear enough. Please improve lighting and look straight ahead.");
        setEnrolling(false);
        setStatusMsg("");
        return;
      }
      
      setStatusMsg("Saving face descriptor...");
      const descriptorArray = Array.from(detection.descriptor);
      
      const res = await fetch("/api/users/me/face-enrollment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ faceDescriptor: descriptorArray })
      });
      
      const data = await res.json();
      if (data.success) {
        setSuccessMsg("Face successfully enrolled for biometric check-in!");
        stopCamera();
        setTimeout(() => {
          router.refresh();
          router.push("/settings");
        }, 2000);
      } else {
        setErrorMsg(data.error || "Failed to save enrollment.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("An error occurred during face analysis.");
    } finally {
      setEnrolling(false);
      setStatusMsg("");
    }
  };
  
  const handleRemove = async () => {
    if (!confirm("Are you sure you want to remove your face enrollment?")) return;
    
    try {
      const res = await fetch("/api/users/me/face-enrollment", { method: "DELETE" });
      if (res.ok) {
        setSuccessMsg("Face enrollment removed.");
        router.refresh();
        setTimeout(() => {
          router.push("/settings");
        }, 1500);
      }
    } catch (err) {
      setErrorMsg("Failed to remove enrollment.");
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/settings" className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold">Face ID Enrollment</h1>
      </div>
      
      <Card padding={6}>
        <VStack gap={6}>
          <Text type="supporting">
            Set up Face ID to enable fast-lane biometric check-in at club events. Your face is converted to a secure mathematical representation and never stored as an image.
          </Text>
          
          {errorMsg && <Banner status="error" title={errorMsg} />}
          {successMsg && <Banner status="success" title={successMsg} />}
          {statusMsg && (
            <div className="flex items-center gap-2 text-primary text-sm font-medium">
              <Loader2 className="w-4 h-4 animate-spin" />
              {statusMsg}
            </div>
          )}
          
          {!cameraActive && !successMsg && (
            <div className="aspect-video bg-muted/20 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center p-6 text-center">
              {isEnrolled ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                    <UserCheck className="w-8 h-8" />
                  </div>
                  <Text weight="medium" className="text-lg">Face Already Enrolled</Text>
                  <Text type="supporting" className="mb-6">You can re-enroll to improve accuracy if your appearance has changed.</Text>
                  <HStack gap={4}>
                    <Button variant="secondary" onClick={handleRemove} icon={<Trash2 className="w-4 h-4" />} label="Remove" className="text-red-500 hover:text-red-600 hover:border-red-500" />
                    <Button variant="primary" onClick={startCamera} isDisabled={!modelsLoaded} icon={<Camera className="w-4 h-4" />} label="Re-enroll Face" />
                  </HStack>
                </>
              ) : (
                <>
                  <Camera className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                  <Text weight="medium">Camera Inactive</Text>
                  <Text type="supporting" className="mb-6">Click below to start the camera and begin enrollment.</Text>
                  <Button variant="primary" onClick={startCamera} isDisabled={!modelsLoaded} icon={<Camera className="w-4 h-4" />} label="Start Camera" />
                </>
              )}
            </div>
          )}
          
          <div className={`relative aspect-video rounded-xl overflow-hidden bg-black ${cameraActive ? "block" : "hidden"}`}>
            <video 
              ref={videoRef} 
              autoPlay 
              muted 
              playsInline
              className="w-full h-full object-cover transform -scale-x-100" 
            />
            {cameraActive && (
              <div className="absolute inset-0 border-[6px] border-primary/40 rounded-xl pointer-events-none z-10 m-8 animate-pulse" />
            )}
            <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-20" />
            
            <div className="absolute bottom-6 left-0 right-0 flex justify-center z-30">
              <HStack gap={4}>
                <Button variant="secondary" onClick={stopCamera} label="Cancel" isDisabled={enrolling} />
                <Button 
                  variant="primary" 
                  onClick={handleEnroll} 
                  label={enrolling ? "Analyzing..." : "Capture & Enroll"} 
                  isDisabled={enrolling}
                  icon={enrolling ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanFace className="w-4 h-4" />}
                />
              </HStack>
            </div>
          </div>
          
        </VStack>
      </Card>
    </div>
  );
}
