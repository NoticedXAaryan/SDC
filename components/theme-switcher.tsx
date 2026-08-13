"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Moon, Sun, Monitor } from "lucide-react";

const COLOR_THEMES = [
  { id: "default", label: "Neutral", preview: "oklch(0.2 0 0)" },
  { id: "space", label: "Space", preview: "oklch(0.65 0.25 285)" },
  { id: "rose", label: "Rose", preview: "oklch(0.55 0.2 350)" },
  { id: "ocean", label: "Ocean", preview: "oklch(0.5 0.18 230)" },
  { id: "emerald", label: "Emerald", preview: "oklch(0.55 0.17 160)" },
  { id: "butter", label: "Butter", preview: "oklch(0.85 0.12 90)" },
] as const;

export function ThemeSwitcher() {
  const { theme: mode, setTheme: setMode } = useTheme();
  const [colorTheme, setColorTheme] = useState("default");

  useEffect(() => {
    const saved = localStorage.getItem("sdc-color-theme") || "default";
    setColorTheme(saved);
    applyColorTheme(saved);
  }, []);

  const applyColorTheme = (id: string) => {
    const html = document.documentElement;
    if (id === "default") {
      html.removeAttribute("data-theme");
    } else {
      html.setAttribute("data-theme", id);
    }
    localStorage.setItem("sdc-color-theme", id);
  };

  const handleColorTheme = (id: string) => {
    setColorTheme(id);
    applyColorTheme(id);
  };

  return (
    <div className="space-y-6">
      {/* Mode */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-foreground">Appearance</h3>
        <div className="flex gap-2">
          {[
            { id: "light", icon: Sun, label: "Light" },
            { id: "dark", icon: Moon, label: "Dark" },
            { id: "system", icon: Monitor, label: "System" },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors",
                mode === m.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <m.icon className="h-4 w-4" />
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Color theme */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-foreground">Color Theme</h3>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {COLOR_THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => handleColorTheme(t.id)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-lg border p-3 transition-colors",
                colorTheme === t.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30"
              )}
            >
              <div
                className="h-6 w-6 rounded-full border border-border"
                style={{ background: t.preview }}
              />
              <span className="text-xs font-medium text-foreground">{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
