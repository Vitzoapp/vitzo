
-- ENABLE UUID EXTENSION
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Products Table
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

-- Ensure UNIQUE constraint on products(name) for seeding to work
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'products_name_key' 
        AND conrelid = 'products'::regclass
    ) THEN 
        ALTER TABLE products ADD CONSTRAINT products_name_key UNIQUE (name); 
    END IF; 
END $$;

-- 3. Create Profiles Table (Linked to Auth users)
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

-- 4. Create Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending',
  total_amount DECIMAL(10, 2) NOT NULL,
  shipping_house_no TEXT,
  shipping_street TEXT,
  shipping_landmark TEXT,
  shipping_area TEXT,
  mobile_number TEXT,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  price_at_time_of_order DECIMAL(10, 2) NOT NULL
);

-- 6. Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. RLS Policies
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Polices (DROP if exist to avoid errors)
DROP POLICY IF EXISTS "Public Read Categories" ON categories;
CREATE POLICY "Public Read Categories" ON categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Products" ON products;
CREATE POLICY "Public Read Products" ON products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users view their own profiles" ON profiles;
CREATE POLICY "Users view their own profiles" ON profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users update their own profiles" ON profiles;
CREATE POLICY "Users update their own profiles" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Admin policies
CREATE POLICY "Admin manage categories" ON categories FOR ALL TO authenticated USING (auth.jwt() ->> 'email' = 'vitzo.hq@gmail.com');
CREATE POLICY "Admin manage products" ON products FOR ALL TO authenticated USING (auth.jwt() ->> 'email' = 'vitzo.hq@gmail.com');
CREATE POLICY "Admin manage orders" ON orders FOR ALL TO authenticated USING (auth.jwt() ->> 'email' = 'vitzo.hq@gmail.com');
CREATE POLICY "Admin manage order items" ON order_items FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND auth.jwt() ->> 'email' = 'vitzo.hq@gmail.com'
  )
);

DROP POLICY IF EXISTS "Users view their own orders" ON orders;
CREATE POLICY "Users view their own orders" ON orders FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert their own orders" ON orders;
CREATE POLICY "Users insert their own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users view their own order items" ON order_items;
CREATE POLICY "Users view their own order items" ON order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
  )
);

-- 8. DATA SEEDING

-- Populate categories
INSERT INTO categories (name, slug) VALUES 
('Fresh Fruits', 'fruits'),
('Fresh Vegetables', 'vegetables'),
('Dairy & Eggs', 'dairy-eggs'),
('Bakery', 'bakery'),
('Meat & Seafood', 'meat-seafood'),
('Beverages', 'beverages'),
('Pantry', 'pantry'),
('Snacks', 'snacks')
ON CONFLICT (slug) DO NOTHING;

-- Populate products
INSERT INTO products (name, price, category_id, image_url, stock)
SELECT 'Red Gala Apples', 180, id, 'https://images.unsplash.com/photo-1560806887-1e4cd0b6bcd6?auto=format&fit=crop&w=800&q=80', 50 FROM categories WHERE slug = 'fruits'
UNION ALL
SELECT 'Fresh Organic Spinach', 40, id, 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=800&q=80', 100 FROM categories WHERE slug = 'vegetables'
UNION ALL
SELECT 'Pure Farm Milk', 65, id, 'https://images.unsplash.com/photo-1561115320-30232463e275?auto=format&fit=crop&w=800&q=80', 30 FROM categories WHERE slug = 'dairy-eggs'
UNION ALL
SELECT 'Artisan Bread Rolls', 120, id, 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=800&q=80', 20 FROM categories WHERE slug = 'bakery'
UNION ALL
SELECT 'Premium Beef Cuts', 850, id, 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=800&q=80', 15 FROM categories WHERE slug = 'meat-seafood'
UNION ALL
SELECT 'Farm Fresh Eggs (12pk)', 90, id, 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=800&q=80', 40 FROM categories WHERE slug = 'dairy-eggs'
UNION ALL
SELECT 'Aged Cheddar Cheese', 450, id, 'https://images.unsplash.com/photo-1485962391045-da6013ad6645?auto=format&fit=crop&w=800&q=80', 25 FROM categories WHERE slug = 'dairy-eggs'
UNION ALL
SELECT 'Single Origin Coffee', 1200, id, 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80', 20 FROM categories WHERE slug = 'pantry'
UNION ALL
SELECT 'Fresh Orange Juice', 150, id, 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=800&q=80', 30 FROM categories WHERE slug = 'beverages'
UNION ALL
SELECT 'Organic Penne Pasta', 210, id, 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80', 60 FROM categories WHERE slug = 'pantry'
UNION ALL
SELECT 'Mixed Gourmet Nuts', 450, id, 'https://images.unsplash.com/photo-1511067007398-7e4b90cfa4bc?auto=format&fit=crop&w=800&q=80', 50 FROM categories WHERE slug = 'snacks'
UNION ALL
SELECT 'Fresh Atlantic Salmon', 1500, id, 'https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?auto=format&fit=crop&w=800&q=80', 10 FROM categories WHERE slug = 'meat-seafood'
ON CONFLICT (name) DO UPDATE SET image_url = EXCLUDED.image_url, price = EXCLUDED.price;
