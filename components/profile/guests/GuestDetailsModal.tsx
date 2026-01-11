"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Guest } from "@/lib/types/database";
import { updateGuest } from "@/lib/supabase/guests";
import { getRecipesByGuest } from "@/lib/supabase/recipes";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface GuestDetailsModalProps {
  guest: Guest | null;
  isOpen: boolean;
  onClose: () => void;
  onGuestUpdated?: () => void;
}

export function GuestDetailsModal({ 
  guest, 
  isOpen, 
  onClose, 
  onGuestUpdated 
}: GuestDetailsModalProps) {
  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [printedName, setPrintedName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recipes, setRecipes] = useState<any[]>([]);

  // Fetch recipes for this guest
  const fetchRecipes = useCallback(async () => {
    if (!guest) return;
    
    try {
      const { data, error } = await getRecipesByGuest(guest.id);
      if (!error && data) {
        setRecipes(data);
      }
    } catch (err) {
      console.error('Error fetching recipes:', err);
    }
  }, [guest]);

  // Reset form when guest changes or modal opens
  useEffect(() => {
    if (guest && isOpen) {
      setFirstName(guest.first_name || '');
      setLastName(guest.last_name || '');
      setPrintedName(guest.printed_name || '');
      setEmail(guest.email || '');
      setPhone(guest.phone || '');
      setError(null);
      fetchRecipes();
    }
  }, [guest, isOpen, fetchRecipes]);

  // Handle save
  const handleSave = async () => {
    if (!guest) return;
    
    if (!firstName.trim()) {
      setError('First name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const updates = {
        first_name: firstName.trim(),
        last_name: lastName.trim() || '',
        printed_name: printedName.trim() || null,
        email: email.trim() || '',
        phone: phone.trim() || null,
      };

      const { error } = await updateGuest(guest.id, updates);

      if (error) {
        setError(error);
        setLoading(false);
        return;
      }

      onClose();
      onGuestUpdated?.();

    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error('Error updating guest:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!guest) return null;

  const isSelf = guest.is_self === true;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-semibold text-[hsl(var(--brand-charcoal))]">
            {isSelf ? 'Your Profile' : 'Guest Details'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">

          {/* Self guest notice */}
          {isSelf && (
            <div className="bg-[hsl(var(--brand-warm-white))] border border-[hsl(var(--brand-sand))] rounded-md p-3">
              <p className="text-sm text-[hsl(var(--brand-charcoal))]">
                To edit your personal information, go to{' '}
                <Link
                  href="/profile/account"
                  className="text-[hsl(var(--brand-honey))] hover:underline font-medium"
                  onClick={onClose}
                >
                  Account Settings
                </Link>
              </p>
            </div>
          )}
          
          {/* Form Fields */}
          <div className="space-y-4">
            
            {/* Name Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                  First Name {!isSelf && '*'}
                </Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={isSelf}
                  className="mt-1 border-[hsl(var(--brand-sand))] focus:border-[hsl(var(--brand-honey))] focus:ring-[hsl(var(--brand-honey))] disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="First Name"
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={isSelf}
                  className="mt-1 border-[hsl(var(--brand-sand))] focus:border-[hsl(var(--brand-honey))] focus:ring-[hsl(var(--brand-honey))] disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Last Name"
                />
              </div>
            </div>

            {/* Printed Name */}
            <div>
              <Label htmlFor="printedName" className="text-sm font-medium text-gray-700">
                Printed Name
              </Label>
              <Input
                id="printedName"
                value={printedName}
                onChange={(e) => setPrintedName(e.target.value)}
                disabled={isSelf}
                className="mt-1 border-[hsl(var(--brand-sand))] focus:border-[hsl(var(--brand-honey))] focus:ring-[hsl(var(--brand-honey))] disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="How this name appears in the book"
              />
              {!isSelf && (
                <p className="text-xs text-[hsl(var(--brand-warm-gray))] mt-1">
                  Leave empty to use first and last name.
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSelf}
                className="mt-1 border-[hsl(var(--brand-sand))] focus:border-[hsl(var(--brand-honey))] focus:ring-[hsl(var(--brand-honey))] disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="Email address"
              />
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                Phone
              </Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isSelf}
                className="mt-1 border-[hsl(var(--brand-sand))] focus:border-[hsl(var(--brand-honey))] focus:ring-[hsl(var(--brand-honey))] disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="Phone number"
              />
            </div>
          </div>

          {/* Recipes Section - Only show if has recipes */}
          {recipes.length > 0 && (
            <div className="pt-4 border-t border-[hsl(var(--brand-sand))]">
              <Label className="text-sm font-medium text-gray-700">
                Recipes
              </Label>
              <ul className="mt-2 space-y-1">
                {recipes.map((recipe) => (
                  <li 
                    key={recipe.id} 
                    className="flex items-center gap-2 text-sm text-[hsl(var(--brand-charcoal))]"
                  >
                    <span className="text-[hsl(var(--brand-honey))]">•</span>
                    <span className="font-serif italic">
                      {recipe.recipe_name || 'Untitled Recipe'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          {isSelf ? (
            <Button
              variant="outline"
              onClick={onClose}
              className="border-[hsl(var(--brand-sand))] text-[hsl(var(--brand-charcoal))] hover:bg-[hsl(var(--brand-warm-white))]"
            >
              Close
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="border-[hsl(var(--brand-sand))] text-[hsl(var(--brand-charcoal))] hover:bg-[hsl(var(--brand-warm-white))]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={loading || !firstName.trim()}
                className="bg-[hsl(var(--brand-charcoal))] text-white hover:bg-[hsl(var(--brand-charcoal))]/90"
              >
                {loading ? 'Saving...' : 'Save'}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}