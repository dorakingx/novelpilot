"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FileDown } from "lucide-react";

interface DownloadPdfButtonProps {
  onClick: () => void;
  disabled?: boolean;
  variant?: "premium" | "glass";
  className?: string;
  size?: "default" | "sm" | "lg";
}

export function DownloadPdfButton({
  onClick,
  disabled = false,
  variant = "glass",
  className,
  size = "default",
}: DownloadPdfButtonProps) {
  if (disabled) return null;

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(className)}
      onClick={onClick}
      title="Use your browser's Save as PDF option."
    >
      <FileDown className="mr-2 size-4" />
      Download PDF
    </Button>
  );
}
