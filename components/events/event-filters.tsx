"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export function EventFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentFilter = searchParams.get("filter") || "upcoming";
  const currentQuery = searchParams.get("q") || "";
  
  const [query, setQuery] = useState(currentQuery);

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      return params.toString();
    },
    [searchParams]
  );

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query !== currentQuery) {
        startTransition(() => {
          router.push(`${pathname}?${createQueryString("q", query)}`);
        });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, currentQuery, pathname, router, createQueryString]);

  const handleFilterChange = (value: string) => {
    if (value) {
      startTransition(() => {
        router.push(`${pathname}?${createQueryString("filter", value)}`);
      });
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6 items-center justify-between">
      <div className="relative w-full sm:w-72">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search events..."
          className="w-full pl-9 bg-background"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {isPending && (
          <div className="absolute right-3 top-2.5 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        )}
      </div>

      <ToggleGroup
        type="single"
        value={currentFilter}
        onValueChange={handleFilterChange}
        className="justify-start w-full sm:w-auto"
      >
        <ToggleGroupItem value="upcoming" aria-label="Upcoming">
          Upcoming
        </ToggleGroupItem>
        <ToggleGroupItem value="ongoing" aria-label="Ongoing">
          Ongoing
        </ToggleGroupItem>
        <ToggleGroupItem value="past" aria-label="Past">
          Past
        </ToggleGroupItem>
        <ToggleGroupItem value="my-registrations" aria-label="My Registrations">
          My Registrations
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
