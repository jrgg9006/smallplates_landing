# Prompt 2A-2: Crear GuestNavigationSheet (Panel lateral de Guests)

## Contexto

Small Plates es una plataforma donde invitados de boda suben recetas para crear un libro colaborativo. Acabamos de actualizar el backend para soportar `group_id` en guests.

**Objetivo:** Crear un panel lateral (Sheet) para ver y gestionar guests, similar al `GroupNavigationSheet` existente que muestra "Your Books".

---

## Referencia: Componente existente

El componente `GroupNavigationSheet.tsx` en `components/profile/groups/` es la referencia de estilo y estructura. El nuevo componente debe seguir el mismo patrón visual y de código.

---

## Archivo a crear

```
components/profile/guests/GuestNavigationSheet.tsx
```

---

## Especificación del componente

### Props

```typescript
interface GuestNavigationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string; // Required - qué grupo estamos viendo
  groupName?: string; // Opcional - para mostrar en el header
  onGuestSelect?: (guest: Guest) => void; // Callback cuando se selecciona un guest
  onAddGuest?: () => void; // Callback para abrir modal de agregar guest
}
```

### Estructura visual

```
┌─────────────────────────────────────┐
│ Guests                           ✕  │
│ {groupName}                         │
├─────────────────────────────────────┤
│ 🔍 Search guests...                 │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 👤 María López                  │ │
│ │    ✅ 1 recipe                  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 👤 Juan García                  │ │
│ │    ⏳ Pending                   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 👤 Rosa Méndez                  │ │
│ │    ⏳ Pending                   │ │
│ └─────────────────────────────────┘ │
│                                     │
├─────────────────────────────────────┤
│    ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐    │
│    │  + Add Guest              │    │
│    └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘    │
└─────────────────────────────────────┘
```

---

## Código completo

