# Prompt 2A-1: Actualizar funciones de Supabase para soportar group_id en guests

## Contexto

Small Plates es una plataforma donde invitados de boda suben recetas para crear un libro colaborativo. Acabamos de agregar una columna `group_id` a la tabla `guests` para que cada guest pertenezca a un grupo (cookbook/boda) específico.

**Cambio realizado en DB:**
- Nueva columna `group_id UUID` en tabla `guests`
- Foreign key a `groups(id)`
- Índices creados para performance

**Objetivo:** Actualizar las funciones de Supabase en `lib/supabase/guests.ts` para que soporten el nuevo campo `group_id`.

---

## Archivo a modificar

```
lib/supabase/guests.ts
```

---

## Cambios requeridos

### 1. Actualizar `GuestFormData` type (si está en este archivo o en types/database.ts)

Agregar `group_id` como campo requerido para nuevos guests:

```typescript
export interface GuestFormData {
  first_name: string;
  last_name?: string;
  printed_name?: string;
  email?: string;
  phone?: string;
  significant_other_name?: string;
  number_of_recipes?: number;
  notes?: string;
  tags?: string[];
  group_id: string; // NUEVO - Required para nuevos guests
}
```

### 2. Actualizar función `addGuest`

Modificar para incluir `group_id` en el insert:

**Buscar:**
```typescript
const guestData: GuestInsert = {
  user_id: user.id,
  first_name: formData.first_name,
  last_name: formData.last_name || '',
  // ... resto de campos
};
```

**Agregar `group_id`:**
```typescript
const guestData: GuestInsert = {
  user_id: user.id,
  group_id: formData.group_id, // NUEVO
  first_name: formData.first_name,
  last_name: formData.last_name || '',
  // ... resto de campos
};
```

### 3. Actualizar función `getGuests`

Agregar parámetro opcional `groupId` para filtrar por grupo:

**Cambiar firma de:**
```typescript
export async function getGuests(includeArchived = false): Promise<{ data: Guest[] | null; error: string | null }>
```

**A:**
```typescript
export async function getGuests(groupId?: string, includeArchived = false): Promise<{ data: Guest[] | null; error: string | null }>
```

**Agregar filtro en el query:**
```typescript
let query = supabase
  .from('guests')
  .select(`
    *,
    guest_recipes (
      created_at
    )
  `)
  .eq('user_id', user.id);

// NUEVO: Filtrar por group_id si se proporciona
if (groupId) {
  query = query.eq('group_id', groupId);
}

if (!includeArchived) {
  query = query.eq('is_archived', false);
}
```

### 4. Actualizar función `searchGuests`

Agregar `groupId` al interface de filtros y al query:

**Actualizar el interface `GuestSearchFilters` (puede estar en types/database.ts):**
```typescript
export interface GuestSearchFilters {
  search_query?: string;
  status?: string;
  include_archived?: boolean;
  group_id?: string; // NUEVO
}
```

**Modificar la función para usar el filtro:**

Después de obtener los resultados del RPC, filtrar por group_id si se proporciona:

```typescript
export async function searchGuests(filters: GuestSearchFilters) {
  const supabase = createSupabaseClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: 'User not authenticated' };
  }

  const { data, error } = await supabase.rpc('search_guests', {
    user_uuid: user.id,
    search_query: filters.search_query || null,
    status_filter: filters.status || null,
    include_archived: filters.include_archived || false,
  });

  if (error || !data) {
    return { data, error: error?.message || null };
  }

  // NUEVO: Filtrar por group_id si se proporciona
  let filteredData = data;
  if (filters.group_id) {
    filteredData = data.filter((guest: any) => guest.group_id === filters.group_id);
  }

  // ... resto del código de sorting con recipes
  // Usar filteredData en lugar de data para el sorting
```

### 5. Actualizar función `getGuestsByStatus`

Agregar parámetro `groupId`:

**Cambiar firma de:**
```typescript
export async function getGuestsByStatus(status: Guest['status'], includeArchived = false)
```

