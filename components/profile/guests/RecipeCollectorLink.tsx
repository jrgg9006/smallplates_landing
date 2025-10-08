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
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Your Recipe Collector</CardTitle>
          <Button variant="link" className="p-0 h-auto">
            Edit
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-muted rounded-lg px-4 py-3 text-muted-foreground overflow-hidden">
            <span className="block truncate">{collectorLink}</span>
          </div>
          
          <Button
            onClick={handleCopyLink}
            variant="outline"
            className="flex items-center gap-2"
          >
            <LinkIcon className="h-4 w-4" />
            {copied ? "Copied!" : "Copy link"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}