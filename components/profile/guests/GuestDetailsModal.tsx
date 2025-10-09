"use client";

import React, { useState } from "react";
import { Guest } from "@/lib/types/database";
import { updateGuest } from "@/lib/supabase/guests";
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
  onGuestUpdated?: () => void; // Callback to refresh the guest list
}

export function GuestDetailsModal({ guest, isOpen, onClose, onGuestUpdated }: GuestDetailsModalProps) {
  const [firstName, setFirstName] = useState(guest?.first_name || '');
  const [lastName, setLastName] = useState(guest?.last_name || '');
  const [email, setEmail] = useState(guest?.email || '');
  const [phone, setPhone] = useState(guest?.phone || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update state when guest changes
  React.useEffect(() => {
    if (guest) {
      setFirstName(guest.first_name);
      setLastName(guest.last_name);
      setEmail(guest.email);
      setPhone(guest.phone || '');
      setError(null);
    }
  }, [guest]);

  const handleSave = async () => {
    if (!guest) return;
    
    // Validate required fields
    if (!firstName.trim()) {
      setError('Please fill in First Name');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Prepare update data
      const updates = {
        first_name: firstName.trim(),
        last_name: lastName.trim() || '',
        email: email.trim() || '',
        phone: phone.trim() || null,
      };

      // Update the guest in the database
      const { error } = await updateGuest(guest.id, updates);

      if (error) {
        setError(error);
        setLoading(false);
        return;
      }

      // Success! Close modal and refresh the guest list
      onClose();
      
      // Refresh the guest list if callback provided
      if (onGuestUpdated) {
        onGuestUpdated();
      }

    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error updating guest:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!guest) return null;

  // Map status to user-friendly labels
  const getStatusLabel = (status: Guest["status"]) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'invited':
        return 'Invited';
      case 'responded':
        return 'Responded';
      case 'declined':
        return 'Declined';
      case 'submitted':
        return 'Submitted';
      default:
        return 'Unknown';
    }
  };

  const getStatusBadgeStyle = (status: Guest["status"]) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 text-gray-700';
      case 'invited':
        return 'bg-yellow-100 text-yellow-700';
      case 'responded':
        return 'bg-green-100 text-green-700';
      case 'declined':
        return 'bg-red-100 text-red-700';
      case 'submitted':
        return 'bg-blue-100 text-blue-700';
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
            <div className="grid grid-cols-2 gap-4">
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
              <button className="text-sm text-blue-600 hover:underline">+ Add Plus One</button>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-600">Status</Label>
              <div className="mt-1 text-sm">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeStyle(guest.status)}`}
                >
                  {getStatusLabel(guest.status)}
                </span>
                {guest.date_message_sent && (
                  <div className="mt-2 text-xs text-gray-500">
                    Message sent on {new Date(guest.date_message_sent).toLocaleDateString()}
                  </div>
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
              <label className="text-sm font-medium text-gray-600">Guest Status</label>
              <div className="mt-2">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeStyle(guest.status)}`}
                >
                  {getStatusLabel(guest.status)}
                </span>
              </div>
              <div className="mt-4 space-y-2">
                <div className="text-sm">
                  <span className="font-medium text-gray-600">Recipes received:</span>
                  <span className="ml-2">{guest.recipes_received || 0}</span>
                </div>
                {guest.notes && (
                  <div className="text-sm">
                    <span className="font-medium text-gray-600">Notes:</span>
                    <div className="mt-1 text-gray-700">{guest.notes}</div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        
        {/* Save Button - Fixed position in bottom right */}
        <div className="absolute bottom-6 right-6">
          <Button 
            onClick={handleSave}
            disabled={loading}
            className="bg-black text-white hover:bg-gray-800 px-6 py-2 rounded-full disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}