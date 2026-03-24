-- VITZO UNIFIED DATABASE SCHEMA (PRODUCTION-READY)
-- Run this in your Supabase SQL Editor to initialize a fresh project.

-- 1. BASE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    real_price DECIMAL(10,2) NOT NULL,
    commission DECIMAL(10,2) NOT NULL DEFAULT 0,
    final_price DECIMAL(10,2) GENERATED ALWAYS AS (real_price + commission) STORED,
    unit_type TEXT NOT NULL DEFAULT 'weight' CHECK (unit_type IN ('weight', 'volume', 'discrete')),
    allowed_units JSONB NOT NULL DEFAULT '["g","kg"]'::jsonb CHECK (jsonb_typeof(allowed_units) = 'array'),
    category_id UUID REFERENCES categories(id),
    image_url TEXT,
    description TEXT,
    specifications JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    full_name TEXT,
    mobile_number TEXT,
    house_no TEXT,
    street TEXT,
    landmark TEXT,
    area TEXT,
    referral_code TEXT UNIQUE,
    role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'agent', 'support')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallets (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    balance DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referred_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    referral_code_used TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'rewarded', 'cancelled')),
    reward_order_id UUID NULL,
    reward_amount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (reward_amount >= 0),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    rewarded_at TIMESTAMP WITH TIME ZONE NULL,
    CONSTRAINT referrals_no_self_referral CHECK (referrer_id <> referred_id)
);

CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) UNIQUE,
    full_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'terminated')),
    is_active BOOLEAN DEFAULT false,
    salary DECIMAL(10,2) DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0,
    working_area TEXT CHECK (working_area IN ('Ramanattukara', 'Azhinjilam', 'Farook College')),
    vehicle_type TEXT CHECK (vehicle_type IN ('Bike', 'Scooter', 'Car', 'Van')),
    license_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    agent_id UUID REFERENCES agents(id),
    status TEXT DEFAULT 'pending',
    delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'ready_for_pickup', 'assigned', 'out_for_delivery', 'delivered')),
    total_amount DECIMAL(10,2) NOT NULL,
    wallet_amount_used DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (wallet_amount_used >= 0),
    final_amount_due DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (final_amount_due >= 0),
    referral_reward_processed BOOLEAN NOT NULL DEFAULT FALSE,
    shipping_house_no TEXT,
    shipping_street TEXT,
    shipping_landmark TEXT,
    shipping_area TEXT,
    mobile_number TEXT,
    payment_method TEXT,
    payment_status TEXT DEFAULT 'pending',
    delivery_pin TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE referrals
    DROP CONSTRAINT IF EXISTS referrals_reward_order_id_fkey;

ALTER TABLE referrals
    ADD CONSTRAINT referrals_reward_order_id_fkey
    FOREIGN KEY (reward_order_id) REFERENCES orders(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL,
    selected_weight_grams INTEGER NOT NULL DEFAULT 1000,
    price_at_time_of_order DECIMAL(10,2) NOT NULL,
    real_price_per_kg DECIMAL(10,2) NOT NULL DEFAULT 0,
    commission_per_kg DECIMAL(10,2) NOT NULL DEFAULT 0,
    final_price_per_kg DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('credit', 'debit')),
    source_type TEXT NOT NULL CHECK (source_type IN ('referral_reward', 'order_payment', 'manual_adjustment')),
    referral_id UUID NULL REFERENCES referrals(id) ON DELETE SET NULL,
    order_id UUID NULL REFERENCES orders(id) ON DELETE SET NULL,
    description TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) UNIQUE,
    agent_id UUID REFERENCES agents(id),
    user_id UUID REFERENCES auth.users(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. SECURITY DEFINER FUNCTIONS
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM profiles WHERE id = auth.uid();
  RETURN v_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP VIEW IF EXISTS product_catalog;
CREATE VIEW product_catalog AS
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
FROM products p
LEFT JOIN categories c ON c.id = p.category_id;

GRANT SELECT ON product_catalog TO anon, authenticated;

-- 4. ENABLE RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_ratings ENABLE ROW LEVEL SECURITY;

-- 5. RLS POLICIES
DROP POLICY IF EXISTS "Public Read Categories" ON categories;
CREATE POLICY "Public Read Categories" ON categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users view their own profiles" ON profiles;
CREATE POLICY "Users view their own profiles" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id OR is_admin());
DROP POLICY IF EXISTS "Users update their own profiles" ON profiles;
CREATE POLICY "Users update their own profiles" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users insert their own profiles" ON profiles;
CREATE POLICY "Users insert their own profiles" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users view own wallet" ON wallets;
CREATE POLICY "Users view own wallet" ON wallets FOR SELECT TO authenticated USING (auth.uid() = user_id OR is_admin());
DROP POLICY IF EXISTS "Users view own referrals" ON referrals;
CREATE POLICY "Users view own referrals" ON referrals FOR SELECT TO authenticated USING (auth.uid() = referrer_id OR auth.uid() = referred_id OR is_admin());
DROP POLICY IF EXISTS "Users view own wallet transactions" ON wallet_transactions;
CREATE POLICY "Users view own wallet transactions" ON wallet_transactions FOR SELECT TO authenticated USING (auth.uid() = wallet_user_id OR is_admin());

