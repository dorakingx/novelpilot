import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-xl border border-white/12 bg-[#111827] px-3 py-2.5 text-base text-[#F8FAFC] transition-all outline-none placeholder:text-[#94A3B8] focus-visible:border-[#F5C542] focus-visible:ring-3 focus-visible:ring-[#38BDF8]/25 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
