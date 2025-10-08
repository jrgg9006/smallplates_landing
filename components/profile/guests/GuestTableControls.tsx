"use client";

import React from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface GuestTableControlsProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onFilterChange: (value: string) => void;
  onAddGuest: () => void;
}

export function GuestTableControls({ 
  searchValue, 
  onSearchChange, 
  onFilterChange, 
  onAddGuest 
}: GuestTableControlsProps) {
  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 w-64 bg-white rounded-full border-gray-200"
          />
        </div>
        <Select onValueChange={onFilterChange} defaultValue="all">
          <SelectTrigger className="w-40 bg-white border-gray-200 rounded-full text-sm">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="not_invited">Not Invited</SelectItem>
            <SelectItem value="invited">Invited</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex items-center gap-2">
        <Button 
          onClick={onAddGuest}
          className="bg-black text-white hover:bg-gray-800 rounded-full px-6"
        >
          Add guests
        </Button>
      </div>
    </div>
  );
}