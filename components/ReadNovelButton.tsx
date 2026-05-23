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
}

export function ReadNovelButton({
  onClick,
  disabled = false,
  variant = "premium",
  className,
  size = "default",
}: ReadNovelButtonProps) {
  if (disabled) return null;

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(className)}
      onClick={onClick}
    >
      <BookOpen className="mr-2 size-4" />
      Read Novel
    </Button>
  );
}
