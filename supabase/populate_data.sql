
-- Populate categories if they don't exist
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
