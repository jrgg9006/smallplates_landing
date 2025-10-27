'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Copy, ExternalLink } from 'lucide-react';

interface RecipeCollectorCardProps {
  collectLink: string;
}

export function RecipeCollectorCard({ collectLink }: RecipeCollectorCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(collectLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handleOpenLink = () => {
    window.open(collectLink, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Recipe Collector
            </h3>
            <p className="text-sm text-gray-600">
              Share this link to collect recipes from your guests
            </p>
          </div>
          <div className="bg-purple-100 p-2 rounded-lg">
            <ExternalLink className="h-5 w-5 text-purple-600" />
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={collectLink}
              readOnly
              className="bg-white border-purple-200 focus:border-purple-400 focus:ring-purple-200"
            />
            <Button
              onClick={handleCopy}
              variant="outline"
              size="icon"
              className="border-purple-200 hover:bg-purple-50 hover:border-purple-300"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4 text-purple-600" />
              )}
            </Button>
          </div>
          
          <Button
            onClick={handleOpenLink}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open Collection Page
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}