-- VITZO UNIFIED DATABASE SCHEMA
-- This script combines all tables, policies, triggers, and seeding into one idempotent file.
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
    status TEXT DEFAULT 'pending',
    delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'assigned', 'out_for_delivery', 'delivered')),
    total_amount DECIMAL(10,2) NOT NULL,
    shipping_house_no TEXT,
    shipping_street TEXT,
    shipping_landmark TEXT,
    shipping_area TEXT,
    mobile_number TEXT,
    payment_method TEXT,
    payment_status TEXT DEFAULT 'pending',
    agent_id UUID REFERENCES agents(id),
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

-- 3. ENABLE RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_ratings ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES (AUTHENTICATED USERS)

-- Categories: Public Read
DROP POLICY IF EXISTS "Public Read Categories" ON categories;
CREATE POLICY "Public Read Categories" ON categories FOR SELECT USING (true);

-- Products: Public Read
DROP POLICY IF EXISTS "Public Read Products" ON products;
CREATE POLICY "Public Read Products" ON products FOR SELECT USING (true);

-- Profiles: Users manage own
DROP POLICY IF EXISTS "Users view their own profiles" ON profiles;
CREATE POLICY "Users view their own profiles" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users update their own profiles" ON profiles;
CREATE POLICY "Users update their own profiles" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users insert their own profiles" ON profiles;
CREATE POLICY "Users insert their own profiles" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Orders: Users view and insert
DROP POLICY IF EXISTS "Users view their own orders" ON orders;
CREATE POLICY "Users view their own orders" ON orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users insert their own orders" ON orders;
CREATE POLICY "Users insert their own orders" ON orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Order Items: Users view and insert
DROP POLICY IF EXISTS "Users view their own order items" ON order_items;
CREATE POLICY "Users view their own order items" ON order_items FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);
DROP POLICY IF EXISTS "Users insert their own order items" ON order_items;
CREATE POLICY "Users insert their own order items" ON order_items FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);

-- Agents: Own record and public stats
DROP POLICY IF EXISTS "Agents view own" ON agents;
CREATE POLICY "Agents view own" ON agents FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users insert own agent application" ON agents;
CREATE POLICY "Users insert own agent application" ON agents FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Public view agent stats" ON agents;
CREATE POLICY "Public view agent stats" ON agents FOR SELECT USING (status = 'approved');

-- Agent Ratings: Insert and View
DROP POLICY IF EXISTS "Users insert agent ratings" ON agent_ratings;
CREATE POLICY "Users insert agent ratings" ON agent_ratings FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = agent_ratings.order_id AND orders.user_id = auth.uid())
);
DROP POLICY IF EXISTS "Agents view their ratings" ON agent_ratings;
CREATE POLICY "Agents view their ratings" ON agent_ratings FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM agents WHERE agents.id = agent_ratings.agent_id AND agents.user_id = auth.uid())
);

-- 5. ADMIN POLICIES (vitzo.hq@gmail.com)
DO $$ 
DECLARE 
    tbl RECORD;
BEGIN
    FOR tbl IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('categories', 'products', 'orders', 'order_items', 'profiles', 'agents', 'agent_ratings'))
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Admin full access on %I" ON %I', tbl.tablename, tbl.tablename);
        EXECUTE format('CREATE POLICY "Admin full access on %I" ON %I FOR ALL TO authenticated USING (auth.jwt() ->> ''email'' = ''vitzo.hq@gmail.com'')', tbl.tablename, tbl.tablename);
    END LOOP;
END $$;

-- 6. STORAGE SETUP
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Read Product Images" ON storage.objects;
CREATE POLICY "Public Read Product Images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
DROP POLICY IF EXISTS "Admin Manage Product Images" ON storage.objects;
CREATE POLICY "Admin Manage Product Images" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'product-images' AND (auth.jwt() ->> 'email' = 'vitzo.hq@gmail.com'));

-- 7. FUNCTIONS AND TRIGGERS

-- Update Agent Stats (Rating and Orders)
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

DROP TRIGGER IF EXISTS tr_generate_pin ON orders;
CREATE TRIGGER tr_generate_pin BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION generate_delivery_pin();

-- 8. SEEDING (Idempotent)
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
