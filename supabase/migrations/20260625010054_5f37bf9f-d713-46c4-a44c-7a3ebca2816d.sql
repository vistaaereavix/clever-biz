ALTER TABLE public.produtos
  ADD COLUMN IF NOT EXISTS marca text,
  ADD COLUMN IF NOT EXISTS modelo text,
  ADD COLUMN IF NOT EXISTS condicao text,
  ADD COLUMN IF NOT EXISTS tipo_item text,
  ADD COLUMN IF NOT EXISTS ncm text;