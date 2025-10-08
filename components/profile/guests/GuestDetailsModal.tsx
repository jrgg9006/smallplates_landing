"use client";

import React, { useState } from "react";
import { Guest } from "@/lib/types/guest";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface GuestDetailsModalProps {
  guest: Guest | null;
  isOpen: boolean;
  onClose: () => void;
}

export function GuestDetailsModal({ guest, isOpen, onClose }: GuestDetailsModalProps) {
  // Parse name into first and last name (simple split on first space)
  const nameParts = guest?.name.trim().split(' ') || ['', ''];
  const [firstName, setFirstName] = useState(nameParts[0] || '');
  const [lastName, setLastName] = useState(nameParts.slice(1).join(' ') || '');
  const [email, setEmail] = useState(guest?.email || '');
  const [phone, setPhone] = useState(guest?.phone || '');

  // Update state when guest changes
  React.useEffect(() => {
    if (guest) {
      const parts = guest.name.trim().split(' ');
      setFirstName(parts[0] || '');
      setLastName(parts.slice(1).join(' ') || '');
      setEmail(guest.email);
      setPhone(guest.phone || '');
    }
  }, [guest]);

  const handleSave = () => {
    // TODO: Implement save functionality
    console.log('Saving guest data:', {
      firstName,
      lastName,
      email,
      phone,
      fullName: `${firstName} ${lastName}`.trim()
    });
    // Here you would typically call an API to save the changes
  };

  if (!guest) return null;

  // Map recipe status to user-friendly labels
  const getRecipeStatusLabel = (status: Guest["recipeStatus"]) => {
    switch (status) {
      case 'not_invited':
        return 'Not requested';
      case 'invited':
        return 'Requested';
      case 'submitted':
        return 'Submitted';
      default:
        return 'Unknown';
    }
  };

  const getStatusBadgeStyle = (status: Guest["recipeStatus"]) => {
    switch (status) {
      case 'not_invited':
        return 'bg-gray-100 text-gray-700';
      case 'invited':
        return 'bg-yellow-100 text-yellow-700';
      case 'submitted':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl fixed top-[20%] left-[50%] translate-x-[-50%] translate-y-0">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-semibold mb-4">Edit Guest</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="guest-info" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-transparent p-0 h-auto border-b border-gray-200">
            <TabsTrigger value="guest-info" className="bg-transparent border-0 rounded-none pb-2 px-0 text-gray-600 font-normal data-[state=active]:bg-transparent data-[state=active]:text-black data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-black data-[state=active]:font-medium">
              Guest Info
            </TabsTrigger>
            <TabsTrigger value="contact-info" className="bg-transparent border-0 rounded-none pb-2 px-0 text-gray-600 font-normal data-[state=active]:bg-transparent data-[state=active]:text-black data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-black data-[state=active]:font-medium">
              Contact Info
            </TabsTrigger>
            <TabsTrigger value="recipe-status" className="bg-transparent border-0 rounded-none pb-2 px-0 text-gray-600 font-normal data-[state=active]:bg-transparent data-[state=active]:text-black data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-black data-[state=active]:font-medium">
              Recipe Status
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="guest-info" className="space-y-4 mt-6 pb-20">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="title" className="text-sm font-medium text-gray-600">Title</Label>
                <select
                  id="title"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="Mr.">Mr.</option>
                  <option value="Mrs.">Mrs.</option>
                  <option value="Ms.">Ms.</option>
                  <option value="Dr.">Dr.</option>
                </select>
              </div>
              <div>
                <Label htmlFor="firstName" className="text-sm font-medium text-gray-600">First Name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-sm font-medium text-gray-600">Last Name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-600">Add Plus One</Label>
              <div className="mt-2">
                <button className="text-sm text-blue-600 hover:underline">+ Add Plus One</button>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-600">Invited</Label>
              <div className="mt-1 text-sm">
                {guest.recipeStatus !== 'not_invited' ? 'Yes' : 'No'}
                {guest.invitedAt && (
                  <span className="text-gray-500 ml-2">
                    ({new Date(guest.invitedAt).toLocaleDateString()})
                  </span>
                )}
              </div>
            </div>
            
          </TabsContent>
          
          <TabsContent value="contact-info" className="space-y-4 mt-6 pb-20">
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-600">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="phone" className="text-sm font-medium text-gray-600">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number"
                className="mt-1"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="recipe-status" className="space-y-4 mt-6 pb-20">
            <div>
              <label className="text-sm font-medium text-gray-600">Recipe Status</label>
              <div className="mt-2">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeStyle(guest.recipeStatus)}`}
                >
                  {getRecipeStatusLabel(guest.recipeStatus)}
                </span>
              </div>
              {guest.submittedAt && (
                <div className="mt-2 text-xs text-gray-500">
                  Submitted on {new Date(guest.submittedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Save Button - Fixed position in bottom right */}
        <div className="absolute bottom-6 right-6">
          <Button 
            onClick={handleSave}
            className="bg-black text-white hover:bg-gray-800 px-6 py-2 rounded-full"
          >
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}