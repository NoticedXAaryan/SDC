"use client";

import React from "react";
import { MobileNav } from "@astryxdesign/core";
import { AppSideNav } from "./app-sidenav";

interface AppMobileNavProps {
  role?: string;
  user: {
    name: string;
    image?: string | null;
  };
}

export function AppMobileNav({ role, user }: AppMobileNavProps) {
  return (
    <MobileNav
      header="SDC"
    >
      <AppSideNav role={role} />
    </MobileNav>
  );
}
