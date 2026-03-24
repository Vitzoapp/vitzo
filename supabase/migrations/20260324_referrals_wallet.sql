BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code TEXT;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS wallet_amount_used DECIMAL(10,2) NOT NULL DEFAULT 0;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS final_amount_due DECIMAL(10,2) NOT NULL DEFAULT 0;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS referral_reward_processed BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_wallet_amount_used_non_negative;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_wallet_amount_used_non_negative CHECK (wallet_amount_used >= 0);

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_final_amount_due_non_negative;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_final_amount_due_non_negative CHECK (final_amount_due >= 0);

CREATE UNIQUE INDEX IF NOT EXISTS profiles_referral_code_unique
  ON public.profiles (referral_code)
  WHERE referral_code IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.wallets (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code_used TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'rewarded', 'cancelled')),
  reward_order_id UUID NULL REFERENCES public.orders(id) ON DELETE SET NULL,
  reward_amount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (reward_amount >= 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  rewarded_at TIMESTAMP WITH TIME ZONE NULL,
  CONSTRAINT referrals_no_self_referral CHECK (referrer_id <> referred_id)
);

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('credit', 'debit')),
  source_type TEXT NOT NULL CHECK (source_type IN ('referral_reward', 'order_payment', 'manual_adjustment')),
  referral_id UUID NULL REFERENCES public.referrals(id) ON DELETE SET NULL,
  order_id UUID NULL REFERENCES public.orders(id) ON DELETE SET NULL,
  description TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS referrals_referrer_idx ON public.referrals (referrer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS wallet_transactions_user_idx ON public.wallet_transactions (wallet_user_id, created_at DESC);

UPDATE public.profiles
SET referral_code = UPPER(SUBSTRING(REPLACE(id::TEXT, '-', '') FROM 1 FOR 10))
WHERE referral_code IS NULL;

INSERT INTO public.wallets (user_id, balance, created_at, updated_at)
SELECT id, 0, NOW(), NOW()
FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;

UPDATE public.orders
SET final_amount_due = total_amount
WHERE final_amount_due = 0
  AND wallet_amount_used = 0;

CREATE OR REPLACE FUNCTION public.handle_profile_sync()
RETURNS TRIGGER AS $$
DECLARE
  v_referral_code TEXT;
BEGIN
  v_referral_code := UPPER(SUBSTRING(REPLACE(NEW.id::TEXT, '-', '') FROM 1 FOR 10));

  INSERT INTO public.profiles (id, full_name, role, created_at, updated_at, referral_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    CASE WHEN NEW.email = 'vitzo.hq@gmail.com' THEN 'admin' ELSE 'customer' END,
    NOW(),
    NOW(),
    v_referral_code
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    role = CASE
      WHEN NEW.email = 'vitzo.hq@gmail.com' THEN 'admin'
      ELSE public.profiles.role
    END,
    referral_code = COALESCE(public.profiles.referral_code, EXCLUDED.referral_code),
    updated_at = NOW();

  INSERT INTO public.wallets (user_id, balance, created_at, updated_at)
  VALUES (NEW.id, 0, NOW(), NOW())
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.register_referral(p_referral_code TEXT)
RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
  v_referrer_id UUID;
  v_existing_referrer UUID;
  v_existing_orders INTEGER;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED';
  END IF;

  SELECT id
  INTO v_referrer_id
  FROM public.profiles
  WHERE referral_code = UPPER(TRIM(p_referral_code));

  IF v_referrer_id IS NULL THEN
    RAISE EXCEPTION 'INVALID_REFERRAL_CODE';
  END IF;

  IF v_referrer_id = v_user_id THEN
    RAISE EXCEPTION 'SELF_REFERRAL_NOT_ALLOWED';
  END IF;

  SELECT referrer_id
  INTO v_existing_referrer
  FROM public.referrals
  WHERE referred_id = v_user_id;

  IF v_existing_referrer IS NOT NULL THEN
    IF v_existing_referrer = v_referrer_id THEN
      RETURN;
    END IF;

    RAISE EXCEPTION 'REFERRAL_ALREADY_LINKED';
  END IF;

  SELECT COUNT(*)
  INTO v_existing_orders
  FROM public.orders
  WHERE user_id = v_user_id;

  IF v_existing_orders > 0 THEN
    RAISE EXCEPTION 'REFERRAL_WINDOW_CLOSED';
  END IF;

  INSERT INTO public.referrals (referrer_id, referred_id, referral_code_used, status)
  VALUES (v_referrer_id, v_user_id, UPPER(TRIM(p_referral_code)), 'pending');
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
  v_current_stock INTEGER;
  v_product_name TEXT;
  v_user_id UUID;
  v_wallet_balance DECIMAL(10,2);
  v_wallet_amount_to_use DECIMAL(10,2) := COALESCE(p_wallet_amount_requested, 0);
  v_final_amount_due DECIMAL(10,2);
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

  IF v_wallet_amount_to_use > p_total_amount THEN
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

  v_final_amount_due := p_total_amount - v_wallet_amount_to_use;

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
    p_total_amount,
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
    SET
      balance = balance - v_wallet_amount_to_use,
      updated_at = NOW()
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

CREATE OR REPLACE FUNCTION public.process_referral_reward()
RETURNS TRIGGER AS $$
DECLARE
  v_referral public.referrals%ROWTYPE;
  v_reward_amount DECIMAL(10,2);
  v_delivered_order_count INTEGER;
BEGIN
  IF NEW.delivery_status <> 'delivered'
     OR OLD.delivery_status = 'delivered'
     OR NEW.user_id IS NULL
     OR NEW.referral_reward_processed THEN
    RETURN NEW;
  END IF;

  SELECT *
  INTO v_referral
  FROM public.referrals
  WHERE referred_id = NEW.user_id
    AND status = 'pending'
  FOR UPDATE;

  IF v_referral.id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*)
  INTO v_delivered_order_count
  FROM public.orders
  WHERE user_id = NEW.user_id
    AND delivery_status = 'delivered';

  IF v_delivered_order_count <> 1 THEN
    RETURN NEW;
  END IF;

  v_reward_amount := LEAST(ROUND((NEW.total_amount * 0.10)::NUMERIC, 2), 70);

  IF v_reward_amount <= 0 THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.wallets (user_id, balance, created_at, updated_at)
  VALUES (v_referral.referrer_id, 0, NOW(), NOW())
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.wallets
  SET
    balance = balance + v_reward_amount,
    updated_at = NOW()
  WHERE user_id = v_referral.referrer_id;

  UPDATE public.referrals
  SET
    status = 'rewarded',
    reward_order_id = NEW.id,
    reward_amount = v_reward_amount,
    rewarded_at = NOW()
  WHERE id = v_referral.id;

  INSERT INTO public.wallet_transactions (
    wallet_user_id,
    amount,
    transaction_type,
    source_type,
    referral_id,
    order_id,
    description
  )
  VALUES (
    v_referral.referrer_id,
    v_reward_amount,
    'credit',
    'referral_reward',
    v_referral.id,
    NEW.id,
    'Referral reward credited after first delivered order'
  );

  UPDATE public.orders
  SET referral_reward_processed = TRUE
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_process_referral_reward ON public.orders;
CREATE TRIGGER tr_process_referral_reward
AFTER UPDATE OF delivery_status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.process_referral_reward();

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own wallet" ON public.wallets;
CREATE POLICY "Users view own wallet"
ON public.wallets
FOR SELECT TO authenticated
USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "Users view own referrals" ON public.referrals;
CREATE POLICY "Users view own referrals"
ON public.referrals
FOR SELECT TO authenticated
USING (auth.uid() = referrer_id OR auth.uid() = referred_id OR is_admin());

DROP POLICY IF EXISTS "Users view own wallet transactions" ON public.wallet_transactions;
CREATE POLICY "Users view own wallet transactions"
ON public.wallet_transactions
FOR SELECT TO authenticated
USING (auth.uid() = wallet_user_id OR is_admin());

DROP POLICY IF EXISTS "Admin full access on wallets" ON public.wallets;
CREATE POLICY "Admin full access on wallets"
ON public.wallets
FOR ALL TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admin full access on referrals" ON public.referrals;
CREATE POLICY "Admin full access on referrals"
ON public.referrals
FOR ALL TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admin full access on wallet_transactions" ON public.wallet_transactions;
CREATE POLICY "Admin full access on wallet_transactions"
ON public.wallet_transactions
FOR ALL TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

COMMIT;
