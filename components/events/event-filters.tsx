"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { TextInput } from "@astryxdesign/core";
import { SegmentedControl, SegmentedControlItem } from "@astryxdesign/core/SegmentedControl";
import { HStack } from "@astryxdesign/core";
import { Search } from "lucide-react";

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
        <TextInput
          label="Search events"
          isLabelHidden
          htmlName="search-events"
          value={query}
          onChange={setQuery}
          placeholder="Search events..."
          startIcon={<Search className="w-4 h-4" />}
          isLoading={isPending}
          hasClear
        />
      </div>

      <SegmentedControl
        value={currentFilter}
        onChange={handleFilterChange}
        label="Filter events"
        size="sm"
      >
        <SegmentedControlItem value="upcoming" label="Upcoming" />
        <SegmentedControlItem value="ongoing" label="Ongoing" />
        <SegmentedControlItem value="past" label="Past" />
        <SegmentedControlItem value="my-registrations" label="My Registrations" />
      </SegmentedControl>
    </div>
  );
}
