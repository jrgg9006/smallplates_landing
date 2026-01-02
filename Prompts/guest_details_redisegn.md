# Prompt 2A-3: Rediseñar GuestDetailsModal con estilo Wedding

## Contexto

Small Plates es una plataforma donde invitados de boda suben recetas para crear un libro colaborativo. Tenemos un `GuestDetailsModal` existente que está desactualizado y no sigue la nueva marca wedding.

**Objetivo:** Rediseñar el modal para que sea limpio, simple, y alineado a la marca Margot Cole. Debe verse idéntico a los otros modales nuevos como `AddGuestModal`.

---

## Archivo a modificar

```
components/profile/guests/GuestDetailsModal.tsx
```

**Acción:** Reemplazar completamente el contenido del archivo con el nuevo diseño.

---

## Principios de diseño

1. **Simple** — Sin tabs, todo en una vista
2. **Limpio** — Solo lo esencial, nada más
3. **Wedding brand** — Colores y tipografía de marca
4. **Consistente** — Mismo estilo que `AddGuestModal`

---

## Estructura visual

```
┌─────────────────────────────────────────┐
│ Guest Details                        ✕  │
├─────────────────────────────────────────┤
│                                         │
│  María López                            │
│  ✅ 1 recipe                            │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  First Name *        Last Name          │
│  [María         ]    [López        ]    │
│                                         │
│  Printed Name                           │
│  [                                 ]    │
│  How this name appears in the book      │
│                                         │
│  Email                                  │
│  [maria@gmail.com                  ]    │
│                                         │
│  Phone                                  │
│  [+52 555 123 4567                 ]    │
│                                         │
├─────────────────────────────────────────┤
│  Recipes                                │
│  • Pasta de la abuela                   │
│  • Guacamole especial                   │
│                                         │
├─────────────────────────────────────────┤
│                     [Cancel]  [Save]    │
└─────────────────────────────────────────┘
```

---

## Código completo

```tsx
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
import { Check, Clock } from "lucide-react";

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

  // Status display
  const recipeCount = guest.recipes_received || 0;
  const hasRecipes = recipeCount > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-semibold text-[hsl(var(--brand-charcoal))]">
            Guest Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          
          {/* Guest Header - Name + Status */}
          <div className="flex items-center justify-between pb-4 border-b border-[hsl(var(--brand-sand))]">
            <div>
              <h3 className="text-lg font-medium text-[hsl(var(--brand-charcoal))]">
                {guest.printed_name || `${guest.first_name} ${guest.last_name || ''}`.trim()}
              </h3>
            </div>
            <div className={`flex items-center gap-1.5 text-sm ${hasRecipes ? 'text-green-600' : 'text-[hsl(var(--brand-warm-gray))]'}`}>
              {hasRecipes ? (
                <>
                  <Check size={16} />
                  <span>{recipeCount} {recipeCount === 1 ? 'recipe' : 'recipes'}</span>
                </>
              ) : (
                <>
                  <Clock size={16} />
                  <span>Pending</span>
                </>
              )}
            </div>
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

## Colores de marca usados

| Variable | Color | Uso |
|----------|-------|-----|
| `--brand-charcoal` | #2D2D2D | Texto principal, botón Save |
| `--brand-warm-gray` | #9A9590 | Labels, texto secundario |
| `--brand-sand` | #E8E0D5 | Bordes, dividers |
| `--brand-honey` | #D4A854 | Focus states, bullet points |
| `--brand-warm-white` | #FAF7F2 | Hover backgrounds |

---

## Integración con GuestNavigationSheet

Después de crear el modal, hay que conectarlo al `GuestNavigationSheet` para que funcione el click en un guest.

### Modificar GuestNavigationSheet.tsx

Agregar el estado y el modal:

```tsx
// Al inicio, agregar import
import { GuestDetailsModal } from "./GuestDetailsModal";

// Dentro del componente, agregar estado
const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

// Modificar handleGuestClick
const handleGuestClick = (guest: Guest) => {
  setSelectedGuest(guest);
  setIsDetailsModalOpen(true);
};

// Al final del componente, antes del cierre del Sheet, agregar:
<GuestDetailsModal
  guest={selectedGuest}
  isOpen={isDetailsModalOpen}
  onClose={() => {
    setIsDetailsModalOpen(false);
    setSelectedGuest(null);
  }}
  onGuestUpdated={() => {
    loadGuests(); // Refresh the list
  }}
/>
```

---

## Cambios vs versión anterior

| Aspecto | Antes | Ahora |
|---------|-------|-------|
| **Tabs** | 3 tabs (Guest Info, Contact, Recipes) | Sin tabs, todo en una vista |
| **Avatar** | Imagen 96x96 | Removido |
| **Colores** | Grays genéricos | Brand colors |
| **Tipo de modal** | Sheet (slide from right) | Dialog (centered) |
| **Recetas** | Fecha, fuente, muchos detalles | Solo nombre |
| **Complejidad** | 300+ líneas | ~180 líneas |

---

## Verificación post-implementación

1. [ ] El modal abre al hacer click en un guest
2. [ ] Muestra el nombre y status del guest
3. [ ] Los campos son editables
4. [ ] El botón Save actualiza el guest
5. [ ] Las recetas se muestran solo por nombre (en italic serif)
6. [ ] Los colores son de la marca (honey, charcoal, sand, etc.)
7. [ ] El estilo es consistente con AddGuestModal
8. [ ] Funciona en mobile y desktop
9. [ ] El GuestNavigationSheet se actualiza después de guardar