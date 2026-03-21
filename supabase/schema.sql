-- VITZO UNIFIED DATABASE SCHEMA (PRODUCTION-READY)
-- Run this in your Supabase SQL Editor.

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
    price DECIMAL(10,2) NOT NULL,
    category_id UUID REFERENCES categories(id),
    stock INTEGER DEFAULT 0,
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
    role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'agent', 'support')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Idempotent column addition for role in existing profiles
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='role') THEN
        ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'agent', 'support'));
    END IF;
END $$;

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

CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL,
    price_at_time_of_order DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

-- 3. SECURITY DEFINER FUNCTIONS (For RBAC without RLS infinite recursion)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM profiles WHERE id = auth.uid();
  RETURN v_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. ENABLE RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_ratings ENABLE ROW LEVEL SECURITY;

-- 5. RLS POLICIES (AUTHENTICATED USERS)

-- Categories & Products: Public Read
DROP POLICY IF EXISTS "Public Read Categories" ON categories;
CREATE POLICY "Public Read Categories" ON categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Products" ON products;
CREATE POLICY "Public Read Products" ON products FOR SELECT USING (true);

-- Profiles
DROP POLICY IF EXISTS "Users view their own profiles" ON profiles;
CREATE POLICY "Users view their own profiles" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id OR is_admin());
DROP POLICY IF EXISTS "Users update their own profiles" ON profiles;
CREATE POLICY "Users update their own profiles" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users insert their own profiles" ON profiles;
CREATE POLICY "Users insert their own profiles" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Orders
DROP POLICY IF EXISTS "Users view their own orders" ON orders;
CREATE POLICY "Users view their own orders" ON orders FOR SELECT TO authenticated USING (
    auth.uid() = user_id OR 
    agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid()) OR
    is_admin()
);
-- NOTE: Manual INSERT policy on orders/order_items removed. We now enforce process_checkout RPC.

-- Agents: Update assigned orders
DROP POLICY IF EXISTS "Agents update assigned orders" ON orders;
CREATE POLICY "Agents update assigned orders" ON orders 
FOR UPDATE TO authenticated 
USING (agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())) 
WITH CHECK (agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid()));

-- Order Items
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

-- Agents
DROP POLICY IF EXISTS "Agents view own" ON agents;
CREATE POLICY "Agents view own" ON agents FOR SELECT TO authenticated USING (auth.uid() = user_id OR is_admin());
DROP POLICY IF EXISTS "Agents update own status" ON agents;
CREATE POLICY "Agents update own status" ON agents FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users insert own agent application" ON agents;
CREATE POLICY "Users insert own agent application" ON agents FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Public view agent stats" ON agents;
CREATE POLICY "Public view agent stats" ON agents FOR SELECT USING (status = 'approved');

-- Agent Ratings
DROP POLICY IF EXISTS "Users insert agent ratings" ON agent_ratings;
CREATE POLICY "Users insert agent ratings" ON agent_ratings FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = agent_ratings.order_id AND orders.user_id = auth.uid())
);
DROP POLICY IF EXISTS "Agents view their ratings" ON agent_ratings;
CREATE POLICY "Agents view their ratings" ON agent_ratings FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM agents WHERE agents.id = agent_ratings.agent_id AND agents.user_id = auth.uid())
);

-- 6. ADMIN POLICIES (Dynamic RBAC instead of hardcoded emails)
DO $$ 
DECLARE 
    tbl RECORD;
BEGIN
    FOR tbl IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('categories', 'products', 'orders', 'order_items', 'profiles', 'agents', 'agent_ratings'))
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

-- Update Agent Stats
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

-- Generate Delivery PIN
CREATE OR REPLACE FUNCTION generate_delivery_pin()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.delivery_status = 'out_for_delivery' AND OLD.delivery_status != 'out_for_delivery' THEN
        NEW.delivery_pin := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Secure PIN Verification RPC
