-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  stock INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles Table (Linked to Auth users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  mobile_number TEXT,
  house_no TEXT,
  street TEXT,
  landmark TEXT,
  area TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending', -- pending, processing, shipped, delivered, cancelled
  total_amount DECIMAL(10, 2) NOT NULL,
  shipping_house_no TEXT,
  shipping_street TEXT,
  shipping_landmark TEXT,
  shipping_area TEXT,
  mobile_number TEXT,
  payment_method TEXT, -- cod, upi
  payment_status TEXT DEFAULT 'pending', -- pending, completed, failed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  price_at_time_of_order DECIMAL(10, 2) NOT NULL
);

-- RLS Policies (Row Level Security)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Public read for categories and products
DROP POLICY IF EXISTS "Public Read Categories" ON categories;
CREATE POLICY "Public Read Categories" ON categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Products" ON products;
CREATE POLICY "Public Read Products" ON products FOR SELECT USING (true);

-- Admin policies (for vitzo.hq@gmail.com)
DROP POLICY IF EXISTS "Admin manage categories" ON categories;
CREATE POLICY "Admin manage categories" ON categories FOR ALL TO authenticated USING (auth.jwt() ->> 'email' = 'vitzo.hq@gmail.com');

DROP POLICY IF EXISTS "Admin manage products" ON products;
CREATE POLICY "Admin manage products" ON products FOR ALL TO authenticated USING (auth.jwt() ->> 'email' = 'vitzo.hq@gmail.com');

DROP POLICY IF EXISTS "Admin manage orders" ON orders;
CREATE POLICY "Admin manage orders" ON orders FOR ALL TO authenticated USING (auth.jwt() ->> 'email' = 'vitzo.hq@gmail.com');

DROP POLICY IF EXISTS "Admin manage order items" ON order_items;
CREATE POLICY "Admin manage order items" ON order_items FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND auth.jwt() ->> 'email' = 'vitzo.hq@gmail.com'
  )
);

-- Profiles: Users can manage their own profiles
DROP POLICY IF EXISTS "Users view their own profiles" ON profiles;
CREATE POLICY "Users view their own profiles" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users update their own profiles" ON profiles;
CREATE POLICY "Users update their own profiles" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users insert their own profiles" ON profiles;
CREATE POLICY "Users insert their own profiles" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Orders: Users can view and insert their own orders
DROP POLICY IF EXISTS "Users view their own orders" ON orders;
CREATE POLICY "Users view their own orders" ON orders FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert their own orders" ON orders;
CREATE POLICY "Users insert their own orders" ON orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Order Items: Users can view their own order items
DROP POLICY IF EXISTS "Users view their own order items" ON order_items;
CREATE POLICY "Users view their own order items" ON order_items FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
  )
);

-- Public Read for Categories and Products
DROP POLICY IF EXISTS "Public Read Categories" ON categories;
CREATE POLICY "Public Read Categories" ON categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Products" ON products;
CREATE POLICY "Public Read Products" ON products FOR SELECT USING (true);
