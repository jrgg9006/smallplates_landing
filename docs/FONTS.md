# 📝 Guía de Fuentes - Small Plates & Company

## 🎨 Fuentes Disponibles

Este proyecto usa **dos tipos de fuentes**:

### 1. **Minion Pro** (Serif) - Adobe Fonts
- **Uso:** Títulos elegantes, headings principales
- **Estilo:** Clásica, elegante, editorial
- **Fuente:** Adobe Creative Cloud (Typekit)

### 2. **System Fonts** (Sans-serif) - Fuentes del sistema
- **Uso:** Texto de cuerpo, párrafos, UI
- **Estilo:** Moderna, limpia, legible
- **Fuente:** Nativa del dispositivo (rápida, no requiere descarga)

---

## 🚀 Cómo Usar las Fuentes

### **Opción 1: Usar Minion Pro (Serif)**

```tsx
<h1 className="font-serif text-4xl">
  Título con Minion Pro
</h1>
```

### **Opción 2: Usar Fuente del Sistema (Sans)**

```tsx
<p className="font-sans text-lg">
  Texto normal con fuente del sistema
</p>
```

---

## 📚 Variaciones de Minion Pro

Minion Pro tiene diferentes **pesos (weights)** y **estilos**:

### **Pesos de Fuente (Font Weights)**

| Clase Tailwind | Peso | Cuándo Usar |
|----------------|------|-------------|
| `font-light` | 300 | Subtítulos delicados |
| `font-normal` | 400 | Texto regular |
| `font-medium` | 500 | Énfasis moderado |
| `font-semibold` | 600 | Títulos importantes |
| `font-bold` | 700 | Headings principales |

**Ejemplo:**
```tsx
{/* Título ligero */}
<h2 className="font-serif font-light text-3xl">
  Título delicado
</h2>

{/* Título bold */}
<h1 className="font-serif font-bold text-5xl">
  Título importante
</h1>

{/* Título semibold (recomendado) */}
<h1 className="font-serif font-semibold text-4xl">
  The people behind every recipe.
</h1>
```

### **Estilos Itálicos**

```tsx
{/* Texto en itálica */}
<p className="font-serif italic">
  Texto elegante en cursiva
</p>

{/* Combinando peso + itálica */}
<h3 className="font-serif font-semibold italic text-2xl">
  Título semibold en cursiva
</h3>
```

---

## 🎯 Ejemplos Prácticos

### **Hero Principal**
```tsx
<h1 className="font-serif font-semibold text-5xl">
  The people behind every recipe.
</h1>
<p className="font-sans text-lg text-gray-700">
  A cookbook experience made with your loved ones' recipes.
</p>
```

### **Sección de Features**
```tsx
<h2 className="font-serif font-bold text-4xl">
  Premium Quality
</h2>
<p className="font-sans text-base">
  High-quality hardcover books that bring memories to life.
</p>
```

### **Card / Tarjeta**
```tsx
<div className="card">
  <h3 className="font-serif font-semibold text-2xl">
    Recipe Collection
  </h3>
  <p className="font-sans text-sm text-gray-600">
    Gather your family's favorite recipes in one beautiful place.
  </p>
</div>
```

### **Botón Elegante**
```tsx
<button className="font-serif font-medium text-lg">
  Get Started
</button>
```

---

## 📐 Tamaños de Fuente (Font Sizes)

Tailwind usa escalas de tamaño consistentes:

| Clase | Tamaño | Uso Típico |
|-------|--------|-----------|
| `text-sm` | 14px | Texto pequeño, notas |
| `text-base` | 16px | Texto de cuerpo |
| `text-lg` | 18px | Párrafos destacados |
| `text-xl` | 20px | Subtítulos |
| `text-2xl` | 24px | Headings H3 |
| `text-3xl` | 30px | Headings H2 |
| `text-4xl` | 36px | Headings H1 |
| `text-5xl` | 48px | Hero principal |

**Ejemplo combinado:**
```tsx
<h1 className="font-serif font-bold text-5xl">
  {/* Minion Pro, Bold, 48px */}
  Hero Title
</h1>
```

---

## 🎨 Combinaciones Recomendadas

### **Combo 1: Editorial Clásico**
```tsx
<h1 className="font-serif font-semibold text-5xl text-gray-900">
  Main Heading
</h1>
<h2 className="font-serif font-normal text-3xl text-gray-800">
  Subheading
</h2>
<p className="font-sans text-lg text-gray-700">
  Body text for readability
</p>
```

### **Combo 2: Moderno y Limpio**
```tsx
<h1 className="font-serif font-bold text-4xl">
  Bold Statement
</h1>
<p className="font-sans font-light text-base text-gray-600">
  Light and airy description
</p>
```

### **Combo 3: Elegante con Énfasis**
```tsx
<h2 className="font-serif font-medium italic text-3xl">
  Special Announcement
</h2>
<p className="font-sans text-base">
  Regular body text
</p>
```

---

## 🔧 Configuración Técnica

### **Tailwind Config** (`tailwind.config.ts`)
```ts
fontFamily: {
  serif: ["minion-pro", "Georgia", "serif"],
  sans: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
}
```

### **Adobe Fonts Link** (`app/layout.tsx`)
```tsx
<head>
  <link rel="stylesheet" href="https://use.typekit.net/fvk8ngw.css" />
</head>
```

---

## ✅ Checklist de Uso

- ✅ **Títulos grandes (H1, H2):** Usa `font-serif`
- ✅ **Texto de cuerpo, párrafos:** Usa `font-sans`
- ✅ **Botones importantes:** Usa `font-serif font-medium`
- ✅ **UI general (navbar, footer):** Usa `font-sans`
- ✅ **Quotes/Testimonios:** Usa `font-serif italic`

---

## 🚫 Errores Comunes

### ❌ **NO hacer:**
```tsx
{/* Demasiado pesado - difícil de leer */}
<p className="font-serif font-bold text-base">
  Párrafo largo de texto...
</p>

{/* Mixing sin propósito */}
<h1 className="font-sans">Título</h1>
<p className="font-serif">Párrafo</p>
```

### ✅ **SÍ hacer:**
```tsx
{/* Títulos con serif, párrafos con sans */}
<h1 className="font-serif font-semibold text-4xl">
  Título elegante
</h1>
<p className="font-sans text-lg">
  Párrafo legible y cómodo de leer
</p>
```

---

## 📖 Resumen Rápido

**Minion Pro (Serif):**
- Clase: `font-serif`
- Para: Títulos, headings, elementos elegantes
- Pesos: `font-light`, `font-normal`, `font-semibold`, `font-bold`
- Estilo: Añade `italic` si quieres cursiva

**System Fonts (Sans):**
- Clase: `font-sans`
- Para: Texto de cuerpo, UI, párrafos
- Pesos: igual que serif
- Estilo: Moderna y limpia

**Regla de oro:**
> Serif para **impacto visual**, Sans para **legibilidad**

---

## 🔗 Referencias

- [Tailwind Font Family Docs](https://tailwindcss.com/docs/font-family)
- [Tailwind Font Weight Docs](https://tailwindcss.com/docs/font-weight)
- [Adobe Fonts - Minion Pro](https://fonts.adobe.com/fonts/minion)
