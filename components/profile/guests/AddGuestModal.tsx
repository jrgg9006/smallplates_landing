"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface AddGuestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddGuestModal({ isOpen, onClose }: AddGuestModalProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [hasPlusOne, setHasPlusOne] = useState(false);
  const [plusOneFirstName, setPlusOneFirstName] = useState('');
  const [plusOneLastName, setPlusOneLastName] = useState('');

  const handleSave = () => {
    // TODO: Implement save functionality
    const newGuest = {
      firstName,
      lastName,
      email,
      phone,
      fullName: `${firstName} ${lastName}`.trim(),
      ...(hasPlusOne && {
        plusOne: {
          firstName: plusOneFirstName,
          lastName: plusOneLastName,
          fullName: `${plusOneFirstName} ${plusOneLastName}`.trim()
        }
      })
    };
    
    console.log('Adding new guest:', newGuest);
    
    // Reset form
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setHasPlusOne(false);
    setPlusOneFirstName('');
    setPlusOneLastName('');
    
    onClose();
  };

  const handleAddPlusOne = () => {
    setHasPlusOne(true);
  };

  const handleRemovePlusOne = () => {
    setHasPlusOne(false);
    setPlusOneFirstName('');
    setPlusOneLastName('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl fixed top-[15%] left-[50%] translate-x-[-50%] translate-y-0">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-semibold mb-4">Add Guest</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 pb-20">
          {/* Main Guest Information */}
          <div>
            <h3 className="text-lg font-medium mb-4">Guest Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="text-sm font-medium text-gray-600">First Name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="mt-1"
                  placeholder="First Name"
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-sm font-medium text-gray-600">Last Name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="mt-1"
                  placeholder="Last Name"
                />
              </div>
            </div>
          </div>

          {/* Add Plus One Section */}
          <div>
            {!hasPlusOne ? (
              <button 
                onClick={handleAddPlusOne}
                className="text-sm text-blue-600 hover:underline"
              >
                + Add Plus One
              </button>
            ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Plus One Information</span>
                    <button 
                      onClick={handleRemovePlusOne}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="plusOneFirstName" className="text-sm font-medium text-gray-600">First Name</Label>
                      <Input
                        id="plusOneFirstName"
                        value={plusOneFirstName}
                        onChange={(e) => setPlusOneFirstName(e.target.value)}
                        className="mt-1"
                        placeholder="Plus One First Name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="plusOneLastName" className="text-sm font-medium text-gray-600">Last Name</Label>
                      <Input
                        id="plusOneLastName"
                        value={plusOneLastName}
                        onChange={(e) => setPlusOneLastName(e.target.value)}
                        className="mt-1"
                        placeholder="Plus One Last Name"
                      />
                    </div>
                  </div>
                </div>
              )}
          </div>

          {/* Contact Information */}
          <div className="space-y-3">
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-gray-600">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1"
                  placeholder="Email address"
                />
              </div>
              <div>
                <Label htmlFor="phone" className="text-sm font-medium text-gray-600">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1"
                  placeholder="Phone number"
                />
              </div>
          </div>
        </div>

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