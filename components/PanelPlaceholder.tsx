"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PanelPlaceholderProps {
  message: string;
  icon?: LucideIcon;
  className?: string;
}

export function PanelPlaceholder({
  message,
  icon: Icon,
  className,
}: PanelPlaceholderProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-dashed border-white/12 bg-[#172033] p-6 text-center space-y-3",
        className
      )}
    >
      {Icon && (
        <Icon className="size-8 mx-auto text-[#94A3B8]" aria-hidden />
      )}
      <p className="text-sm text-[#CBD5E1] leading-relaxed">{message}</p>
      <div
        className="flex flex-col gap-2 max-w-[200px] mx-auto"
        aria-hidden
      >
        <div className="h-2 rounded-full bg-white/10" />
        <div className="h-2 rounded-full bg-white/10 w-4/5 mx-auto" />
        <div className="h-2 rounded-full bg-white/10 w-3/5 mx-auto" />
      </div>
    </div>
  );
}
