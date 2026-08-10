"use client";

import { Selector } from "@astryxdesign/core/Selector";
import { Button } from "@astryxdesign/core/Button";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function EventSelector({ 
  events, 
  defaultValue 
}: { 
  events: { id: string; title: string }[]; 
  defaultValue: string 
}) {
  const [val, setVal] = useState(defaultValue);
  const router = useRouter();

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-end">
      <div className="flex-1 w-full">
        <Selector
          label="Event"
          isLabelHidden
          value={val}
          onChange={(v) => setVal(v || "")}
          options={events.map(evt => ({ label: evt.title, value: evt.id }))}
        />
      </div>
      <Button 
        label="Set Event" 
        variant="primary" 
        className="w-full sm:w-auto" 
        onClick={() => {
          if (val) router.push(`?eventId=${val}`);
        }}
      />
    </div>
  );
}
