"use client";

import { useEffect, useRef, useState } from "react";
import { Designer } from "@pdfme/ui";
import { text, image, barcodes } from "@pdfme/schemas";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function CertificateDesigner({ 
  initialTemplate, 
  templateId 
}: { 
  initialTemplate: any;
  templateId: string;
}) {
  const designerRef = useRef<HTMLDivElement>(null);
  const designerInstance = useRef<Designer | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (designerRef.current && !designerInstance.current) {
      designerInstance.current = new Designer({
        domContainer: designerRef.current,
        template: initialTemplate,
        plugins: { text, image, qrcode: barcodes.qrcode }
      });
    }
    
    return () => {
      if (designerInstance.current) {
        designerInstance.current.destroy();
        designerInstance.current = null;
      }
    };
  }, [initialTemplate]);

  const handleSave = async () => {
    if (!designerInstance.current) return;
    setIsSaving(true);
    
    try {
      const updatedTemplate = designerInstance.current.getTemplate();
      
      const res = await fetch(`/api/certificates/templates/${templateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schemas: updatedTemplate.schemas, basePdf: updatedTemplate.basePdf })
      });
      
      if (res.ok) {
        alert("Template saved successfully");
        router.refresh();
      } else {
        alert("Failed to save template");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border">
        <div>
          <h2 className="text-xl font-bold">Template Designer</h2>
          <p className="text-sm text-muted-foreground">Drag and drop fields onto the certificate.</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Template"}
        </Button>
      </div>
      
      <div className="border rounded-lg overflow-hidden h-[800px]">
        <div ref={designerRef} style={{ width: "100%", height: "100%" }} />
      </div>
    </div>
  );
}
