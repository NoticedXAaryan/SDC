"use client";

import React from "react";
import { TopNav, TopNavHeading, Avatar, Badge, Button, IconButton } from "@astryxdesign/core";
import { Bell, Search, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

interface AppTopNavProps {
  user: {
    name: string;
    image?: string | null;
    role?: string;
  };
}

export function AppTopNav({ user }: AppTopNavProps) {
  const { theme, setTheme } = useTheme();
  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  return (
    <TopNav
      heading={
        <TopNavHeading
          logo={
            <div className="w-8 h-8 bg-black dark:bg-white text-white dark:text-black rounded-lg flex items-center justify-center font-bold text-lg">
              S
            </div>
          }
          heading="SDC OS"
          headingHref="/dashboard"
        />
      }
      endContent={
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            label="Search"
            icon={<Search className="w-4 h-4" />}
            endContent={<span className="text-muted-foreground text-xs font-mono ml-2">⌘K</span>}
            onClick={() => {
              const event = new KeyboardEvent("keydown", { metaKey: true, key: "k" });
              document.dispatchEvent(event);
            }}
          />
          
          <IconButton
            icon={theme === "dark" ? <Sun /> : <Moon />}
            label="Toggle theme"
            variant="ghost"
            onClick={toggleTheme}
          />
          
          <div className="relative">
            <IconButton
              icon={<Bell />}
              label="Notifications"
              variant="ghost"
            />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </div>

          <div className="ml-2 pl-2 border-l">
            <Avatar
              name={user.name}
              src={user.image || undefined}
              size="md"
            />
          </div>
        </div>
      }
    />
  );
}
