"use client";

import React, { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Drawer } from "vaul";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CustomizeCollectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (data: CollectorData) => void;
  currentUrl?: string;
}

interface CollectorData {
  customUrl: string;
  title: string;
  description: string;
  theme: string;
}

const THEME_OPTIONS = [
  { id: 'classic', name: 'Classic', colors: ['#000000', '#FFFFFF'] },
  { id: 'warm', name: 'Warm & Cozy', colors: ['#8B4513', '#FFF8DC'] },
  { id: 'modern', name: 'Modern', colors: ['#2563EB', '#EFF6FF'] },
  { id: 'elegant', name: 'Elegant', colors: ['#1F2937', '#F9FAFB'] },
  { id: 'playful', name: 'Playful', colors: ['#EC4899', '#FDF2F8'] },
];

export function CustomizeCollectorModal({ 
  isOpen, 
  onClose, 
  onSave,
  currentUrl = "smallplates.co/collect/johndoe" 
}: CustomizeCollectorModalProps) {
  // Responsive hook
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Form state
  const [customUrl, setCustomUrl] = useState('johndoe');
  const [title, setTitle] = useState("Share Your Favorite Recipe!");
  const [description, setDescription] = useState("I'm creating a cookbook filled with recipes from the people I love. Would you share one of your favorites?");
  const [selectedTheme, setSelectedTheme] = useState('classic');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (onSave) {
      onSave({
        customUrl,
        title,
        description,
        theme: selectedTheme
      });
    }
    
    setLoading(false);
    onClose();
  };

  const handleCopyLink = () => {
    const fullUrl = `https://smallplates.co/collect/${customUrl}`;
    navigator.clipboard.writeText(fullUrl);
    // You could add a toast notification here
  };

  // Content to be reused in both mobile and desktop
  const modalContent = (
    <>
      {/* Preview Card */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">Your Recipe Collection Link</span>
          <button 
            onClick={handleCopyLink}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Copy Link
          </button>
        </div>
        <div className="bg-white rounded border border-gray-200 px-3 py-2">
          <span className="text-sm text-gray-500">smallplates.co/collect/</span>
          <span className="text-sm font-medium text-gray-900">{customUrl || 'yourname'}</span>
        </div>
      </div>

      <Tabs defaultValue="basics" className="w-full flex-1 flex flex-col overflow-hidden">
        <TabsList className="grid w-full grid-cols-2 bg-transparent p-0 h-auto border-b border-gray-200">
          <TabsTrigger 
            value="basics" 
            className="bg-transparent border-0 rounded-none pb-2 px-0 text-gray-600 font-normal data-[state=active]:bg-transparent data-[state=active]:text-black data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-black data-[state=active]:font-medium"
          >
            Basics
          </TabsTrigger>
          <TabsTrigger 
            value="style" 
            className="bg-transparent border-0 rounded-none pb-2 px-0 text-gray-600 font-normal data-[state=active]:bg-transparent data-[state=active]:text-black data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-black data-[state=active]:font-medium"
          >
            Style & Theme
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basics" className="flex-1 overflow-y-auto mt-6 px-2">
          <div className="space-y-6 pb-24 pr-4">
            {/* Custom URL */}
            <div>
              <Label htmlFor="customUrl" className="text-sm font-medium text-gray-600">
                Custom URL
              </Label>
              <div className="mt-1 flex items-center">
                <span className="text-sm text-gray-500 mr-1">smallplates.co/collect/</span>
                <Input
                  id="customUrl"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="yourname"
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Choose a memorable URL for your recipe collection page
              </p>
            </div>

            {/* Page Title */}
            <div>
              <Label htmlFor="title" className="text-sm font-medium text-gray-600">
                Page Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1"
                placeholder="Share Your Favorite Recipe!"
              />
              <p className="text-xs text-gray-500 mt-1">
                This is the main headline your guests will see
              </p>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" className="text-sm font-medium text-gray-600">
                Welcome Message
              </Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-vertical min-h-[100px]"
                placeholder="Tell your guests why you're collecting recipes..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Explain why you&apos;re collecting recipes and make it personal
              </p>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                💡 Pro Tips
              </h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Keep your URL short and easy to remember</li>
                <li>• Make your message warm and personal</li>
                <li>• Share this link via email, text, or social media</li>
                <li>• Recipes submitted will appear in your guest list</li>
              </ul>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="style" className="flex-1 overflow-y-auto mt-6 px-2">
          <div className="space-y-6 pb-24 pr-4">
            {/* Theme Selection */}
            <div>
              <Label className="text-sm font-medium text-gray-600 mb-3 block">
                Choose a Theme
              </Label>
              <div className="space-y-3">
                {THEME_OPTIONS.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedTheme(theme.id)}
                    className={`w-full p-4 rounded-lg border-2 transition-all ${
                      selectedTheme === theme.id 
                        ? 'border-black bg-gray-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          {theme.colors.map((color, idx) => (
                            <div
                              key={idx}
                              className="w-6 h-6 rounded-full border border-gray-200"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        <span className="font-medium text-gray-900">{theme.name}</span>
                      </div>
                      {selectedTheme === theme.id && (
                        <span className="text-sm font-medium text-black">Selected</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Preview Section */}
            <div>
              <Label className="text-sm font-medium text-gray-600 mb-3 block">
                Preview
              </Label>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="aspect-video bg-gray-100 flex items-center justify-center">
                  <p className="text-sm text-gray-500">Theme preview coming soon...</p>
                </div>
              </div>
            </div>

            {/* Additional Options */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">
                More customization options like fonts, backgrounds, and layouts are coming soon!
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );

  // Mobile version - Drawer
  if (isMobile) {
    return (
      <Drawer.Root open={isOpen} onOpenChange={onClose}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 mt-24 flex h-full max-h-[85vh] flex-col rounded-t-[10px] bg-white">
            <div className="mx-auto mt-4 h-1.5 w-12 rounded-full bg-gray-300" />
            
            <div className="p-6 flex flex-col h-full overflow-hidden">
              <Drawer.Title className="font-serif text-2xl font-semibold mb-4">
                Customize Your Recipe Collector
              </Drawer.Title>
              
              <div className="flex-1 overflow-hidden flex flex-col">
                {modalContent}
              </div>
              
              {/* Save Button */}
              <div className="mt-4 pb-safe">
                <Button 
                  onClick={handleSave}
                  disabled={loading}
                  className="w-full bg-black text-white hover:bg-gray-800 py-3 rounded-full disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save & Continue'}
                </Button>
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  // Desktop version - Sheet
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="!w-[45%] !max-w-none h-full flex flex-col overflow-hidden">
        <SheetHeader>
          <SheetTitle className="font-serif text-2xl font-semibold mb-4">
            Customize Your Recipe Collector
          </SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col relative">
          {modalContent}
          
          {/* Save Button - Fixed position */}
          <div className="absolute bottom-6 right-6">
            <Button 
              onClick={handleSave}
              disabled={loading}
              className="bg-black text-white hover:bg-gray-800 px-6 py-2 rounded-full disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save & Continue'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}