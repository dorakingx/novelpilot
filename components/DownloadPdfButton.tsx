"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FileDown, Loader2 } from "lucide-react";

interface DownloadPdfButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "premium" | "glass";
  className?: string;
  size?: "default" | "sm" | "lg";
}

export function DownloadPdfButton({
  onClick,
  disabled = false,
  loading = false,
  variant = "glass",
  className,
  size = "default",
}: DownloadPdfButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      className={cn(className)}
      onClick={onClick}
      disabled={disabled || loading}
      title="Use your browser's Save as PDF option."
    >
      {loading ? (
        <Loader2 className="mr-2 size-4 animate-spin" />
      ) : (
        <FileDown className="mr-2 size-4" />
      )}
      {loading ? "Generating PDF..." : "Download PDF"}
    </Button>
  );
}
