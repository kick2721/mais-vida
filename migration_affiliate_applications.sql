-- Añadir columnas password_temp y email a affiliate_applications
-- Ejecutar en Supabase → SQL Editor

ALTER TABLE affiliate_applications
  ADD COLUMN IF NOT EXISTS email        TEXT,
  ADD COLUMN IF NOT EXISTS password_temp TEXT;

-- Comentario para referencia
COMMENT ON COLUMN affiliate_applications.password_temp IS 'Contraseña temporal guardada al candidatarse. Se limpia después de crear la cuenta en Supabase Auth.';
COMMENT ON COLUMN affiliate_applications.email IS 'Email opcional del candidato. Si no se provee, se genera uno ficticio basado en el teléfono.';
