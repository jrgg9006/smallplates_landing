"use client";

import { useState } from 'react';
import { AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface GuestOption {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface AddRecipeFormProps {
  open: boolean;
  groupId: string;
  guests: GuestOption[];
  onClose: () => void;
  onAdded: () => void;
}

export default function AddRecipeForm({ open, groupId, guests, onClose, onAdded }: AddRecipeFormProps) {
  const [guestTab, setGuestTab] = useState<string>('existing');
  const [selectedGuestId, setSelectedGuestId] = useState('');
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const [recipeName, setRecipeName] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [instructions, setInstructions] = useState('');
  const [comments, setComments] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const resetForm = () => {
    setSelectedGuestId('');
    setNewFirstName('');
    setNewLastName('');
    setNewEmail('');
    setRecipeName('');
    setIngredients('');
    setInstructions('');
    setComments('');
    setError(null);
    setSuccess(false);
    setGuestTab('existing');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(false);

    // Validate recipe fields
    if (!recipeName.trim() || !ingredients.trim() || !instructions.trim()) {
      setError('Recipe name, ingredients, and instructions are required');
      return;
    }

    // Validate guest selection
    if (guestTab === 'existing' && !selectedGuestId) {
      setError('Please select a guest');
      return;
    }
    if (guestTab === 'new' && (!newFirstName.trim() || !newLastName.trim())) {
      setError('First name and last name are required for new guests');
      return;
    }

    setSubmitting(true);

    try {
      const payload: Record<string, unknown> = {
        groupId,
        recipe_name: recipeName,
        ingredients,
        instructions,
        comments: comments || null,
      };

      if (guestTab === 'existing') {
        payload.guestId = selectedGuestId;
      } else {
        payload.newGuest = {
          first_name: newFirstName,
          last_name: newLastName,
          email: newEmail || undefined,
        };
      }

      const res = await fetch('/api/v1/admin/content/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create recipe');
      }

      setSuccess(true);
      onAdded();

      // Auto-close after brief success message
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create recipe');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Recipe</DialogTitle>
          <DialogDescription>
            Create a recipe on behalf of a guest
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              Recipe created successfully!
            </div>
          )}

          {/* Guest Selection */}
          <Tabs value={guestTab} onValueChange={setGuestTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="existing">Existing Guest</TabsTrigger>
              <TabsTrigger value="new">New Guest</TabsTrigger>
            </TabsList>

            <TabsContent value="existing" className="mt-3">
              <Label className="text-sm font-medium">Select Guest</Label>
              <Select value={selectedGuestId} onValueChange={setSelectedGuestId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose a guest..." />
                </SelectTrigger>
                <SelectContent>
                  {guests.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.first_name} {g.last_name} ({g.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TabsContent>

            <TabsContent value="new" className="mt-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-medium">First Name *</Label>
                  <Input
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Last Name *</Label>
                  <Input
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Email (optional)</Label>
                <Input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="If known"
                  className="mt-1"
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Recipe Fields */}
          <div className="border-t pt-4 space-y-3">
            <div>
              <Label className="text-sm font-medium">Recipe Name *</Label>
              <Input
                value={recipeName}
                onChange={(e) => setRecipeName(e.target.value)}
                placeholder="e.g., Grandma's Apple Pie"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Ingredients *</Label>
              <textarea
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                rows={5}
                placeholder="List each ingredient on a new line"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-y"
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Instructions *</Label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={6}
                placeholder="Step-by-step instructions"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-y"
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Comments / Story</Label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
                placeholder="Optional personal note or story about the recipe"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-y"
              />
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitting || success}
            className="w-full"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Submit Recipe
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
