# Prompt 2B-4: Actualizar GuestNavigationSheet con acciones de invitación inline

## ⚠️ IMPORTANTE: Solo modificar la sección indicada

Este prompt **SOLO** modifica la función `getStatusDisplay` y el render de cada tarjeta de guest. 

**NO modificar:**
- Header
- Search/Filter
- Footer (Add Guest button)
- Estructura del Sheet
- Estados de loading/empty
- Lógica de filtrado y ordenamiento

---

## Archivo a modificar

```
components/profile/guests/GuestNavigationSheet.tsx
```

---

## Cambios requeridos

### 1. Agregar imports

Agregar estos imports al inicio del archivo:

```typescript
import { Mail, Pause, Play, RotateCcw, Edit3, Send, CheckCircle } from "lucide-react";
import { 
  startGuestInvitation,
  pauseGuestInvitation,
  resumeGuestInvitation,
  retryGuestInvitation,
} from "@/lib/supabase/guests";
```

### 2. Agregar estado de hover

Dentro del componente, agregar:

```typescript
const [hoveredGuestId, setHoveredGuestId] = useState<string | null>(null);
const [actionLoading, setActionLoading] = useState<string | null>(null);
```

### 3. Agregar handlers para acciones

```typescript
const handleInviteAction = async (guest: Guest, action: string) => {
  setActionLoading(guest.id);
  
  try {
    let result;
    switch (action) {
      case 'invite':
        result = await startGuestInvitation(guest.id);
        break;
      case 'pause':
        result = await pauseGuestInvitation(guest.id);
        break;
      case 'resume':
        result = await resumeGuestInvitation(guest.id);
        break;
      case 'retry':
        result = await retryGuestInvitation(guest.id);
        break;
      case 'edit':
        onGuestSelect?.(guest);
        setActionLoading(null);
        return;
    }
    
    if (result?.error) {
      console.error('Action failed:', result.error);
    } else {
      await loadGuests(); // Refresh the list
    }
  } catch (err) {
    console.error('Action error:', err);
  } finally {
    setActionLoading(null);
  }
};
```

### 4. Reemplazar la función `getStatusDisplay`

Reemplazar completamente la función `getStatusDisplay` con esta nueva versión:

```typescript
const getGuestDisplay = (guest: Guest, isHovered: boolean) => {
  const hasRecipe = (guest.recipes_received || 0) > 0;
  const hasEmail = guest.email && guest.email.length > 0 && !guest.email.startsWith('NO_EMAIL_');
  const emailsSent = guest.emails_sent_count || 0;
  
  // ✅ Already has recipe - show success badge (no action needed)
  if (hasRecipe) {
    const recipeCount = guest.recipes_received || 0;
    return {
      type: 'badge' as const,
      icon: <CheckCircle size={14} />,
      label: recipeCount === 1 ? '1 recipe' : `${recipeCount} recipes`,
      colorClass: 'text-[#6B7B5E]', // olive
      bgClass: 'bg-[#F0F4F0]',
      button: null,
    };
  }
  
  // ⚠️ No email - show "Add Email" button
  if (!hasEmail) {
    return {
      type: 'button' as const,
      icon: <Edit3 size={12} />,
      label: 'Add Email',
      action: 'edit',
      buttonClass: 'border border-[hsl(var(--brand-honey))]/50 text-[hsl(var(--brand-honey))] hover:bg-[hsl(var(--brand-honey))]/10',
      button: null,
    };
  }
  
  // 📨 Invitation active - show progress + Pause on hover
  if (guest.status === 'invited') {
    return {
      type: 'status-with-hover-action' as const,
      icon: <Send size={12} />,
      label: `${emailsSent}/4`,
      colorClass: 'text-[hsl(var(--brand-honey))]',
      hoverButton: isHovered ? {
        icon: <Pause size={12} />,
        label: 'Pause',
        action: 'pause',
      } : null,
      button: null,
    };
  }
  
  // ⏸️ Paused - show "Resume" button (with details on hover)
  if (guest.status === 'paused') {
    return {
      type: 'button' as const,
      icon: <Play size={12} />,
      label: isHovered ? `Resume · ${emailsSent}/4 sent` : 'Resume',
      action: 'resume',
      buttonClass: 'bg-[hsl(var(--brand-charcoal))] text-white hover:bg-[hsl(var(--brand-charcoal))]/90',
      button: null,
    };
  }
  
  // 📭 Completed (no response) - show "No luck · Retry" button
  if (guest.status === 'completed') {
    return {
      type: 'button' as const,
      icon: <RotateCcw size={12} />,
      label: 'No luck · Retry',
      action: 'retry',
      buttonClass: 'border border-[hsl(var(--brand-sand))] text-[hsl(var(--brand-warm-gray))] hover:bg-gray-50',
      button: null,
    };
  }
  
  // ⏳ Pending (not invited yet) - show "Send Invites" button
  return {
    type: 'button' as const,
    icon: <Mail size={12} />,
    label: 'Send Invites',
    action: 'invite',
    buttonClass: 'bg-[hsl(var(--brand-charcoal))] text-white hover:bg-[hsl(var(--brand-charcoal))]/90',
    button: null,
  };
};
```

