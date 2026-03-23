-- Launch prep migration for Vitzo
-- Safe, non-destructive updates that align the running app with the schema.

BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_stock_non_negative;

ALTER TABLE public.products
  ADD CONSTRAINT products_stock_non_negative CHECK (stock >= 0);

CREATE INDEX IF NOT EXISTS agents_active_area_idx
  ON public.agents (working_area, is_active, status, total_orders);

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_delivery_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_delivery_status_check CHECK (
    delivery_status IN (
      'pending',
      'ready_for_pickup',
      'assigned',
      'out_for_delivery',
      'delivered'
    )
  );

CREATE OR REPLACE FUNCTION public.handle_profile_sync()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    CASE WHEN NEW.email = 'vitzo.hq@gmail.com' THEN 'admin' ELSE 'customer' END,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    role = CASE
      WHEN NEW.email = 'vitzo.hq@gmail.com' THEN 'admin'
      ELSE public.profiles.role
    END,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_profile_sync();

INSERT INTO public.profiles (id, full_name, role, created_at, updated_at)
SELECT
  users.id,
  COALESCE(users.raw_user_meta_data ->> 'full_name', users.email),
  CASE WHEN users.email = 'vitzo.hq@gmail.com' THEN 'admin' ELSE 'customer' END,
  NOW(),
  NOW()
FROM auth.users AS users
ON CONFLICT (id) DO UPDATE
SET
  full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
  role = CASE
    WHEN EXISTS (
      SELECT 1 FROM auth.users admin_user
      WHERE admin_user.id = public.profiles.id
        AND admin_user.email = 'vitzo.hq@gmail.com'
    ) THEN 'admin'
    ELSE public.profiles.role
  END,
  updated_at = NOW();

CREATE OR REPLACE FUNCTION public.auto_assign_order_to_agent()
RETURNS TRIGGER AS $$
DECLARE
  target_agent_id UUID;
BEGIN
  IF NEW.delivery_status = 'ready_for_pickup'
     AND (
       TG_OP = 'INSERT'
       OR OLD.delivery_status IS DISTINCT FROM 'ready_for_pickup'
     ) THEN
    SELECT agents.id
    INTO target_agent_id
    FROM public.agents
    WHERE agents.status = 'approved'
      AND agents.is_active = TRUE
      AND agents.working_area = NEW.shipping_area
    ORDER BY agents.total_orders ASC, agents.created_at ASC
    LIMIT 1;

    IF target_agent_id IS NOT NULL THEN
      NEW.agent_id := target_agent_id;
      NEW.delivery_status := 'assigned';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_auto_assign_order ON public.orders;
CREATE TRIGGER tr_auto_assign_order
BEFORE INSERT OR UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.auto_assign_order_to_agent();

CREATE OR REPLACE FUNCTION public.process_checkout(
  p_total_amount DECIMAL,
  p_shipping_house_no TEXT,
  p_shipping_street TEXT,
  p_shipping_landmark TEXT,
  p_shipping_area TEXT,
  p_mobile_number TEXT,
  p_payment_method TEXT,
  p_items JSONB
) RETURNS UUID AS $$
DECLARE
  v_order_id UUID;
  item JSONB;
  v_current_stock INTEGER;
  v_product_name TEXT;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED';
  END IF;

  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'CART_EMPTY';
  END IF;

  INSERT INTO public.orders (
    user_id,
    total_amount,
    status,
    delivery_status,
    shipping_house_no,
    shipping_street,
    shipping_landmark,
    shipping_area,
    mobile_number,
    payment_method,
    payment_status
  )
  VALUES (
    v_user_id,
    p_total_amount,
    'pending',
    'ready_for_pickup',
    p_shipping_house_no,
    p_shipping_street,
    p_shipping_landmark,
    p_shipping_area,
    p_mobile_number,
    p_payment_method,
    'pending'
  )
  RETURNING id INTO v_order_id;

  FOR item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    SELECT stock, name
    INTO v_current_stock, v_product_name
    FROM public.products
    WHERE id = (item ->> 'product_id')::UUID
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'PRODUCT_NOT_FOUND:%', item ->> 'product_id';
    END IF;

    IF v_current_stock < (item ->> 'quantity')::INTEGER THEN
      RAISE EXCEPTION 'INSUFFICIENT_STOCK:%', v_product_name;
    END IF;

    UPDATE public.products
    SET stock = stock - (item ->> 'quantity')::INTEGER
    WHERE id = (item ->> 'product_id')::UUID;

    INSERT INTO public.order_items (
      order_id,
      product_id,
      quantity,
      price_at_time_of_order
    )
    VALUES (
      v_order_id,
      (item ->> 'product_id')::UUID,
      (item ->> 'quantity')::INTEGER,
      (item ->> 'price')::DECIMAL
    );
  END LOOP;

  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
