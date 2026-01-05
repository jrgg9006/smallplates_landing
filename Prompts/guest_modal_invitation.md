# Prompt 2B-4: Actualizar GuestDetailsModal con controles de invitación

## Contexto

Small Plates tiene un sistema de emails automatizados para invitar guests a subir recetas. El Captain necesita poder controlar este sistema desde el modal de detalles del guest.

**Objetivo:** Agregar una sección de "Invitation Status" con botones para Invite/Pause/Resume/Retry/Mark as Submitted.

---

## Archivo a modificar

```
components/profile/guests/GuestDetailsModal.tsx
```

---

## Lo que hay que agregar

1. **Sección de Invitation Status** — Mostrar el estado actual y progreso (ej: "Email 2/4")
2. **Botones de acción** — Según el estado del guest
3. **Importar funciones** — Las nuevas funciones de `lib/supabase/guests.ts`

---

## Código completo actualizado

```tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Guest } from "@/lib/types/database";
import { 
  updateGuest,
  startGuestInvitation,
  pauseGuestInvitation,
  resumeGuestInvitation,
  retryGuestInvitation,
  markGuestAsSubmitted,
} from "@/lib/supabase/guests";
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
import { Mail, Pause, Play, RotateCcw, Check, Clock, Send, CheckCircle, XCircle } from "lucide-react";

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
  const [invitationLoading, setInvitationLoading] = useState(false);
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

  // Invitation action handlers
  const handleInvite = async () => {
    if (!guest) return;
    
    // Check if guest has a valid email
    if (!guest.email || guest.email.startsWith('NO_EMAIL_')) {
      setError('Please add an email address before sending invitations.');
      return;
    }

    setInvitationLoading(true);
    setError(null);

    try {
      const { error } = await startGuestInvitation(guest.id);
      if (error) {
        setError(error);
      } else {
        onGuestUpdated?.();
      }
    } catch (err) {
      setError('Failed to start invitation sequence.');
      console.error('Error starting invitation:', err);
    } finally {
      setInvitationLoading(false);
    }
  };

  const handlePause = async () => {
    if (!guest) return;
    setInvitationLoading(true);
    setError(null);

    try {
      const { error } = await pauseGuestInvitation(guest.id);
      if (error) {
        setError(error);
      } else {
        onGuestUpdated?.();
      }
    } catch (err) {
      setError('Failed to pause invitation sequence.');
      console.error('Error pausing invitation:', err);
    } finally {
      setInvitationLoading(false);
    }
  };

  const handleResume = async () => {
    if (!guest) return;
    setInvitationLoading(true);
    setError(null);

    try {
      const { error } = await resumeGuestInvitation(guest.id);
      if (error) {
        setError(error);
      } else {
        onGuestUpdated?.();
      }
    } catch (err) {
      setError('Failed to resume invitation sequence.');
      console.error('Error resuming invitation:', err);
    } finally {
      setInvitationLoading(false);
    }
  };

  const handleRetry = async () => {
    if (!guest) return;
    setInvitationLoading(true);
    setError(null);

    try {
      const { error } = await retryGuestInvitation(guest.id);
      if (error) {
        setError(error);
      } else {
        onGuestUpdated?.();
      }
    } catch (err) {
      setError('Failed to retry invitation sequence.');
      console.error('Error retrying invitation:', err);
    } finally {
      setInvitationLoading(false);
    }
  };

  const handleMarkAsSubmitted = async () => {
    if (!guest) return;
    setInvitationLoading(true);
    setError(null);

    try {
      const { error } = await markGuestAsSubmitted(guest.id);
      if (error) {
        setError(error);
      } else {
        onGuestUpdated?.();
      }
    } catch (err) {
      setError('Failed to mark as submitted.');
      console.error('Error marking as submitted:', err);
    } finally {
      setInvitationLoading(false);
    }
  };

  // Get invitation status display
  const getInvitationStatusDisplay = () => {
    if (!guest) return null;

    const status = guest.status;
    const emailsSent = guest.emails_sent_count || 0;

    switch (status) {
      case 'pending':
        return {
          label: 'Not invited yet',
          sublabel: 'Click "Invite" to start the email sequence',
          icon: <Clock size={16} className="text-[hsl(var(--brand-warm-gray))]" />,
          color: 'text-[hsl(var(--brand-warm-gray))]',
          bgColor: 'bg-gray-50',
        };
      case 'invited':
        return {
          label: 'Invitation active',
          sublabel: `Email ${emailsSent}/4 sent`,
          icon: <Send size={16} className="text-[hsl(var(--brand-honey))]" />,
          color: 'text-[hsl(var(--brand-honey))]',
          bgColor: 'bg-amber-50',
        };
      case 'paused':
        return {
          label: 'Paused',
          sublabel: `Email ${emailsSent}/4 sent • Sequence paused`,
          icon: <Pause size={16} className="text-orange-500" />,
          color: 'text-orange-500',
          bgColor: 'bg-orange-50',
        };
      case 'completed':
        return {
          label: 'No response',
          sublabel: 'All 4 emails sent, no recipe received',
          icon: <XCircle size={16} className="text-[hsl(var(--brand-warm-gray))]" />,
          color: 'text-[hsl(var(--brand-warm-gray))]',
          bgColor: 'bg-gray-50',
        };
      case 'submitted':
        return {
          label: 'Recipe received',
          sublabel: 'This guest has submitted their recipe',
          icon: <CheckCircle size={16} className="text-green-600" />,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
        };
      default:
        return {
          label: 'Unknown',
          sublabel: '',
          icon: <Clock size={16} />,
          color: 'text-gray-500',
          bgColor: 'bg-gray-50',
        };
    }
  };

  if (!guest) return null;

  const statusDisplay = getInvitationStatusDisplay();
  const hasValidEmail = guest.email && !guest.email.startsWith('NO_EMAIL_');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-semibold text-[hsl(var(--brand-charcoal))]">
            Guest Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">

          {/* Invitation Status Section */}
          <div className={`p-4 rounded-lg ${statusDisplay?.bgColor}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {statusDisplay?.icon}
                <div>
                  <p className={`font-medium ${statusDisplay?.color}`}>
                    {statusDisplay?.label}
                  </p>
                  <p className="text-xs text-[hsl(var(--brand-warm-gray))] mt-0.5">
                    {statusDisplay?.sublabel}
                  </p>
                </div>
              </div>
            </div>

            {/* Invitation Action Buttons */}
            <div className="flex flex-wrap gap-2 mt-4">
              {/* Pending: Show Invite button */}
              {guest.status === 'pending' && (
                <Button
                  size="sm"
                  onClick={handleInvite}
                  disabled={invitationLoading || !hasValidEmail}
                  className="bg-[hsl(var(--brand-charcoal))] text-white hover:bg-[hsl(var(--brand-charcoal))]/90"
                >
                  <Mail size={14} className="mr-1.5" />
                  {invitationLoading ? 'Starting...' : 'Invite'}
                </Button>
              )}

              {/* Invited: Show Pause and Mark as Submitted */}
              {guest.status === 'invited' && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handlePause}
                    disabled={invitationLoading}
                    className="border-[hsl(var(--brand-sand))]"
                  >
                    <Pause size={14} className="mr-1.5" />
                    {invitationLoading ? 'Pausing...' : 'Pause'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleMarkAsSubmitted}
                    disabled={invitationLoading}
                    className="border-green-200 text-green-600 hover:bg-green-50"
                  >
                    <Check size={14} className="mr-1.5" />
                    Mark as Submitted
                  </Button>
                </>
              )}

              {/* Paused: Show Resume */}
              {guest.status === 'paused' && (
                <>
                  <Button
                    size="sm"
                    onClick={handleResume}
                    disabled={invitationLoading}
                    className="bg-[hsl(var(--brand-charcoal))] text-white hover:bg-[hsl(var(--brand-charcoal))]/90"
                  >
                    <Play size={14} className="mr-1.5" />
                    {invitationLoading ? 'Resuming...' : 'Resume'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleMarkAsSubmitted}
                    disabled={invitationLoading}
                    className="border-green-200 text-green-600 hover:bg-green-50"
                  >
                    <Check size={14} className="mr-1.5" />
                    Mark as Submitted
                  </Button>
                </>
              )}

              {/* Completed: Show Retry */}
              {guest.status === 'completed' && (
                <>
                  <Button
                    size="sm"
                    onClick={handleRetry}
                    disabled={invitationLoading}
                    className="bg-[hsl(var(--brand-charcoal))] text-white hover:bg-[hsl(var(--brand-charcoal))]/90"
                  >
                    <RotateCcw size={14} className="mr-1.5" />
                    {invitationLoading ? 'Retrying...' : 'Retry'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleMarkAsSubmitted}
                    disabled={invitationLoading}
                    className="border-green-200 text-green-600 hover:bg-green-50"
                  >
                    <Check size={14} className="mr-1.5" />
                    Mark as Submitted
                  </Button>
                </>
              )}

              {/* Submitted: No action buttons needed */}
            </div>

            {/* Warning if no email */}
            {!hasValidEmail && guest.status === 'pending' && (
              <p className="text-xs text-amber-600 mt-3">
                ⚠️ Add an email address to enable invitations.
              </p>
            )}
          </div>
          
          {/* Form Fields */}
          <div className="space-y-4">
            
            {/* Name Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="text-sm font-medium text-[hsl(var(--brand-warm-gray))]">
                  First Name *
                </Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="mt-1 border-[hsl(var(--brand-sand))] focus:border-[hsl(var(--brand-honey))] focus:ring-[hsl(var(--brand-honey))]"
                  placeholder="First Name"
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-sm font-medium text-[hsl(var(--brand-warm-gray))]">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="mt-1 border-[hsl(var(--brand-sand))] focus:border-[hsl(var(--brand-honey))] focus:ring-[hsl(var(--brand-honey))]"
                  placeholder="Last Name"
                />
              </div>
            </div>

            {/* Printed Name */}
            <div>
              <Label htmlFor="printedName" className="text-sm font-medium text-[hsl(var(--brand-warm-gray))]">
                Printed Name
              </Label>
              <Input
                id="printedName"
                value={printedName}
                onChange={(e) => setPrintedName(e.target.value)}
                className="mt-1 border-[hsl(var(--brand-sand))] focus:border-[hsl(var(--brand-honey))] focus:ring-[hsl(var(--brand-honey))]"
                placeholder="How this name appears in the book"
              />
              <p className="text-xs text-[hsl(var(--brand-warm-gray))] mt-1">
                Leave empty to use first and last name.
              </p>
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-[hsl(var(--brand-warm-gray))]">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 border-[hsl(var(--brand-sand))] focus:border-[hsl(var(--brand-honey))] focus:ring-[hsl(var(--brand-honey))]"
                placeholder="Email address"
              />
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="phone" className="text-sm font-medium text-[hsl(var(--brand-warm-gray))]">
                Phone
              </Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 border-[hsl(var(--brand-sand))] focus:border-[hsl(var(--brand-honey))] focus:ring-[hsl(var(--brand-honey))]"
                placeholder="Phone number"
              />
            </div>
          </div>

          {/* Recipes Section - Only show if has recipes */}
          {recipes.length > 0 && (
            <div className="pt-4 border-t border-[hsl(var(--brand-sand))]">
              <Label className="text-sm font-medium text-[hsl(var(--brand-warm-gray))]">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Resumen de cambios

### Nuevos imports
```typescript
import { 
  updateGuest,
  startGuestInvitation,
  pauseGuestInvitation,
  resumeGuestInvitation,
  retryGuestInvitation,
  markGuestAsSubmitted,
} from "@/lib/supabase/guests";

import { Mail, Pause, Play, RotateCcw, Check, Clock, Send, CheckCircle, XCircle } from "lucide-react";
```

### Nueva sección: Invitation Status
- Muestra el estado actual con icono y color
- Muestra progreso: "Email 2/4 sent"
- Botones de acción según el estado

### Lógica de botones

| Status | Botones visibles |
|--------|-----------------|
| `pending` | **Invite** |
| `invited` | **Pause**, **Mark as Submitted** |
| `paused` | **Resume**, **Mark as Submitted** |
| `completed` | **Retry**, **Mark as Submitted** |
| `submitted` | Ninguno (ya terminó) |

### Validación de email
- Si el guest no tiene email, el botón "Invite" está deshabilitado
- Muestra warning: "Add an email address to enable invitations"

---

## Preview visual

### Estado: Pending
```
┌─────────────────────────────────────┐
│ 🕐 Not invited yet                  │
│    Click "Invite" to start...       │
│                                     │
│    [Invite]                         │
└─────────────────────────────────────┘
```

### Estado: Invited
```
┌─────────────────────────────────────┐
│ 📨 Invitation active                │
│    Email 2/4 sent                   │
│                                     │
│    [Pause]  [Mark as Submitted]     │
└─────────────────────────────────────┘
```

### Estado: Completed
```
┌─────────────────────────────────────┐
│ ⭕ No response                      │
│    All 4 emails sent, no recipe     │
│                                     │
│    [Retry]  [Mark as Submitted]     │
└─────────────────────────────────────┘
```

---

## Verificación post-implementación

1. [ ] El status se muestra correctamente según el estado del guest
2. [ ] El progreso "Email X/4" se muestra para guests invited
3. [ ] Botón "Invite" solo aparece para pending
4. [ ] Botón "Invite" está disabled si no hay email
5. [ ] Botón "Pause" funciona y cambia estado a paused
6. [ ] Botón "Resume" funciona y cambia estado a invited
7. [ ] Botón "Retry" reinicia la secuencia desde email 1
8. [ ] Botón "Mark as Submitted" cambia estado a submitted
9. [ ] Los colores son consistentes con la marca
10. [ ] El modal se actualiza después de cada acción (onGuestUpdated)