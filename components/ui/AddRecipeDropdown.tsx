"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { BookOpen, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AddRecipeDropdownProps {
  buttonText?: string;
  onAddExistingRecipe: () => void;
  onAddNewRecipe: () => void;
  className?: string;
  disabled?: boolean;
}

export function AddRecipeDropdown({
  buttonText = "Add a Recipe",
  onAddExistingRecipe,
  onAddNewRecipe,
  className,
  disabled = false
}: AddRecipeDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={className || "border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg px-6 py-2 text-sm font-medium flex items-center gap-2"}
          disabled={disabled}
        >
          <BookOpen className="h-4 w-4" />
          {buttonText}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={onAddExistingRecipe}>
          Add an existing recipe
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onAddNewRecipe}>
          Add a new recipe
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}