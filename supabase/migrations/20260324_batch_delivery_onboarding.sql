BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS address TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS city TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pincode TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone_number TEXT;

UPDATE public.profiles
SET
  address = COALESCE(
    NULLIF(TRIM(CONCAT_WS(', ', house_no, street, landmark, area)), ''),
    address
  ),
  city = COALESCE(city, 'Kozhikode'),
  pincode = COALESCE(pincode, ''),
  phone_number = COALESCE(phone_number, mobile_number)
WHERE address IS NULL
   OR city IS NULL
   OR pincode IS NULL
   OR phone_number IS NULL;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_batch TEXT;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_batch_date DATE;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS assigned_agent_id UUID;

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_delivery_batch_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_delivery_batch_check
  CHECK (delivery_batch IN ('Morning', 'Evening') OR delivery_batch IS NULL);

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_delivery_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_delivery_status_check
  CHECK (delivery_status IN ('pending', 'ready_for_pickup', 'assigned', 'out_for_delivery', 'delivered', 'cancelled'));

UPDATE public.orders
SET
  delivery_batch = CASE
    WHEN ((created_at AT TIME ZONE 'Asia/Kolkata')::time < TIME '08:00') THEN 'Morning'
    WHEN ((created_at AT TIME ZONE 'Asia/Kolkata')::time < TIME '15:00') THEN 'Evening'
    ELSE 'Morning'
  END,
  delivery_batch_date = CASE
    WHEN ((created_at AT TIME ZONE 'Asia/Kolkata')::time < TIME '08:00') THEN (created_at AT TIME ZONE 'Asia/Kolkata')::date
    WHEN ((created_at AT TIME ZONE 'Asia/Kolkata')::time < TIME '15:00') THEN (created_at AT TIME ZONE 'Asia/Kolkata')::date
    ELSE ((created_at AT TIME ZONE 'Asia/Kolkata')::date + INTERVAL '1 day')::date
  END,
  assigned_agent_id = COALESCE(assigned_agent_id, agent_id)
WHERE delivery_batch IS NULL
   OR delivery_batch_date IS NULL
   OR assigned_agent_id IS NULL;

CREATE OR REPLACE FUNCTION public.get_open_delivery_batch()
RETURNS TABLE (
  delivery_batch TEXT,
  batch_date DATE,
  cutoff_at TIMESTAMPTZ
) AS $$
DECLARE
  v_now_ist TIMESTAMP;