CREATE OR REPLACE FUNCTION verify_delivery_pin(p_order_id UUID, p_entered_pin TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_actual_pin TEXT;
    v_agent_id UUID;
BEGIN
    -- Get the actual pin and the assigned agent
    SELECT delivery_pin, agent_id INTO v_actual_pin, v_agent_id 
    FROM orders 
    WHERE id = p_order_id;

    -- Security: Only the assigned agent (or admin) can verify the pin
    IF v_agent_id NOT IN (SELECT id FROM agents WHERE user_id = auth.uid()) 
       AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- Verify and Update
    IF v_actual_pin = p_entered_pin THEN
        UPDATE orders 
        SET delivery_status = 'delivered' 
        WHERE id = p_order_id;
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_generate_pin ON orders;
CREATE TRIGGER tr_generate_pin BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION generate_delivery_pin();

-- TRANSACTIONAL CHECKOUT FUNCTION (Atomic Order Creation & Inventory Check)
CREATE OR REPLACE FUNCTION process_checkout(
  p_total_amount DECIMAL, 
  p_shipping_house_no TEXT,
  p_shipping_street TEXT,
  p_shipping_landmark TEXT,
  p_shipping_area TEXT,
  p_mobile_number TEXT,
  p_payment_method TEXT,
  p_items JSONB -- Array of { product_id, quantity, price }
) RETURNS UUID AS $$
DECLARE
  v_order_id UUID;
  item JSONB;
  v_current_stock INTEGER;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. Create the order
  INSERT INTO orders (
    user_id, total_amount, status, delivery_status, 
    shipping_house_no, shipping_street, shipping_landmark, shipping_area, 
    mobile_number, payment_method, payment_status
  )
  VALUES (
    v_user_id, p_total_amount, 'pending', 'ready_for_pickup', 
    p_shipping_house_no, p_shipping_street, p_shipping_landmark, p_shipping_area, 
    p_mobile_number, p_payment_method, 'pending'
  )
  RETURNING id INTO v_order_id;

  -- 2. Loop through items to deduct stock
  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Pessimistic row locking: blocks other checkouts from taking this item's stock simultaneously 
    SELECT stock INTO v_current_stock FROM products 
    WHERE id = (item->>'product_id')::UUID FOR UPDATE;

    IF v_current_stock < (item->>'quantity')::INTEGER THEN
      RAISE EXCEPTION 'Not enough stock for product %', item->>'product_id';
    END IF;

    UPDATE products 
    SET stock = stock - (item->>'quantity')::INTEGER
    WHERE id = (item->>'product_id')::UUID;

    INSERT INTO order_items (order_id, product_id, quantity, price_at_time_of_order)
    VALUES (v_order_id, (item->>'product_id')::UUID, (item->>'quantity')::INTEGER, (item->>'price')::DECIMAL);
  END LOOP;

  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Auto Assign Order to Agent
CREATE OR REPLACE FUNCTION auto_assign_order_to_agent()
RETURNS TRIGGER AS $$
DECLARE
    target_agent_id UUID;
BEGIN
    IF NEW.delivery_status = 'ready_for_pickup' AND (OLD.delivery_status IS NULL OR OLD.delivery_status != 'ready_for_pickup') THEN
        SELECT id INTO target_agent_id
        FROM agents
        WHERE status = 'approved' 
          AND is_active = true 
          AND working_area = NEW.shipping_area
        ORDER BY total_orders ASC
        LIMIT 1;

        IF target_agent_id IS NOT NULL THEN
            NEW.agent_id := target_agent_id;
            NEW.delivery_status := 'assigned';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_auto_assign_order ON orders;
CREATE TRIGGER tr_auto_assign_order BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION auto_assign_order_to_agent();

-- 9. SEEDING (Idempotent)
INSERT INTO categories (id, name, slug) VALUES 
('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Fresh Fruits', 'fruits'),
('a10b58cc-4372-a567-0e02-b2c3d479f47a', 'Fresh Vegetables', 'vegetables'),
('b58cc437-2a56-70e0-2b2c-3d479f47ac10', 'Dairy & Eggs', 'dairy-eggs'),
('cc4372a5-670e-02b2-c3d4-79f47ac10b58', 'Bakery', 'bakery')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (name, price, category_id, stock, image_url, description) VALUES
('Red Gala Apples', 180.00, 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 50, 'https://images.unsplash.com/photo-1560806887-1e4cd0b60b0?auto=format&fit=crop&q=80&w=800', 'Sweet and crunchy organic Apples.'),
('Fresh Organic Spinach', 40.00, 'a10b58cc-4372-a567-0e02-b2c3d479f47a', 30, 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&q=80&w=800', 'Nutrient-rich vibrant green Spinach.'),
('Pure Farm Milk', 65.00, 'b58cc437-2a56-70e0-2b2c-3d479f47ac10', 100, 'https://images.unsplash.com/photo-1550583724-12558142c31e?auto=format&fit=crop&q=80&w=800', 'Freshly sourced high-quality Farm Milk.'),
('Artisan Bread Rolls', 120.00, 'cc4372a5-670e-02b2-c3d4-79f47ac10b58', 20, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=800', 'Soft and warm artisan-baked bread.')
ON CONFLICT DO NOTHING;