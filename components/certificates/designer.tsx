"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

/**
 * This wrapper avoids importing @pdfme/ui at build time.
 * The pdfme library depends on clawpdf, which uses Node.js `module` built-in
 * and cannot be bundled by Turbopack for the browser. We defer the import
 * to a runtime-only `import()` inside useEffect, which only runs in the browser.
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
        // Runtime-only dynamic import — never touched by the bundler at build time
        const [{ Designer }, { text, image, barcodes }] = await Promise.all([
          import("@pdfme/ui"),
          import("@pdfme/schemas"),
        ]);

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
        <Button onClick={handleSave} disabled={isSaving || !isLoaded}>
          {isSaving ? "Saving..." : "Save Template"}
        </Button>
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
