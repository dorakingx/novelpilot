"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BookOpen } from "lucide-react";

interface ReadNovelButtonProps {
  onClick: () => void;
  disabled?: boolean;
  variant?: "premium" | "glass";
  className?: string;
  size?: "default" | "sm" | "lg";
  label?: string;
}

export function ReadNovelButton({
  onClick,
  disabled = false,
  variant = "premium",
  className,
  size = "default",
  label = "Read Finished Novel",
}: ReadNovelButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      className={cn(className)}
      onClick={onClick}
      disabled={disabled}
    >
      <BookOpen className="mr-2 size-4" />
      {label}
    </Button>
  );
}
