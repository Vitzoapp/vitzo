-- DATA_FIX.sql
-- Run this in your Supabase SQL Editor to fix existing broken product images.

UPDATE products 
SET image_url = 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=800&q=80'
WHERE name = 'Premium Beef Cuts';

UPDATE products 
SET image_url = 'https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?auto=format&fit=crop&w=800&q=80'
WHERE name = 'Fresh Atlantic Salmon';

-- Add structured address columns if they don't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='house_no') THEN
    ALTER TABLE profiles ADD COLUMN house_no TEXT, ADD COLUMN street TEXT, ADD COLUMN landmark TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='shipping_house_no') THEN
    ALTER TABLE orders ADD COLUMN shipping_house_no TEXT, ADD COLUMN shipping_street TEXT, ADD COLUMN shipping_landmark TEXT;
  END IF;
END $$;

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
