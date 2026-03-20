-- TITAN-CLASS DATABASE SETUP FOR VITZO
-- This script combines Schema, Seeding, RLS Fixes, and Storage Setup.
-- Designed for Idempotency: Can be run multiple times safely.

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

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'pending',
    total_amount DECIMAL(10,2) NOT NULL,
    shipping_house_no TEXT,
    shipping_street TEXT,
    shipping_landmark TEXT,
    shipping_area TEXT,
    mobile_number TEXT,
    payment_method TEXT,
    payment_status TEXT DEFAULT 'pending',
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

-- 3. ENABLE RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

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

-- Order Items: Users view and insert (THE CRITICAL FIX)
DROP POLICY IF EXISTS "Users view their own order items" ON order_items;
CREATE POLICY "Users view their own order items" ON order_items FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);
DROP POLICY IF EXISTS "Users insert their own order items" ON order_items;
CREATE POLICY "Users insert their own order items" ON order_items FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);

-- 5. ADMIN POLICIES (vitzo.hq@gmail.com)
DROP POLICY IF EXISTS "Admin manage categories" ON categories;
CREATE POLICY "Admin manage categories" ON categories FOR ALL TO authenticated USING (auth.jwt() ->> 'email' = 'vitzo.hq@gmail.com');
DROP POLICY IF EXISTS "Admin manage products" ON products;
CREATE POLICY "Admin manage products" ON products FOR ALL TO authenticated USING (auth.jwt() ->> 'email' = 'vitzo.hq@gmail.com');
DROP POLICY IF EXISTS "Admin manage orders" ON orders;
CREATE POLICY "Admin manage orders" ON orders FOR ALL TO authenticated USING (auth.jwt() ->> 'email' = 'vitzo.hq@gmail.com');
DROP POLICY IF EXISTS "Admin manage order items" ON order_items;
CREATE POLICY "Admin manage order items" ON order_items FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND auth.jwt() ->> 'email' = 'vitzo.hq@gmail.com')
);

-- 6. STORAGE SETUP
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Read Product Images" ON storage.objects;
CREATE POLICY "Public Read Product Images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Admin Manage Product Images" ON storage.objects;
CREATE POLICY "Admin Manage Product Images" ON storage.objects FOR ALL TO authenticated 
USING (bucket_id = 'product-images' AND (auth.jwt() ->> 'email' = 'vitzo.hq@gmail.com'));

-- 7. SEEDING DATA (WITH CORRECT IMAGE_URLS)
INSERT INTO categories (id, name, slug) VALUES 
('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Fresh Fruits', 'fruits'),
('a10b58cc-4372-a567-0e02-b2c3d479f47a', 'Fresh Vegetables', 'vegetables'),
('b58cc437-2a56-70e0-2b2c-3d479f47ac10', 'Dairy & Eggs', 'dairy-eggs'),
('cc4372a5-670e-02b2-c3d4-79f47ac10b58', 'Bakery', 'bakery')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (name, price, category_id, stock, image_url) VALUES
('Red Gala Apples', 180.00, 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 50, 'https://images.unsplash.com/photo-1560806887-1e4cd0b60b0?auto=format&fit=crop&q=80&w=800'),
('Fresh Organic Spinach', 40.00, 'a10b58cc-4372-a567-0e02-b2c3d479f47a', 30, 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&q=80&w=800'),
('Pure Farm Milk', 65.00, 'b58cc437-2a56-70e0-2b2c-3d479f47ac10', 100, 'https://images.unsplash.com/photo-1550583724-12558142c31e?auto=format&fit=crop&q=80&w=800'),
('Artisan Bread Rolls', 120.00, 'cc4372a5-670e-02b2-c3d4-79f47ac10b58', 20, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=800')
ON CONFLICT DO NOTHING;
