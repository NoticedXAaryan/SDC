"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

/**
 * Certificate template visual designer.
 *
 * @pdfme/ui depends on clawpdf which imports Node.js built-ins (node:fs/promises,
 * node:url, node:zlib). These cannot be resolved by any browser bundler.
 *
 * We use the `webpackIgnore: true` magic comment on the dynamic import so that
 * Webpack (and Turbopack, which respects the same comment) skips static analysis
 * of these imports entirely, deferring resolution to the browser runtime.
 */
export function CertificateDesigner({
  initialTemplate,
  templateId,
}: {
  initialTemplate: any;
  templateId: string;
}) {
  const designerRef = useRef<HTMLDivElement>(null);
  const designerInstance = useRef<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function loadDesigner() {
      try {
        // webpackIgnore prevents the bundler from tracing into these modules
        const [pdfmeUi, pdfmeSchemas] = await Promise.all([
          import(/* webpackIgnore: true */ "@pdfme/ui"),
          import(/* webpackIgnore: true */ "@pdfme/schemas"),
        ]);

        const { Designer } = pdfmeUi;
        const { text, image, barcodes } = pdfmeSchemas;

        if (cancelled || !designerRef.current) return;

        designerInstance.current = new Designer({
          domContainer: designerRef.current,
          template: initialTemplate,
          plugins: { text, image, qrcode: barcodes.qrcode },
        });

        setIsLoaded(true);
      } catch (err: any) {
        console.error("Failed to load certificate designer:", err);
        setLoadError(err.message || "Failed to load designer");
      }
    }

    loadDesigner();

    return () => {
      cancelled = true;
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
        body: JSON.stringify({
          schemas: updatedTemplate.schemas,
          basePdf: updatedTemplate.basePdf,
        }),
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

  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !designerInstance.current) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        designerInstance.current.updateTemplate(
          Object.assign(designerInstance.current.getTemplate(), { basePdf: base64 })
        );
      }
    };
    reader.readAsDataURL(file);
  };

  if (loadError) {
    return (
      <div className="p-8 text-center border rounded-lg border-dashed text-muted-foreground">
        <p className="font-medium text-red-600">Failed to load certificate designer</p>
        <p className="text-sm mt-2">{loadError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Template Designer</h2>
          <p className="text-sm text-muted-foreground">
            Drag and drop fields onto the certificate.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <input 
              type="file" 
              accept="application/pdf,image/png,image/jpeg" 
              onChange={handleBackgroundUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Button variant="outline" disabled={!isLoaded}>Upload Background</Button>
          </div>
          <Button onClick={handleSave} disabled={isSaving || !isLoaded}>
            {isSaving ? "Saving..." : "Save Template"}
          </Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden h-[800px] relative">
        {!isLoaded && !loadError && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
            <p className="text-muted-foreground">Loading designer...</p>
          </div>
        )}
        <div ref={designerRef} style={{ width: "100%", height: "100%" }} />
      </div>
    </div>
  );
}