### 5. Actualizar el render de cada tarjeta de guest

Reemplazar **SOLO** el contenido dentro del `sortedGuests.map(...)`. El nuevo código:

```tsx
{sortedGuests.map((guest) => {
  const isHovered = hoveredGuestId === guest.id;
  const isLoading = actionLoading === guest.id;
  const display = getGuestDisplay(guest, isHovered);
  
  return (
    <div
      key={guest.id}
      className="w-full px-4 py-3 rounded-lg border border-gray-100 bg-white
                 hover:border-[hsl(var(--brand-honey))] hover:shadow-sm
                 transition-all duration-200 cursor-pointer"
      onMouseEnter={() => setHoveredGuestId(guest.id)}
      onMouseLeave={() => setHoveredGuestId(null)}
      onClick={() => handleGuestClick(guest)}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Guest name */}
        <p className="font-normal text-[hsl(var(--brand-charcoal))] truncate flex-1">
          {guest.first_name} {guest.last_name || ''}
        </p>
        
        {/* Right side: badge or button */}
        {display.type === 'badge' && (
          <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${display.colorClass} ${display.bgClass}`}>
            {display.icon}
            <span>{display.label}</span>
          </div>
        )}
        
        {display.type === 'button' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleInviteAction(guest, display.action);
            }}
            disabled={isLoading}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${display.buttonClass} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? (
              <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              display.icon
            )}
            <span>{display.label}</span>
          </button>
        )}
        
        {display.type === 'status-with-hover-action' && (
          <div className="flex items-center gap-2">
            {/* Status indicator */}
            <div className={`flex items-center gap-1 text-xs ${display.colorClass}`}>
              {display.icon}
              <span>{display.label}</span>
            </div>
            
            {/* Action button - only on hover */}
            {display.hoverButton && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleInviteAction(guest, display.hoverButton.action);
                }}
                disabled={isLoading}
                className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md 
                           border border-[hsl(var(--brand-sand))] text-[hsl(var(--brand-warm-gray))] 
                           hover:bg-gray-50 transition-all ${isLoading ? 'opacity-50' : ''}`}
              >
                {isLoading ? (
                  <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  display.hoverButton.icon
                )}
                <span>{display.hoverButton.label}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
})}
```

---

## Resumen de estados

| Estado | Qué ve el usuario | Botón/Badge |
|--------|-------------------|-------------|
| Con receta | Badge verde | `✓ 1 recipe` |
| Sin email | Botón honey outline | `[Add Email]` |
| Invitación activa | Status + botón en hover | `📨 2/4` + `[Pause]` en hover |
| Pausado | Botón negro | `[Resume]` (hover: `[Resume · 2/4 sent]`) |
| Sin respuesta | Botón outline gris | `[No luck · Retry]` |
| No invitado | Botón negro | `[Send Invites]` |

---

## Colores de marca (referencia)

- **Charcoal:** `hsl(var(--brand-charcoal))` - Botones primarios, texto
- **Honey:** `hsl(var(--brand-honey))` - Acentos, estados activos
- **Warm Gray:** `hsl(var(--brand-warm-gray))` - Texto secundario
- **Sand:** `hsl(var(--brand-sand))` - Bordes
- **Olive:** `#6B7B5E` - Success (receta recibida)

---

## Verificación post-implementación

1. [ ] Click en el nombre del guest abre el modal de detalles
2. [ ] Click en un botón ejecuta la acción (no abre el modal)
3. [ ] El botón [Pause] solo aparece en hover para guests con invitación activa
4. [ ] El botón [Resume] muestra más detalles en hover
5. [ ] Loading spinner aparece durante la acción
6. [ ] La lista se actualiza después de cada acción
7. [ ] Guests sin email muestran [Add Email] que abre el modal
8. [ ] Guests con receta solo muestran el badge (sin botón)