DROP POLICY IF EXISTS "Users view their own orders" ON orders;
CREATE POLICY "Users view their own orders" ON orders FOR SELECT TO authenticated USING (
    auth.uid() = user_id OR 
    agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid()) OR
    is_admin()
);

DROP POLICY IF EXISTS "Agents update assigned orders" ON orders;
CREATE POLICY "Agents update assigned orders" ON orders 
FOR UPDATE TO authenticated 
USING (agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())) 
WITH CHECK (agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users view their own order items" ON order_items;
CREATE POLICY "Users view their own order items" ON order_items FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM orders 
        WHERE orders.id = order_items.order_id 
        AND (
            orders.user_id = auth.uid() OR 
            orders.agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
        )
    ) OR is_admin()
);

DROP POLICY IF EXISTS "Agents view own" ON agents;
CREATE POLICY "Agents view own" ON agents FOR SELECT TO authenticated USING (auth.uid() = user_id OR is_admin());
DROP POLICY IF EXISTS "Agents update own status" ON agents;
CREATE POLICY "Agents update own status" ON agents FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users insert own agent application" ON agents;
CREATE POLICY "Users insert own agent application" ON agents FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Public view agent stats" ON agents;
CREATE POLICY "Public view agent stats" ON agents FOR SELECT USING (status = 'approved');

DROP POLICY IF EXISTS "Users insert agent ratings" ON agent_ratings;
CREATE POLICY "Users insert agent ratings" ON agent_ratings FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = agent_ratings.order_id AND orders.user_id = auth.uid())
);
DROP POLICY IF EXISTS "Agents view their ratings" ON agent_ratings;
CREATE POLICY "Agents view their ratings" ON agent_ratings FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM agents WHERE agents.id = agent_ratings.agent_id AND agents.user_id = auth.uid())
);

-- 6. ADMIN POLICIES
DO $$ 
DECLARE 
    tbl RECORD;
BEGIN
    FOR tbl IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('categories', 'products', 'orders', 'order_items', 'profiles', 'agents', 'agent_ratings', 'wallets', 'referrals', 'wallet_transactions'))
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Admin full access on %I" ON %I', tbl.tablename, tbl.tablename);
        EXECUTE format('CREATE POLICY "Admin full access on %I" ON %I FOR ALL TO authenticated USING (is_admin())', tbl.tablename, tbl.tablename);
    END LOOP;
END $$;

-- 7. STORAGE SETUP
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Read Product Images" ON storage.objects;
CREATE POLICY "Public Read Product Images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
DROP POLICY IF EXISTS "Admin Manage Product Images" ON storage.objects;
CREATE POLICY "Admin Manage Product Images" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'product-images' AND is_admin());

-- 8. FUNCTIONS AND TRIGGERS

CREATE OR REPLACE FUNCTION update_agent_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'agent_ratings' THEN
        UPDATE agents SET average_rating = (SELECT AVG(rating)::DECIMAL(3,2) FROM agent_ratings WHERE agent_id = NEW.agent_id) WHERE id = NEW.agent_id;
    END IF;
    IF TG_TABLE_NAME = 'orders' AND NEW.delivery_status = 'delivered' AND OLD.delivery_status != 'delivered' AND NEW.agent_id IS NOT NULL THEN
        UPDATE agents SET total_orders = total_orders + 1 WHERE id = NEW.agent_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_update_agent_rating ON agent_ratings;
CREATE TRIGGER tr_update_agent_rating AFTER INSERT ON agent_ratings FOR EACH ROW EXECUTE FUNCTION update_agent_stats();
DROP TRIGGER IF EXISTS tr_update_agent_orders ON orders;
CREATE TRIGGER tr_update_agent_orders AFTER UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_agent_stats();

CREATE OR REPLACE FUNCTION generate_delivery_pin()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.delivery_status = 'out_for_delivery' AND OLD.delivery_status != 'out_for_delivery' THEN
        NEW.delivery_pin := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_generate_pin ON orders;
