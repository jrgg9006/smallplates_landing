import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddButtonProps {
  onClick: () => void;
  title?: string;
  className?: string;
  disabled?: boolean;
}

export function AddButton({ 
  onClick, 
  title = "Add",
  className,
  disabled = false 
}: AddButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        // Base styles - consistent across all uses
        "bg-teal-600 text-white hover:bg-teal-700",
        "rounded-full w-16 h-16", 
        "flex items-center justify-center",
        "shadow-lg hover:shadow-xl transition-shadow",
        "p-0",
        // Disabled state
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg",
        // Allow custom overrides
        className
      )}
      title={title}
    >
      <Plus className="h-12 w-12" />
    </Button>
  );
}