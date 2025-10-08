"use client";

import React from "react";
import { useState } from "react";
import { Link as LinkIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface RecipeCollectorLinkProps {
  userId?: string;
}

export function RecipeCollectorLink({ userId = "demo" }: RecipeCollectorLinkProps) {
  const [copied, setCopied] = useState(false);
  
  // Generate unique link (in production, this would come from backend)
  const collectorLink = `www.smallplates.com/collect/${userId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`https://${collectorLink}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Your Recipe Collector</CardTitle>
          <Button variant="link" className="p-0 h-auto text-sm">
            Edit
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-muted rounded-lg px-3 py-2 text-muted-foreground overflow-hidden">
            <span className="block truncate text-sm">{collectorLink}</span>
          </div>
          
          <Button
            onClick={handleCopyLink}
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            <LinkIcon className="h-3 w-3" />
            <span className="text-xs">{copied ? "Copied!" : "Copy link"}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}