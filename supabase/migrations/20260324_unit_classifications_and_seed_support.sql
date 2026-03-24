BEGIN;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS unit_type TEXT NOT NULL DEFAULT 'weight';

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS allowed_units JSONB NOT NULL DEFAULT '["g","kg"]'::jsonb;

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_unit_type_check;

ALTER TABLE public.products
  ADD CONSTRAINT products_unit_type_check
  CHECK (unit_type IN ('weight', 'volume', 'discrete'));

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_allowed_units_array_check;

ALTER TABLE public.products
  ADD CONSTRAINT products_allowed_units_array_check
  CHECK (jsonb_typeof(allowed_units) = 'array');

UPDATE public.products
SET
  unit_type = CASE
    WHEN COALESCE(products.unit_type, '') IN ('weight', 'volume', 'discrete')
      THEN products.unit_type
    ELSE 'weight'
  END,
  allowed_units = CASE
    WHEN jsonb_typeof(products.allowed_units) = 'array'
      THEN products.allowed_units
    ELSE '["g","kg"]'::jsonb
  END;

DROP VIEW IF EXISTS public.product_catalog;
CREATE VIEW public.product_catalog AS
SELECT
  p.id,
  p.name,
  p.category_id,
  p.image_url,
  p.description,
  p.specifications,
  p.created_at,
  p.final_price AS price,
  p.final_price,
  p.unit_type,
  p.allowed_units,
  c.name AS category_name,
  c.slug AS category_slug
FROM public.products p
LEFT JOIN public.categories c ON c.id = p.category_id;

GRANT SELECT ON public.product_catalog TO anon, authenticated;

COMMIT;
