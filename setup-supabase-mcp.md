# Supabase MCP Setup Guide

## Paso 1: Instalar el servidor MCP

```bash
npm install -g @modelcontextprotocol/server-supabase
```

## Paso 2: Obtener credenciales de Supabase

1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Settings → API
4. Copia:
   - **Project URL**
   - **anon public key**

## Paso 3: Configurar Claude Desktop

Abre el archivo de configuración:

```bash
code ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

Si no existe, créalo. Luego añade esta configuración:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "@modelcontextprotocol/server-supabase",
        "--project-url",
        "TU_PROJECT_URL_AQUI",
        "--anon-key",
        "TU_ANON_KEY_AQUI"
      ]
    }
  }
}
```

**Ejemplo real:**

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "@modelcontextprotocol/server-supabase",
        "--project-url",
        "https://abc123xyz.supabase.co",
        "--anon-key",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
      ]
    }
  }
}
```

## Paso 4: Reiniciar Claude Code

1. Cierra completamente Claude Code
2. Abre nuevamente
3. El MCP debería estar activo

## Paso 5: Verificar instalación

En Claude Code, deberías poder usar comandos como:

```
mcp__supabase__query
mcp__supabase__insert
mcp__supabase__update
mcp__supabase__delete
```

## Troubleshooting

**Error: "command not found"**
- Asegúrate de tener Node.js instalado
- Verifica que npx esté disponible: `npx --version`

**Error: "Invalid credentials"**
- Verifica que copiaste correctamente el Project URL
- Verifica que copiaste la anon key completa (puede ser muy larga)

**MCP no aparece en Claude Code**
- Verifica que el JSON esté bien formado (sin comas extras)
- Reinicia Claude Code completamente
- Revisa los logs en: `~/Library/Logs/Claude/`

## Comandos útiles una vez instalado

```bash
# Verificar instalación
npx @modelcontextprotocol/server-supabase --help

# Ver versión
npm list -g @modelcontextprotocol/server-supabase
```

## ¿Qué puedes hacer con el MCP?

- ✅ Consultar tablas directamente
- ✅ Insertar/actualizar/eliminar datos
- ✅ Ver esquema de la base de datos
- ✅ Ejecutar queries SQL
- ✅ Gestionar usuarios de auth
- ✅ Ver logs y métricas

---

**Nota:** Si prefieres usar variables de entorno en lugar de hardcodear las credenciales:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "@modelcontextprotocol/server-supabase"
      ],
      "env": {
        "SUPABASE_URL": "${NEXT_PUBLIC_SUPABASE_URL}",
        "SUPABASE_KEY": "${NEXT_PUBLIC_SUPABASE_ANON_KEY}"
      }
    }
  }
}
```