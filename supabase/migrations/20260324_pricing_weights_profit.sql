BEGIN;

ALTER TABLE public.products
  RENAME COLUMN price TO real_price;

ALTER TABLE public.products
  DROP COLUMN IF EXISTS stock;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS commission DECIMAL(10,2) NOT NULL DEFAULT 0;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS final_price DECIMAL(10,2)
  GENERATED ALWAYS AS (real_price + commission) STORED;

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS selected_weight_grams INTEGER NOT NULL DEFAULT 1000;

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS real_price_per_kg DECIMAL(10,2) NOT NULL DEFAULT 0;

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS commission_per_kg DECIMAL(10,2) NOT NULL DEFAULT 0;

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS final_price_per_kg DECIMAL(10,2) NOT NULL DEFAULT 0;

DROP POLICY IF EXISTS "Public Read Products" ON public.products;

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
  c.name AS category_name,
  c.slug AS category_slug
FROM public.products p
LEFT JOIN public.categories c ON c.id = p.category_id;

GRANT SELECT ON public.product_catalog TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.verify_delivery_pin(p_order_id UUID, p_entered_pin TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_actual_pin TEXT;
    v_agent_id UUID;
BEGIN
    SELECT delivery_pin, agent_id INTO v_actual_pin, v_agent_id FROM orders WHERE id = p_order_id;
    IF v_agent_id NOT IN (SELECT id FROM agents WHERE user_id = auth.uid())
       AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;
    IF v_actual_pin = p_entered_pin THEN
        UPDATE orders SET delivery_status = 'delivered', status = 'delivered' WHERE id = p_order_id;
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.process_checkout(
  p_total_amount DECIMAL,
  p_shipping_house_no TEXT,
  p_shipping_street TEXT,
  p_shipping_landmark TEXT,
  p_shipping_area TEXT,
  p_mobile_number TEXT,
  p_payment_method TEXT,
  p_items JSONB,
  p_wallet_amount_requested DECIMAL
) RETURNS UUID AS $$
DECLARE
  v_order_id UUID;
  item JSONB;
  v_user_id UUID;
  v_wallet_balance DECIMAL(10,2);
  v_wallet_amount_to_use DECIMAL(10,2) := COALESCE(p_wallet_amount_requested, 0);
  v_final_amount_due DECIMAL(10,2);
  v_verified_total DECIMAL(10,2) := 0;
  v_weight_grams INTEGER;
  v_item_quantity INTEGER;
  v_real_price_per_kg DECIMAL(10,2);
  v_commission_per_kg DECIMAL(10,2);
  v_final_price_per_kg DECIMAL(10,2);
  v_line_unit_price DECIMAL(10,2);
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED';
  END IF;

  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'CART_EMPTY';
  END IF;

  IF v_wallet_amount_to_use < 0 THEN
    RAISE EXCEPTION 'INVALID_WALLET_AMOUNT';
  END IF;

  FOR item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_weight_grams := (item ->> 'weight_grams')::INTEGER;
    v_item_quantity := (item ->> 'quantity')::INTEGER;

    IF v_weight_grams IS NULL OR v_weight_grams <= 0 OR v_item_quantity IS NULL OR v_item_quantity <= 0 THEN
      RAISE EXCEPTION 'INVALID_WEIGHT_SELECTION';
    END IF;

    SELECT real_price, commission, final_price
    INTO v_real_price_per_kg, v_commission_per_kg, v_final_price_per_kg
    FROM public.products
    WHERE id = (item ->> 'product_id')::UUID;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'PRODUCT_NOT_FOUND:%', item ->> 'product_id';
    END IF;

    v_line_unit_price := ROUND(((v_final_price_per_kg * v_weight_grams) / 1000.0)::NUMERIC, 2);
    v_verified_total := v_verified_total + (v_line_unit_price * v_item_quantity);
  END LOOP;

  v_verified_total := ROUND(v_verified_total::NUMERIC, 2);

  IF ABS(v_verified_total - p_total_amount) > 0.01 THEN
    RAISE EXCEPTION 'INVALID_ORDER_TOTAL';
  END IF;

  IF v_wallet_amount_to_use > v_verified_total THEN
    RAISE EXCEPTION 'WALLET_EXCEEDS_TOTAL';
  END IF;

  INSERT INTO public.wallets (user_id, balance, created_at, updated_at)
  VALUES (v_user_id, 0, NOW(), NOW())
  ON CONFLICT (user_id) DO NOTHING;

  SELECT balance
  INTO v_wallet_balance
  FROM public.wallets
  WHERE user_id = v_user_id
  FOR UPDATE;

  IF v_wallet_amount_to_use > COALESCE(v_wallet_balance, 0) THEN
    RAISE EXCEPTION 'INSUFFICIENT_WALLET_BALANCE';
  END IF;

  v_final_amount_due := v_verified_total - v_wallet_amount_to_use;

  INSERT INTO public.orders (
    user_id,
    total_amount,
    wallet_amount_used,
    final_amount_due,
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
    v_verified_total,
    v_wallet_amount_to_use,
    v_final_amount_due,
    'pending',
    'ready_for_pickup',
    p_shipping_house_no,
    p_shipping_street,
    p_shipping_landmark,
    p_shipping_area,
    p_mobile_number,
    p_payment_method,
    CASE WHEN v_final_amount_due = 0 THEN 'paid' ELSE 'pending' END
  )
  RETURNING id INTO v_order_id;

  IF v_wallet_amount_to_use > 0 THEN
    UPDATE public.wallets
    SET balance = balance - v_wallet_amount_to_use, updated_at = NOW()
    WHERE user_id = v_user_id;

    INSERT INTO public.wallet_transactions (
      wallet_user_id,
      amount,
      transaction_type,
      source_type,
      order_id,
      description
    )
    VALUES (
      v_user_id,
      v_wallet_amount_to_use,
      'debit',
      'order_payment',
      v_order_id,
      'Wallet applied at checkout'
    );
  END IF;

  FOR item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_weight_grams := (item ->> 'weight_grams')::INTEGER;
    v_item_quantity := (item ->> 'quantity')::INTEGER;

    SELECT real_price, commission, final_price
    INTO v_real_price_per_kg, v_commission_per_kg, v_final_price_per_kg
    FROM public.products
    WHERE id = (item ->> 'product_id')::UUID;

    v_line_unit_price := ROUND(((v_final_price_per_kg * v_weight_grams) / 1000.0)::NUMERIC, 2);

    INSERT INTO public.order_items (
      order_id,
      product_id,
      quantity,
      selected_weight_grams,
      price_at_time_of_order,
      real_price_per_kg,
      commission_per_kg,
      final_price_per_kg
    )
    VALUES (
      v_order_id,
      (item ->> 'product_id')::UUID,
      v_item_quantity,
      v_weight_grams,
      v_line_unit_price,
      v_real_price_per_kg,
      v_commission_per_kg,
      v_final_price_per_kg
    );
  END LOOP;

  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_total_delivered_profit()
RETURNS DECIMAL AS $$
DECLARE
  v_profit DECIMAL(12,2);
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'UNAUTHORIZED';
  END IF;

  SELECT COALESCE(
    ROUND(SUM(((oi.commission_per_kg * oi.selected_weight_grams) / 1000.0) * oi.quantity)::NUMERIC, 2),
    0
  )
  INTO v_profit
  FROM public.order_items oi
  JOIN public.orders o ON o.id = oi.order_id
  WHERE o.delivery_status = 'delivered' OR o.status = 'delivered';

  RETURN COALESCE(v_profit, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
