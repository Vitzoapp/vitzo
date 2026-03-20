-- SUPABASE RLS FIX FOR ORDER PLACEMENT
-- Run this in your Supabase SQL Editor to allow authenticated users to place orders.

-- 1. Orders: Users can insert their own orders
DROP POLICY IF EXISTS "Users insert their own orders" ON orders;
CREATE POLICY "Users insert their own orders" ON orders 
FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- 2. Order Items: Users can insert their own order items (THE CRITICAL FIX)
-- This policy ensures the items being inserted belong to an order owned by the user.
DROP POLICY IF EXISTS "Users insert their own order items" ON order_items;
CREATE POLICY "Users insert their own order items" ON order_items 
FOR INSERT TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id = auth.uid()
  )
);

-- 3. Also ensure SELECT is allowed for the user's own items
DROP POLICY IF EXISTS "Users view their own order items" ON order_items;
CREATE POLICY "Users view their own order items" ON order_items 
FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id = auth.uid()
  )
);