```tsx
"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Search, Plus, User, Check, Clock } from "lucide-react";
import { getGuestsByGroup } from "@/lib/supabase/guests";
import type { Guest } from "@/lib/types/database";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";

interface GuestNavigationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  groupName?: string;
  onGuestSelect?: (guest: Guest) => void;
  onAddGuest?: () => void;
}

export function GuestNavigationSheet({ 
  isOpen, 
  onClose, 
  groupId,
  groupName,
  onGuestSelect,
  onAddGuest 
}: GuestNavigationSheetProps) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  // Responsive detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load guests when sheet opens
  useEffect(() => {
    if (isOpen && groupId) {
      loadGuests();
    }
  }, [isOpen, groupId]);

  const loadGuests = async () => {
    setLoading(true);
    const { data, error } = await getGuestsByGroup(groupId);
    if (!error && data) {
      setGuests(data);
    }
    setLoading(false);
  };

  // Filter guests by search query
  const filteredGuests = useMemo(() => {
    if (!searchQuery.trim()) return guests;
    
    const query = searchQuery.toLowerCase();
    return guests.filter(guest => 
      guest.first_name?.toLowerCase().includes(query) ||
      guest.last_name?.toLowerCase().includes(query) ||
      guest.email?.toLowerCase().includes(query)
    );
  }, [guests, searchQuery]);

  // Sort guests: submitted first, then pending, alphabetically within each group
  const sortedGuests = useMemo(() => {
    return [...filteredGuests].sort((a, b) => {
      // First sort by status (submitted first)
      const aSubmitted = (a.recipes_received || 0) > 0;
      const bSubmitted = (b.recipes_received || 0) > 0;
      
      if (aSubmitted !== bSubmitted) {
        return aSubmitted ? -1 : 1;
      }
      
      // Then sort alphabetically by name
      const aName = `${a.first_name} ${a.last_name || ''}`.trim().toLowerCase();
      const bName = `${b.first_name} ${b.last_name || ''}`.trim().toLowerCase();
      return aName.localeCompare(bName);
    });
  }, [filteredGuests]);

  // Stats
  const stats = useMemo(() => {
    const total = guests.length;
    const submitted = guests.filter(g => (g.recipes_received || 0) > 0).length;
    const pending = total - submitted;
    return { total, submitted, pending };
  }, [guests]);

  const handleGuestClick = (guest: Guest) => {
    onGuestSelect?.(guest);
  };

  const getStatusDisplay = (guest: Guest) => {
    const recipeCount = guest.recipes_received || 0;
    if (recipeCount > 0) {
      return {
        icon: <Check size={14} className="text-green-600" />,
        text: recipeCount === 1 ? "1 recipe" : `${recipeCount} recipes`,
        className: "text-green-600"
      };
    }
    return {
      icon: <Clock size={14} className="text-[hsl(var(--brand-warm-gray))]" />,
      text: "Pending",
      className: "text-[hsl(var(--brand-warm-gray))]"
    };
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side={isMobile ? "bottom" : "left"} 
        className={isMobile 
          ? "!h-[85vh] !max-h-[85vh] rounded-t-[20px] p-0 overflow-hidden bg-white" 
          : "w-[85%] sm:w-[400px] p-0 overflow-hidden bg-white [&_button[data-radix-dialog-close]]:focus:outline-none [&_button[data-radix-dialog-close]]:focus:ring-0 [&_button[data-radix-dialog-close]]:focus:ring-offset-0"
        }
      >
        {/* Mobile visual handle */}
        {isMobile && <div className="mx-auto mt-4 h-1.5 w-12 rounded-full bg-gray-300" />}

        <div className={`h-full flex flex-col ${isMobile ? 'pt-2' : ''}`}>
          {/* Header */}
          <SheetHeader className={`${isMobile ? 'px-6 py-4' : 'px-8 py-6'} border-b border-gray-100`}>
            <SheetTitle className="font-serif text-2xl font-semibold text-[hsl(var(--brand-charcoal))]">
              Guests
            </SheetTitle>
            {groupName && (
              <p className="text-sm text-[hsl(var(--brand-warm-gray))] mt-1">
                {groupName}
              </p>
            )}
          </SheetHeader>

          {/* Stats bar */}
          {!loading && guests.length > 0 && (
            <div className={`${isMobile ? 'px-6 py-3' : 'px-8 py-4'} border-b border-gray-100 bg-[hsl(var(--brand-warm-white))]`}>
              <div className="flex gap-4 text-sm">
                <span className="text-[hsl(var(--brand-charcoal))]">
                  <strong>{stats.total}</strong> guests
                </span>
                <span className="text-green-600">
                  <strong>{stats.submitted}</strong> submitted
                </span>
                <span className="text-[hsl(var(--brand-warm-gray))]">
                  <strong>{stats.pending}</strong> pending
                </span>
              </div>
            </div>
          )}

          {/* Search */}
          <div className={`${isMobile ? 'px-4 py-3' : 'px-6 py-4'} border-b border-gray-100`}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                type="text"
                placeholder="Search guests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-50 border-gray-200 focus:border-[hsl(var(--brand-honey))] focus:ring-[hsl(var(--brand-honey))]"
              />
            </div>
          </div>
          
          {/* Content */}
          <div className={`flex-1 overflow-y-auto ${isMobile ? 'px-4 py-4' : 'p-6'}`}>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-16 bg-gray-100 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            ) : guests.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <User className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm">No guests yet.</p>
                <p className="text-gray-400 text-sm mt-1">Add guests to start collecting recipes.</p>
              </div>
            ) : sortedGuests.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-500 text-sm">No guests match "{searchQuery}"</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sortedGuests.map((guest) => {
                  const status = getStatusDisplay(guest);
                  return (
                    <button
                      key={guest.id}
                      onClick={() => handleGuestClick(guest)}
                      className="w-full p-4 rounded-lg border border-gray-100 bg-white
                                 hover:border-[hsl(var(--brand-honey))] hover:shadow-sm
                                 transition-all duration-200 text-left group"
                    >
                      <div className="flex items-center gap-3">
                        {/* Avatar placeholder */}
                        <div className="w-10 h-10 rounded-full bg-[hsl(var(--brand-warm-white))] 
                                        flex items-center justify-center flex-shrink-0
                                        group-hover:bg-[hsl(var(--brand-honey))]/10 transition-colors">
                          <User size={18} className="text-[hsl(var(--brand-warm-gray))]" />
                        </div>
                        
                        {/* Guest info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[hsl(var(--brand-charcoal))] truncate">
                            {guest.first_name} {guest.last_name || ''}
                          </p>
                          <div className={`flex items-center gap-1.5 text-sm ${status.className}`}>
                            {status.icon}
                            <span>{status.text}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer - Add Guest Button */}
          <div className={`${isMobile ? 'px-4 py-4' : 'p-6'} border-t border-gray-100`}>
            <button
              onClick={() => {
                onAddGuest?.();
              }}
              className="w-full py-3 border-2 border-dashed border-[hsl(var(--brand-warm-gray))]/30 rounded-lg 
                         flex items-center justify-center gap-2 text-[hsl(var(--brand-warm-gray))] 
                         hover:border-[hsl(var(--brand-honey))] hover:text-[hsl(var(--brand-honey))] transition-colors"
            >
              <Plus size={20} />
              <span className="font-medium">Add Guest</span>
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

---

## Integración en la página del grupo

Después de crear el componente, hay que integrarlo en la página del grupo. Esto requiere:

### 1. Agregar botón "Guests" en la barra de acciones

En el archivo donde están los botones `[Collect Recipes] [Add Your Own] [Add Guest] [Captains] [...]`, agregar un botón "Guests":

```tsx
<Button
  variant="outline"
  onClick={() => setIsGuestSheetOpen(true)}
  className="..."
