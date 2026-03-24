BEGIN;

INSERT INTO public.categories (name, slug)
VALUES
  ('Vegetables', 'vegetables'),
  ('Fruits', 'fruits'),
  ('Dairy', 'dairy'),
  ('Staples', 'staples'),
  ('Snacks', 'snacks'),
  ('Beverages', 'beverages'),
  ('Bakery', 'bakery'),
  ('Household', 'household'),
  ('Personal Care', 'personal-care'),
  ('Stationery', 'stationery')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (
  name,
  real_price,
  commission,
  unit_type,
  allowed_units,
  category_id,
  image_url,
  description,
  specifications
)
SELECT
  seed.name,
  seed.real_price,
  seed.commission,
  seed.unit_type,
  seed.allowed_units,
  categories.id,
  seed.image_url,
  seed.description,
  seed.specifications
FROM (
  VALUES
    ('Tomatoes', 32.00, 6.00, 'weight', '["g","kg"]'::jsonb, 'vegetables', 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=900&q=80', 'Fresh red tomatoes for curries, salads, and everyday cooking.', '{"origin":"Local market","best_for":"Daily cooking"}'::jsonb),
    ('Onion', 28.00, 5.00, 'weight', '["g","kg"]'::jsonb, 'vegetables', 'https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=900&q=80', 'Kitchen staple onion with balanced sharpness and sweetness.', '{"origin":"Tamil Nadu","best_for":"Gravies"}'::jsonb),
    ('Potato', 26.00, 4.00, 'weight', '["g","kg"]'::jsonb, 'vegetables', 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=900&q=80', 'Versatile potatoes for fry, roast, mash, and curry.', '{"origin":"Ooty belt","best_for":"Everyday meals"}'::jsonb),
    ('Carrot', 48.00, 8.00, 'weight', '["g","kg"]'::jsonb, 'vegetables', 'https://images.unsplash.com/photo-1447175008436-054170c2e979?auto=format&fit=crop&w=900&q=80', 'Crunchy carrots for stir fry, salad, and snacks.', '{"best_for":"Salads","storage":"Refrigerated"}'::jsonb),
    ('Green Chilli', 64.00, 10.00, 'weight', '["g","kg"]'::jsonb, 'vegetables', 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=900&q=80', 'Sharp green chillies for everyday spice.', '{"heat_level":"Medium high"}'::jsonb),
    ('Coriander Leaves', 90.00, 14.00, 'weight', '["g","kg"]'::jsonb, 'vegetables', 'https://images.unsplash.com/photo-1584306670957-acf935f5033c?auto=format&fit=crop&w=900&q=80', 'Fresh coriander leaves for garnish and chutneys.', '{"best_for":"Garnish"}'::jsonb),
    ('Banana Robusta', 52.00, 8.00, 'weight', '["g","kg"]'::jsonb, 'fruits', 'https://images.unsplash.com/photo-1574226516831-e1dff420e37f?auto=format&fit=crop&w=900&q=80', 'Sweet robusta bananas for breakfast and quick energy.', '{"origin":"Kerala"}'::jsonb),
    ('Apple Royal Gala', 168.00, 24.00, 'weight', '["g","kg"]'::jsonb, 'fruits', 'https://images.unsplash.com/photo-1560806887-1e4cd0b60b0?auto=format&fit=crop&w=900&q=80', 'Crisp apples with a sweet bite.', '{"origin":"Himachal","best_for":"Snacking"}'::jsonb),
    ('Orange Nagpur', 96.00, 14.00, 'weight', '["g","kg"]'::jsonb, 'fruits', 'https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&w=900&q=80', 'Juicy oranges packed with citrus freshness.', '{"best_for":"Juice"}'::jsonb),
    ('Pomegranate', 152.00, 22.00, 'weight', '["g","kg"]'::jsonb, 'fruits', 'https://images.unsplash.com/photo-1541344999736-83eca272f6fc?auto=format&fit=crop&w=900&q=80', 'Ruby pomegranate for fruit bowls and fresh juice.', '{"best_for":"Juice","origin":"Maharashtra"}'::jsonb),
    ('Milma Milk', 48.00, 7.00, 'volume', '["ml","l"]'::jsonb, 'dairy', 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=900&q=80', 'Milma toned milk for tea, coffee, and everyday home use.', '{"brand":"Milma","pack_hint":"500ml or 1 litre"}'::jsonb),
    ('Nandini Curd', 62.00, 8.00, 'weight', '["g","kg"]'::jsonb, 'dairy', 'https://images.unsplash.com/photo-1571212515416-fef01fc43637?auto=format&fit=crop&w=900&q=80', 'Fresh curd for meals, raita, and daily cooking.', '{"brand":"Nandini"}'::jsonb),
    ('Amul Butter', 420.00, 55.00, 'weight', '["g","kg"]'::jsonb, 'dairy', 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=900&q=80', 'Creamy table butter for toast and cooking.', '{"brand":"Amul"}'::jsonb),
    ('Paneer Fresh', 320.00, 40.00, 'weight', '["g","kg"]'::jsonb, 'dairy', 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=900&q=80', 'Soft paneer cubes for curry, fry, and rolls.', '{"best_for":"Curries"}'::jsonb),
    ('Rice Matta', 62.00, 8.00, 'weight', '["g","kg"]'::jsonb, 'staples', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=900&q=80', 'Kerala matta rice for everyday lunch and dinner.', '{"grain":"Matta"}'::jsonb),
    ('Aashirvaad Atta', 54.00, 7.00, 'weight', '["g","kg"]'::jsonb, 'staples', 'https://images.unsplash.com/photo-1603048719539-9ecb645fd0ad?auto=format&fit=crop&w=900&q=80', 'Whole wheat atta for soft chapati and paratha.', '{"brand":"Aashirvaad"}'::jsonb),
    ('Toor Dal', 128.00, 16.00, 'weight', '["g","kg"]'::jsonb, 'staples', 'https://images.unsplash.com/photo-1515543904379-3d757afe72e6?auto=format&fit=crop&w=900&q=80', 'Toor dal for sambar and everyday dal curry.', '{"best_for":"Sambar"}'::jsonb),
    ('Sugar', 44.00, 6.00, 'weight', '["g","kg"]'::jsonb, 'staples', 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?auto=format&fit=crop&w=900&q=80', 'Refined sugar for tea, coffee, and baking.', '{"grade":"Regular"}'::jsonb),
    ('Tata Salt', 24.00, 4.00, 'weight', '["g","kg"]'::jsonb, 'staples', 'https://images.unsplash.com/photo-1518110925495-5fe2a5d8bfc4?auto=format&fit=crop&w=900&q=80', 'Iodized salt for everyday cooking.', '{"brand":"Tata"}'::jsonb),
    ('Sunflower Oil', 146.00, 19.00, 'volume', '["ml","l"]'::jsonb, 'staples', 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=900&q=80', 'Refined sunflower oil for frying and sauteing.', '{"best_for":"Daily cooking"}'::jsonb),
    ('Lays Classic Salted', 18.00, 4.00, 'discrete', '["pack"]'::jsonb, 'snacks', 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&w=900&q=80', 'Crispy potato chips in the classic salted flavour.', '{"brand":"Lays","pack_size":"52g"}'::jsonb),
    ('Kurkure Masala Munch', 19.00, 4.00, 'discrete', '["pack"]'::jsonb, 'snacks', 'https://images.unsplash.com/photo-1613919113640-25732ec5e61f?auto=format&fit=crop&w=900&q=80', 'Crunchy masala snack for tea-time cravings.', '{"brand":"Kurkure"}'::jsonb),
    ('Good Day Biscuits', 28.00, 5.00, 'discrete', '["pack"]'::jsonb, 'snacks', 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=900&q=80', 'Buttery biscuits for tea and school snacks.', '{"brand":"Britannia"}'::jsonb),
    ('Hide and Seek', 34.00, 5.00, 'discrete', '["pack"]'::jsonb, 'snacks', 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=900&q=80', 'Chocolate chip cookies with a crisp bite.', '{"brand":"Parle"}'::jsonb),
    ('Paper Boat Mango Drink', 86.00, 12.00, 'volume', '["ml","l"]'::jsonb, 'beverages', 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=900&q=80', 'Mango-flavoured traditional-style ready drink.', '{"brand":"Paper Boat"}'::jsonb),
    ('Maaza Mango Drink', 70.00, 10.00, 'volume', '["ml","l"]'::jsonb, 'beverages', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=900&q=80', 'Popular mango drink served chilled.', '{"brand":"Maaza"}'::jsonb),
    ('Coca Cola', 72.00, 10.00, 'volume', '["ml","l"]'::jsonb, 'beverages', 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?auto=format&fit=crop&w=900&q=80', 'Classic cola soft drink for meals and gatherings.', '{"brand":"Coca-Cola"}'::jsonb),
    ('Mineral Water', 18.00, 3.00, 'volume', '["ml","l"]'::jsonb, 'beverages', 'https://images.unsplash.com/photo-1616118132534-381148898bb4?auto=format&fit=crop&w=900&q=80', 'Packaged drinking water for daily hydration.', '{"pack_hint":"1 litre"}'::jsonb),
    ('Milk Bread', 38.00, 6.00, 'discrete', '["pack"]'::jsonb, 'bakery', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80', 'Soft milk bread loaf for breakfast and sandwiches.', '{"pack_size":"400g"}'::jsonb),
    ('Egg Puffs', 22.00, 4.00, 'discrete', '["piece"]'::jsonb, 'bakery', 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80', 'Bakery-style egg puffs with flaky layers.', '{"serving":"Single piece"}'::jsonb),
    ('Rusk Toast', 52.00, 8.00, 'discrete', '["pack"]'::jsonb, 'bakery', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80', 'Crunchy rusk for tea-time dipping.', '{"pack_size":"Pack"}'::jsonb),
    ('Surf Excel Detergent', 94.00, 14.00, 'weight', '["g","kg"]'::jsonb, 'household', 'https://images.unsplash.com/photo-1583947581924-a6d1b9d7f4e6?auto=format&fit=crop&w=900&q=80', 'Detergent powder for everyday laundry loads.', '{"brand":"Surf Excel"}'::jsonb),
    ('Vim Dishwash Liquid', 98.00, 14.00, 'volume', '["ml","l"]'::jsonb, 'household', 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=900&q=80', 'Dishwash liquid with grease-cutting formula.', '{"brand":"Vim"}'::jsonb),
    ('Harpic Toilet Cleaner', 112.00, 16.00, 'volume', '["ml","l"]'::jsonb, 'household', 'https://images.unsplash.com/photo-1583947582886-f40ec95dd752?auto=format&fit=crop&w=900&q=80', 'Toilet cleaner for regular bathroom maintenance.', '{"brand":"Harpic"}'::jsonb),
    ('Match Box', 12.00, 2.00, 'discrete', '["piece"]'::jsonb, 'household', 'https://images.unsplash.com/photo-1616628182509-6b7c23c1b2dc?auto=format&fit=crop&w=900&q=80', 'Everyday match box for kitchen use.', '{"pack_hint":"Single box"}'::jsonb),
    ('Bath Soap', 34.00, 5.00, 'discrete', '["piece"]'::jsonb, 'personal-care', 'https://images.unsplash.com/photo-1584305574647-acf4f6c5d7aa?auto=format&fit=crop&w=900&q=80', 'Refreshing bath soap for daily use.', '{"pack_hint":"Single bar"}'::jsonb),
    ('Clinic Plus Shampoo', 136.00, 18.00, 'volume', '["ml","l"]'::jsonb, 'personal-care', 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=900&q=80', 'Daily shampoo for regular hair wash routine.', '{"brand":"Clinic Plus"}'::jsonb),
    ('Colgate Toothpaste', 92.00, 12.00, 'weight', '["g"]'::jsonb, 'personal-care', 'https://images.unsplash.com/photo-1559591937-abc1c4b5dd33?auto=format&fit=crop&w=900&q=80', 'Fluoride toothpaste for daily oral care.', '{"brand":"Colgate"}'::jsonb),
    ('Cello Ball Pen', 8.00, 2.00, 'discrete', '["piece"]'::jsonb, 'stationery', 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=80', 'Smooth writing blue ink ball pen.', '{"brand":"Cello"}'::jsonb),
    ('Classmate Notebook', 42.00, 6.00, 'discrete', '["piece"]'::jsonb, 'stationery', 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=900&q=80', 'Ruled notebook for school, tuition, and office notes.', '{"brand":"Classmate"}'::jsonb),
    ('Apsara Pencil', 6.00, 1.00, 'discrete', '["piece"]'::jsonb, 'stationery', 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=900&q=80', 'Classic graphite pencil for school and sketching.', '{"brand":"Apsara"}'::jsonb)
) AS seed(
  name,
  real_price,
  commission,
  unit_type,
  allowed_units,
  category_slug,
  image_url,
  description,
  specifications
)
JOIN public.categories
  ON categories.slug = seed.category_slug
ON CONFLICT DO NOTHING;

COMMIT;
