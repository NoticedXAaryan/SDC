"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Breadcrumbs, BreadcrumbItem } from "@astryxdesign/core";
import { Home } from "lucide-react";

export function DynamicBreadcrumbs() {
  const pathname = usePathname();
  
  if (pathname === "/dashboard" || pathname === "/") {
    return null;
  }

  const paths = pathname.split("/").filter(Boolean);

  return (
    <Breadcrumbs className="hidden md:flex mb-6">
      <BreadcrumbItem href="/dashboard">
        <Home className="w-4 h-4 mr-1 inline-block" />
        Home
      </BreadcrumbItem>
      
      {paths.map((path, index) => {
        const href = `/${paths.slice(0, index + 1).join("/")}`;
        
        // Format path: "my-registrations" -> "My Registrations"
        const label = path
          .split("-")
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");

        return (
          <BreadcrumbItem key={path} href={href}>
            {label}
          </BreadcrumbItem>
        );
      })}
    </Breadcrumbs>
  );
}
