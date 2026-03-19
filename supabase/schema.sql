-- Categories Table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products Table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  stock INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles Table (Linked to Auth users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders Table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending', -- pending, processing, shipped, delivered, cancelled
  total_amount DECIMAL(10, 2) NOT NULL,
  shipping_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order Items Table
CREATE TABLE order_items (
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
CREATE POLICY "Public Read Categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public Read Products" ON products FOR SELECT USING (true);

-- Profiles: Users can read/write their own profiles
CREATE POLICY "Users view their own profiles" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update their own profiles" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Orders: Users can view their own orders
CREATE POLICY "Users view their own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert their own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Order Items: Users can view their own order items
CREATE POLICY "Users view their own order items" ON order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
  )
);
