"use client";

import { useTheme } from "next-themes";
import { DropdownMenu } from "@astryxdesign/core/DropdownMenu";
import { Sun, Moon, Monitor } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu
      button={{
        variant: "ghost",
        isIconOnly: true,
        icon: <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />,
        label: "Toggle theme",
      }}
      items={[
        { label: "Light", icon: <Sun className="h-4 w-4" />, onClick: () => setTheme("light") },
        { label: "Dark", icon: <Moon className="h-4 w-4" />, onClick: () => setTheme("dark") },
        { label: "System", icon: <Monitor className="h-4 w-4" />, onClick: () => setTheme("system") },
      ]}
    />
  );
}
