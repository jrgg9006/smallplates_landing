"use client";

import React, { useState } from "react";
import { Guest } from "@/lib/types/database";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface SendMessageModalProps {
  guest: Guest | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SendMessageModal({ guest, isOpen, onClose }: SendMessageModalProps) {
  const [message, setMessage] = useState('Hi! I would love to have your recipe for our Small Plates cookbook. Could you please share it with us? Thank you!');
  const [sendCopyToMe, setSendCopyToMe] = useState(false);

  const handleSend = () => {
    if (!guest) return;
    
    // TODO: Implement send message functionality
    console.log('Sending message to:', `${guest.first_name} ${guest.last_name || ''}`.trim());
    console.log('Email:', guest.email);
    console.log('Message:', message);
    console.log('Send copy to me:', sendCopyToMe);
    
    // Here you would typically call an API to send the email
    
    // Reset and close
    setMessage('Hi! I would love to have your recipe for our Small Plates cookbook. Could you please share it with us? Thank you!');
    setSendCopyToMe(false);
    onClose();
  };

  if (!guest) return null;

  const handleClose = (open: boolean) => {
    if (!open) {
      // Modal is being closed
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl fixed top-[15%] left-[50%] translate-x-[-50%] translate-y-0 z-[60]">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-semibold mb-4">Send Message</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 pb-20" onClick={(e) => e.stopPropagation()}>
          <p className="text-gray-600 text-sm">
            We'll send the note below to your guest.
          </p>

          {/* Email Details */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-600 w-16">FROM</span>
              <span className="text-sm text-gray-800">Your Name (via Small Plates)</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-600 w-16">TO</span>
              <span className="text-sm text-gray-800">{`${guest.first_name} ${guest.last_name || ''}`.trim()} ({guest.email})</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-600 w-16">SUBJECT</span>
              <span className="text-sm text-gray-800">Recipe Request for Small Plates Cookbook</span>
            </div>
          </div>

          {/* Message Input */}
          <div>
            <Label htmlFor="message" className="text-sm font-medium text-gray-600">MESSAGE</Label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1 w-full min-h-[120px] px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-vertical"
              placeholder="Write your message here..."
            />
            <div className="mt-1 text-xs text-gray-500 text-right">
              {message.length}/1000
            </div>
          </div>

          {/* Send copy to me checkbox */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="sendCopy"
              checked={sendCopyToMe}
              onChange={(e) => setSendCopyToMe(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-black focus:ring-2 focus:ring-black focus:ring-offset-2"
            />
            <Label htmlFor="sendCopy" className="text-sm text-gray-600">
              Send a copy to me
            </Label>
          </div>
        </div>

        {/* Send Button - Fixed position in bottom right */}
        <div className="absolute bottom-6 right-6">
          <Button 
            onClick={handleSend}
            className="bg-black text-white hover:bg-gray-800 px-6 py-2 rounded-full"
          >
            Send Message
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}