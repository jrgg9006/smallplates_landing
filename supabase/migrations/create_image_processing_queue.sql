-- =====================================================
-- Tabla para Cola de Procesamiento Asíncrono de Imágenes
-- =====================================================
-- Esta tabla gestiona el procesamiento diferido de imágenes de recetas.
-- Cuando un usuario sube una imagen, se guarda la receta inmediatamente
-- y se añade una entrada aquí para procesar el OCR después.

CREATE TABLE IF NOT EXISTS image_processing_queue (
  -- Identificador único del job de procesamiento
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- ID de la receta a procesar (se elimina si se borra la receta)
  recipe_id UUID REFERENCES guest_recipes(id) ON DELETE CASCADE,
  
  -- URL completa de la imagen subida a Supabase Storage
  -- Ejemplo: https://xxx.supabase.co/storage/v1/object/public/recipes/...
  image_url TEXT NOT NULL,
  
  -- Nombre de la receta proporcionado por el usuario
  -- Se usa para mejorar la precisión del OCR/extracción
  recipe_name TEXT,
  
  -- Estado actual del procesamiento
  -- pending: En cola esperando ser procesado
  -- processing: Siendo procesado actualmente
  -- completed: Procesado exitosamente
  -- failed: Falló después de varios intentos
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  
  -- Número de veces que se ha intentado procesar
  -- Se usa para reintentar automáticamente (máx 3 intentos)
  attempts INT DEFAULT 0,
  
  -- Mensaje de error si el procesamiento falla
  -- Útil para debugging y monitoreo
  error_message TEXT,
  
  -- Cuándo se agregó a la cola
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Cuándo se completó el procesamiento (exitoso o fallido)
  processed_at TIMESTAMP WITH TIME ZONE,
  
  -- Última actualización del registro
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- Índices para Optimización
-- =====================================================

-- Búsqueda rápida por estado (para cron job)
CREATE INDEX idx_processing_queue_status ON image_processing_queue(status);

-- Ordenamiento por antigüedad (FIFO - First In First Out)
CREATE INDEX idx_processing_queue_created ON image_processing_queue(created_at);

-- Búsqueda por receta específica
CREATE INDEX idx_processing_queue_recipe ON image_processing_queue(recipe_id);

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

-- Habilitar RLS para seguridad
ALTER TABLE image_processing_queue ENABLE ROW LEVEL SECURITY;

-- Solo el service role puede acceder (usado por cron jobs)
-- Los usuarios normales no necesitan ver esta tabla
CREATE POLICY "Service role full access" ON image_processing_queue
  FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- Trigger para actualizar updated_at automáticamente
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_image_processing_queue_updated_at 
  BEFORE UPDATE ON image_processing_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Comentarios de Tabla
-- =====================================================

COMMENT ON TABLE image_processing_queue IS 'Cola de procesamiento asíncrono para extraer texto de imágenes de recetas usando OCR';
COMMENT ON COLUMN image_processing_queue.id IS 'ID único del job de procesamiento';
COMMENT ON COLUMN image_processing_queue.recipe_id IS 'Referencia a la receta que necesita procesamiento de imagen';
COMMENT ON COLUMN image_processing_queue.image_url IS 'URL completa de la imagen en Supabase Storage';
COMMENT ON COLUMN image_processing_queue.recipe_name IS 'Nombre de la receta para contexto del OCR';
COMMENT ON COLUMN image_processing_queue.status IS 'Estado: pending|processing|completed|failed';
COMMENT ON COLUMN image_processing_queue.attempts IS 'Contador de intentos de procesamiento (máx 3)';
COMMENT ON COLUMN image_processing_queue.error_message IS 'Último error si el procesamiento falla';
COMMENT ON COLUMN image_processing_queue.created_at IS 'Timestamp de cuando se agregó a la cola';
COMMENT ON COLUMN image_processing_queue.processed_at IS 'Timestamp de cuando se completó el procesamiento';
COMMENT ON COLUMN image_processing_queue.updated_at IS 'Timestamp de última actualización del registro';