>
  Guests
</Button>
```

### 2. Agregar estado y componente

```tsx
const [isGuestSheetOpen, setIsGuestSheetOpen] = useState(false);

// En el render:
<GuestNavigationSheet
  isOpen={isGuestSheetOpen}
  onClose={() => setIsGuestSheetOpen(false)}
  groupId={group.id}
  groupName={group.name}
  onGuestSelect={(guest) => {
    // Abrir modal de detalle del guest
    setSelectedGuest(guest);
    setIsGuestDetailsModalOpen(true);
  }}
  onAddGuest={() => {
    setIsGuestSheetOpen(false);
    setIsAddGuestModalOpen(true);
  }}
/>
```

---

## Archivos a modificar para integración

| Archivo | Cambio |
|---------|--------|
| `app/(platform)/profile/groups/[groupId]/page.tsx` | Agregar estado, botón, y componente GuestNavigationSheet |

**Nota:** Buscar el archivo correcto donde se renderizan los botones de acción del grupo. Puede estar en `page.tsx` o en un componente separado como `GroupHeader.tsx` o `GroupActionBar.tsx`.

---

## Verificación post-implementación

1. [ ] El panel abre desde la derecha (desktop) o desde abajo (mobile)
2. [ ] Muestra la lista de guests del grupo actual
3. [ ] La búsqueda filtra correctamente
4. [ ] Los guests con recetas aparecen primero
5. [ ] El status (✅ recipe / ⏳ pending) se muestra correctamente
6. [ ] Las stats (total, submitted, pending) son correctas
7. [ ] El botón "Add Guest" dispara el callback
8. [ ] Click en un guest dispara el callback
9. [ ] El estilo es consistente con GroupNavigationSheet
10. [ ] Funciona en mobile y desktop

---

## Notas de diseño

- **Colores de marca:**
  - Charcoal: `hsl(var(--brand-charcoal))` - texto principal
  - Warm Gray: `hsl(var(--brand-warm-gray))` - texto secundario
  - Honey: `hsl(var(--brand-honey))` - accents, hover
  - Warm White: `hsl(var(--brand-warm-white))` - backgrounds

- **Consistencia con GroupNavigationSheet:**
  - Mismo padding y spacing
  - Misma tipografía (font-serif para títulos)
  - Mismos efectos de hover
  - Misma estructura de Sheet (header, content, footer)