**A:**
```typescript
export async function getGuestsByStatus(status: Guest['status'], groupId?: string, includeArchived = false)
```

**Agregar filtro:**
```typescript
let query = supabase
  .from('guests')
  .select('*')
  .eq('user_id', user.id)
  .eq('status', status)
  .order('last_name', { ascending: true });

// NUEVO: Filtrar por group_id si se proporciona
if (groupId) {
  query = query.eq('group_id', groupId);
}

if (!includeArchived) {
  query = query.eq('is_archived', false);
}
```

### 6. Actualizar función `getGuestStatistics`

Agregar parámetro `groupId`:

**Cambiar firma de:**
```typescript
export async function getGuestStatistics(): Promise<{ data: GuestStatistics | null; error: string | null }>
```

**A:**
```typescript
export async function getGuestStatistics(groupId?: string): Promise<{ data: GuestStatistics | null; error: string | null }>
```

**Nota:** Esto puede requerir modificar el RPC `get_guest_statistics` en Supabase también, o hacer el cálculo en el cliente. Por ahora, si el RPC no soporta group_id, podemos calcular las estadísticas filtrando los datos en el cliente:

```typescript
export async function getGuestStatistics(groupId?: string): Promise<{ data: GuestStatistics | null; error: string | null }> {
  // Obtener todos los guests del grupo
  const { data: guests, error } = await getGuests(groupId, false);
  
  if (error || !guests) {
    return { data: null, error };
  }
  
  // Calcular estadísticas
  const stats: GuestStatistics = {
    total_guests: guests.length,
    pending_count: guests.filter(g => g.status === 'pending').length,
    submitted_count: guests.filter(g => g.status === 'submitted').length,
    total_recipes: guests.reduce((sum, g) => sum + (g.recipes_received || 0), 0),
  };
  
  return { data: stats, error: null };
}
```

### 7. Nueva función: `getGuestsByGroup`

Agregar función helper específica para obtener guests de un grupo:

```typescript
/**
 * Get all guests for a specific group
 */
export async function getGuestsByGroup(groupId: string, includeArchived = false): Promise<{ data: Guest[] | null; error: string | null }> {
  if (!groupId) {
    return { data: null, error: 'Group ID is required' };
  }
  
  return getGuests(groupId, includeArchived);
}
```

---

## Actualizar types (si es necesario)

Si los tipos están en `lib/types/database.ts`, asegurarse de que `Guest` incluya `group_id`:

```typescript
export interface Guest {
  id: string;
  user_id: string;
  group_id?: string; // NUEVO - opcional para backwards compatibility
  first_name: string;
  last_name: string;
  // ... resto de campos existentes
}

export interface GuestInsert {
  user_id: string;
  group_id?: string; // NUEVO
  first_name: string;
  last_name?: string;
  // ... resto de campos
}
```

---

## Importante: Backwards Compatibility

Todos los cambios mantienen backwards compatibility:
- `groupId` es opcional en las funciones de lectura (si no se pasa, retorna todos)
- Solo `addGuest` requiere `group_id` en el form data
- Guests existentes sin `group_id` seguirán funcionando

---

## Verificación post-implementación

1. [ ] `addGuest` crea guests con `group_id`
2. [ ] `getGuests(groupId)` filtra correctamente por grupo
3. [ ] `getGuests()` sin parámetro sigue funcionando (retorna todos)
4. [ ] `searchGuests` soporta filtro por `group_id`
5. [ ] `getGuestsByStatus` soporta filtro por `group_id`
6. [ ] `getGuestStatistics` calcula stats por grupo
7. [ ] No hay errores de TypeScript
8. [ ] Guests existentes sin `group_id` no causan errores

---

## Notas

- Este prompt solo actualiza las funciones de Supabase
- Los componentes de UI se actualizarán en el siguiente prompt
- El RPC `search_guests` podría necesitar actualizarse en Supabase directamente si queremos filtrar por group_id a nivel de base de datos (optimización futura)