BEGIN
  v_now_ist := NOW() AT TIME ZONE 'Asia/Kolkata';

  IF v_now_ist::time < TIME '08:00' THEN
    RETURN QUERY
    SELECT
      'Morning'::TEXT,
      v_now_ist::date,
      ((v_now_ist::date::TEXT || ' 07:59:59')::timestamp AT TIME ZONE 'Asia/Kolkata');
  ELSIF v_now_ist::time < TIME '15:00' THEN
    RETURN QUERY
    SELECT
      'Evening'::TEXT,
      v_now_ist::date,
      ((v_now_ist::date::TEXT || ' 14:59:59')::timestamp AT TIME ZONE 'Asia/Kolkata');
  ELSE
    RETURN QUERY
    SELECT
      'Morning'::TEXT,
      (v_now_ist::date + INTERVAL '1 day')::date,
      ((((v_now_ist::date + INTERVAL '1 day')::date)::TEXT || ' 07:59:59')::timestamp AT TIME ZONE 'Asia/Kolkata');
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION public.get_referrer_preview(p_referral_code TEXT)
RETURNS TABLE (
  full_name TEXT,
  first_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.full_name,
    split_part(COALESCE(p.full_name, 'Vitzo member'), ' ', 1) AS first_name
  FROM public.profiles p
  WHERE p.referral_code = UPPER(TRIM(p_referral_code))
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.get_referrer_preview(TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_current_batch_snapshot()
RETURNS TABLE (
  delivery_batch TEXT,
  batch_date DATE,
  active_orders BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH current_batch AS (
    SELECT * FROM public.get_open_delivery_batch()
  )
  SELECT
    cb.delivery_batch,
    cb.batch_date,
    COUNT(o.id)::BIGINT AS active_orders
  FROM current_batch cb
  LEFT JOIN public.orders o
    ON o.delivery_batch = cb.delivery_batch
   AND o.delivery_batch_date = cb.batch_date
   AND COALESCE(o.status, 'pending') <> 'cancelled'
   AND COALESCE(o.delivery_status, 'pending') <> 'delivered'
   AND COALESCE(o.delivery_status, 'pending') <> 'cancelled'
  GROUP BY cb.delivery_batch, cb.batch_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.get_current_batch_snapshot() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.cancel_order_before_cutoff(p_order_id UUID)
RETURNS public.orders AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_now_ist TIMESTAMP;
  v_cutoff TIMESTAMP;
BEGIN
  SELECT *
  INTO v_order
  FROM public.orders
  WHERE id = p_order_id
    AND user_id = auth.uid()
  FOR UPDATE;

  IF v_order.id IS NULL THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND';
  END IF;

  IF COALESCE(v_order.status, 'pending') = 'cancelled'
     OR COALESCE(v_order.delivery_status, 'pending') = 'cancelled' THEN
    RAISE EXCEPTION 'ORDER_ALREADY_CANCELLED';
  END IF;

  IF COALESCE(v_order.delivery_status, 'pending') IN ('out_for_delivery', 'delivered') THEN
    RAISE EXCEPTION 'ORDER_ALREADY_IN_FINAL_STAGE';
  END IF;

  IF v_order.delivery_batch IS NULL OR v_order.delivery_batch_date IS NULL THEN
    RAISE EXCEPTION 'ORDER_BATCH_NOT_READY';
  END IF;

  v_now_ist := NOW() AT TIME ZONE 'Asia/Kolkata';
  v_cutoff := CASE
    WHEN v_order.delivery_batch = 'Morning'
      THEN (v_order.delivery_batch_date::TEXT || ' 07:59:59')::timestamp
    ELSE
      (v_order.delivery_batch_date::TEXT || ' 14:59:59')::timestamp
  END;

  IF v_now_ist > v_cutoff THEN
    RAISE EXCEPTION 'CANCELLATION_WINDOW_CLOSED';
  END IF;

  UPDATE public.orders
  SET
    status = 'cancelled',
    delivery_status = 'cancelled',
    assigned_agent_id = NULL,
    agent_id = NULL
  WHERE id = v_order.id
  RETURNING * INTO v_order;

  RETURN v_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.cancel_order_before_cutoff(UUID) TO authenticated;

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
  v_delivery_batch TEXT;
  v_delivery_batch_date DATE;
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

  SELECT delivery_batch, batch_date
  INTO v_delivery_batch, v_delivery_batch_date
  FROM public.get_open_delivery_batch();

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
    delivery_batch,
    delivery_batch_date,
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
    v_delivery_batch,
    v_delivery_batch_date,
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

CREATE OR REPLACE FUNCTION public.auto_assign_order_to_agent()
RETURNS TRIGGER AS $$
DECLARE
  target_agent_id UUID;
BEGIN
  IF NEW.delivery_status = 'ready_for_pickup' AND (TG_OP = 'INSERT' OR OLD.delivery_status IS DISTINCT FROM 'ready_for_pickup') THEN
    SELECT id INTO target_agent_id
    FROM public.agents
    WHERE status = 'approved'
      AND is_active = true
      AND working_area = NEW.shipping_area
    ORDER BY total_orders ASC NULLS FIRST, created_at ASC
    LIMIT 1;

    IF target_agent_id IS NOT NULL THEN
      NEW.agent_id := target_agent_id;
      NEW.assigned_agent_id := target_agent_id;
      NEW.delivery_status := 'assigned';
    END IF;
  ELSIF NEW.agent_id IS DISTINCT FROM COALESCE(OLD.agent_id, NULL) THEN
    NEW.assigned_agent_id := NEW.agent_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE public.orders REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  EXCEPTION
    WHEN duplicate_object THEN
      NULL;
  END;
END $$;

COMMIT;