CREATE TRIGGER tr_generate_pin BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION generate_delivery_pin();

CREATE OR REPLACE FUNCTION verify_delivery_pin(p_order_id UUID, p_entered_pin TEXT)
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

CREATE OR REPLACE FUNCTION register_referral(p_referral_code TEXT)
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
  FROM profiles
  WHERE referral_code = UPPER(TRIM(p_referral_code));

  IF v_referrer_id IS NULL THEN
    RAISE EXCEPTION 'INVALID_REFERRAL_CODE';
  END IF;

  IF v_referrer_id = v_user_id THEN
    RAISE EXCEPTION 'SELF_REFERRAL_NOT_ALLOWED';
  END IF;

  SELECT referrer_id
  INTO v_existing_referrer
  FROM referrals
  WHERE referred_id = v_user_id;

  IF v_existing_referrer IS NOT NULL THEN
    IF v_existing_referrer = v_referrer_id THEN
      RETURN;
    END IF;

    RAISE EXCEPTION 'REFERRAL_ALREADY_LINKED';
  END IF;

  SELECT COUNT(*)
  INTO v_existing_orders
  FROM orders
  WHERE user_id = v_user_id;

  IF v_existing_orders > 0 THEN
    RAISE EXCEPTION 'REFERRAL_WINDOW_CLOSED';
  END IF;

  INSERT INTO referrals (referrer_id, referred_id, referral_code_used, status)
  VALUES (v_referrer_id, v_user_id, UPPER(TRIM(p_referral_code)), 'pending');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION process_checkout(
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
    v_weight_grams := (item->>'weight_grams')::INTEGER;
    v_item_quantity := (item->>'quantity')::INTEGER;

    IF v_weight_grams IS NULL OR v_weight_grams <= 0 OR v_item_quantity IS NULL OR v_item_quantity <= 0 THEN
      RAISE EXCEPTION 'INVALID_WEIGHT_SELECTION';
    END IF;

    SELECT real_price, commission, final_price
    INTO v_real_price_per_kg, v_commission_per_kg, v_final_price_per_kg
    FROM products
    WHERE id = (item->>'product_id')::UUID;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'PRODUCT_NOT_FOUND:%', item->>'product_id';
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

  INSERT INTO wallets (user_id, balance, created_at, updated_at)
  VALUES (v_user_id, 0, NOW(), NOW())
  ON CONFLICT (user_id) DO NOTHING;

  SELECT balance
  INTO v_wallet_balance
  FROM wallets
  WHERE user_id = v_user_id
  FOR UPDATE;

  IF v_wallet_amount_to_use > COALESCE(v_wallet_balance, 0) THEN
    RAISE EXCEPTION 'INSUFFICIENT_WALLET_BALANCE';
  END IF;

  INSERT INTO orders (
    user_id, total_amount, status, delivery_status, 
    shipping_house_no, shipping_street, shipping_landmark, shipping_area, 
    mobile_number, payment_method, payment_status, wallet_amount_used, final_amount_due
  )
  VALUES (
    v_user_id, v_verified_total, 'pending', 'ready_for_pickup', 
    p_shipping_house_no, p_shipping_street, p_shipping_landmark, p_shipping_area, 
    p_mobile_number, p_payment_method,
    CASE WHEN (v_verified_total - v_wallet_amount_to_use) = 0 THEN 'paid' ELSE 'pending' END,
    v_wallet_amount_to_use,
    v_verified_total - v_wallet_amount_to_use
  )
  RETURNING id INTO v_order_id;

  IF v_wallet_amount_to_use > 0 THEN
    UPDATE wallets
    SET balance = balance - v_wallet_amount_to_use, updated_at = NOW()
    WHERE user_id = v_user_id;

    INSERT INTO wallet_transactions (
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
    v_weight_grams := (item->>'weight_grams')::INTEGER;
    v_item_quantity := (item->>'quantity')::INTEGER;

    SELECT real_price, commission, final_price
    INTO v_real_price_per_kg, v_commission_per_kg, v_final_price_per_kg
    FROM products
    WHERE id = (item->>'product_id')::UUID;

    v_line_unit_price := ROUND(((v_final_price_per_kg * v_weight_grams) / 1000.0)::NUMERIC, 2);

    INSERT INTO order_items (
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
      (item->>'product_id')::UUID,
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

CREATE OR REPLACE FUNCTION process_referral_reward()
RETURNS TRIGGER AS $$
DECLARE
  v_referral referrals%ROWTYPE;
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
  FROM referrals
  WHERE referred_id = NEW.user_id
    AND status = 'pending'
  FOR UPDATE;

  IF v_referral.id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*)
  INTO v_delivered_order_count
  FROM orders
  WHERE user_id = NEW.user_id
    AND delivery_status = 'delivered';

  IF v_delivered_order_count <> 1 THEN
    RETURN NEW;
  END IF;

  v_reward_amount := LEAST(ROUND((NEW.total_amount * 0.10)::NUMERIC, 2), 70);

  IF v_reward_amount <= 0 THEN
    RETURN NEW;
  END IF;

  INSERT INTO wallets (user_id, balance, created_at, updated_at)
  VALUES (v_referral.referrer_id, 0, NOW(), NOW())
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE wallets
  SET balance = balance + v_reward_amount, updated_at = NOW()
  WHERE user_id = v_referral.referrer_id;

  UPDATE referrals
  SET
    status = 'rewarded',
    reward_order_id = NEW.id,
    reward_amount = v_reward_amount,
    rewarded_at = NOW()
  WHERE id = v_referral.id;

  INSERT INTO wallet_transactions (
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

  UPDATE orders
  SET referral_reward_processed = TRUE
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_total_delivered_profit()
RETURNS DECIMAL AS $$
DECLARE
  v_profit DECIMAL(12,2);
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'UNAUTHORIZED';
  END IF;

  SELECT COALESCE(
    ROUND(SUM(((oi.commission_per_kg * oi.selected_weight_grams) / 1000.0) * oi.quantity)::NUMERIC, 2),
    0
  )
  INTO v_profit
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  WHERE o.delivery_status = 'delivered' OR o.status = 'delivered';

  RETURN COALESCE(v_profit, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auto_assign_order_to_agent()
RETURNS TRIGGER AS $$
DECLARE
    target_agent_id UUID;
BEGIN
    IF NEW.delivery_status = 'ready_for_pickup' AND (OLD.delivery_status IS NULL OR OLD.delivery_status != 'ready_for_pickup') THEN
        SELECT id INTO target_agent_id FROM agents
        WHERE status = 'approved' AND is_active = true AND working_area = NEW.shipping_area
        ORDER BY total_orders ASC LIMIT 1;
        IF target_agent_id IS NOT NULL THEN
            NEW.agent_id := target_agent_id;
            NEW.delivery_status := 'assigned';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_auto_assign_order ON orders;
CREATE TRIGGER tr_auto_assign_order BEFORE INSERT OR UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION auto_assign_order_to_agent();
DROP TRIGGER IF EXISTS tr_process_referral_reward ON orders;
CREATE TRIGGER tr_process_referral_reward AFTER UPDATE OF delivery_status ON orders FOR EACH ROW EXECUTE FUNCTION process_referral_reward();

-- 9. SEEDING
INSERT INTO categories (id, name, slug) VALUES 
('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Fresh Fruits', 'fruits'),
('a10b58cc-4372-a567-0e02-b2c3d479f47a', 'Fresh Vegetables', 'vegetables'),
('b58cc437-2a56-70e0-2b2c-3d479f47ac10', 'Dairy & Eggs', 'dairy-eggs'),
('cc4372a5-670e-02b2-c3d4-79f47ac10b58', 'Bakery', 'bakery')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (name, real_price, commission, category_id, image_url, description) VALUES
('Red Gala Apples', 150.00, 30.00, 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 'https://images.unsplash.com/photo-1560806887-1e4cd0b60b0?auto=format&fit=crop&q=80&w=800', 'Sweet and crunchy organic Apples.'),
('Fresh Organic Spinach', 32.00, 8.00, 'a10b58cc-4372-a567-0e02-b2c3d479f47a', 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&q=80&w=800', 'Nutrient-rich vibrant green Spinach.'),
('Pure Farm Milk', 52.00, 13.00, 'b58cc437-2a56-70e0-2b2c-3d479f47ac10', 'https://images.unsplash.com/photo-1550583724-12558142c31e?auto=format&fit=crop&q=80&w=800', 'Freshly sourced high-quality Farm Milk.'),
('Artisan Bread Rolls', 96.00, 24.00, 'cc4372a5-670e-02b2-c3d4-79f47ac10b58', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=800', 'Soft and warm artisan-baked bread.')
ON CONFLICT DO NOTHING;

-- 10. FINAL GRANT: Admin Access for vitzo.hq@gmail.com
-- This ensures that the specified email is ALWAYS granted admin role upon profile creation/sync.
INSERT INTO profiles (id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'vitzo.hq@gmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';
