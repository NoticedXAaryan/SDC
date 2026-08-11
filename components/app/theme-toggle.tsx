"use client";

import { useTheme } from "next-themes";
import { DropdownMenu } from "@astryxdesign/core/DropdownMenu";
import { Sun, Moon, Monitor, Palette } from "lucide-react";
import React from "react";
import { HueThemeContext } from "../providers/theme-provider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { hueTheme, setHueTheme } = React.useContext(HueThemeContext);

  return (
    <DropdownMenu
      button={{
        variant: "ghost",
        isIconOnly: true,
        icon: <Palette className="h-4 w-4" />,
        label: "Toggle theme",
      }}
      items={[
        { label: "Mode: Light", icon: <Sun className="h-4 w-4" />, onClick: () => setTheme("light") },
        { label: "Mode: Dark", icon: <Moon className="h-4 w-4" />, onClick: () => setTheme("dark") },
        { label: "Mode: System", icon: <Monitor className="h-4 w-4" />, onClick: () => setTheme("system") },
        { type: "divider" },
        { label: "Theme: Butter", onClick: () => setHueTheme("butter") },
        { label: "Theme: Space", onClick: () => setHueTheme("space") },
        { label: "Theme: Neutral", onClick: () => setHueTheme("neutral") },
      ]}
    />
  );
}
