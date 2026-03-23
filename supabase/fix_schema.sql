-- FIX FOR: new row for relation "orders" violates check constraint "orders_delivery_status_check"

-- 1. Grant Admin Access to specified email
UPDATE profiles 
SET role = 'admin' 
WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'vitzo.hq@gmail.com'
);

-- 2. Correct the Delivery Status Constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_delivery_status_check;

ALTER TABLE orders ADD CONSTRAINT orders_delivery_status_check 
CHECK (delivery_status IN (
    'pending', 
    'ready_for_pickup', 
    'assigned', 
    'out_for_delivery', 
    'delivered'
));

-- 2. Verify or Update process_checkout function
-- Ensure the initial status set during checkout matches 'ready_for_pickup'.
CREATE OR REPLACE FUNCTION process_checkout(
  p_total_amount DECIMAL, 
  p_shipping_house_no TEXT,
  p_shipping_street TEXT,
  p_shipping_landmark TEXT,
  p_shipping_area TEXT,
  p_mobile_number TEXT,
  p_payment_method TEXT,
  p_items JSONB
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

  -- Create the order with 'ready_for_pickup' status
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

  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
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
