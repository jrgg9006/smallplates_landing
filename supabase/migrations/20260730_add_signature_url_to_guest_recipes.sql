-- Reason: firma dibujada con el dedo por el invitado, guardada como PNG
-- transparente en el bucket `recipes`. Esta columna guarda la URL pública.
-- Spike técnico: captura + guardado + verificación en la vista admin.
ALTER TABLE guest_recipes
  ADD COLUMN IF NOT EXISTS signature_url text;
