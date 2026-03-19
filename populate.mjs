
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://pmxgifogqgdaqxnzihcg.supabase.co"
const supabaseKey = "sb_publishable_cNUoZc00bJRBVmgy9GvOfw_m9TQi8bw"

const supabase = createClient(supabaseUrl, supabaseKey)

async function populateDB() {
  const { data: categories, error: catError } = await supabase.from('categories').select('*')
  if (catError) {
    console.error('Error fetching categories:', catError)
    return
  }

  const findCat = (name) => categories.find(c => c.name.toLowerCase().includes(name.toLowerCase()))?.id

  const products = [
    { name: 'Red Gala Apples', price: 180, category_id: findCat('Fruit'), image_url: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6bcd6?auto=format&fit=crop&w=800&q=80', stock: 50 },
    { name: 'Fresh Organic Spinach', price: 40, category_id: findCat('Vegetable'), image_url: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=800&q=80', stock: 100 },
    { name: 'Pure Farm Milk', price: 65, category_id: findCat('Dairy'), image_url: 'https://images.unsplash.com/photo-1550583724-1277f3bb33ba?auto=format&fit=crop&w=800&q=80', stock: 30 },
    { name: 'Artisan Bread Rolls', price: 120, category_id: findCat('Bakery'), image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80', stock: 20 },
    { name: 'Premium Beef Cuts', price: 850, category_id: findCat('Meat'), image_url: 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?auto=format&fit=crop&w=800&q=80', stock: 15 },
    { name: 'Farm Fresh Eggs (12pk)', price: 90, category_id: findCat('Egg') || findCat('Dairy'), image_url: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=800&q=80', stock: 40 },
    { name: 'Aged Cheddar Cheese', price: 450, category_id: findCat('Cheese') || findCat('Dairy'), image_url: 'https://images.unsplash.com/photo-1485962391045-da6013ad6645?auto=format&fit=crop&w=800&q=80', stock: 25 },
    { name: 'Single Origin Coffee', price: 1200, category_id: findCat('Coffee') || findCat('Beverage'), image_url: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=800&q=80', stock: 20 },
    { name: 'Fresh Orange Juice', price: 150, category_id: findCat('Beverage'), image_url: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=800&q=80', stock: 30 },
    { name: 'Organic Penne Pasta', price: 210, category_id: findCat('Pantry') || findCat('Grocery'), image_url: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80', stock: 60 },
    { name: 'Mixed Gourmet Nuts', price: 450, category_id: findCat('Snack'), image_url: 'https://images.unsplash.com/photo-1536620579234-7db4f664a737?auto=format&fit=crop&w=800&q=80', stock: 50 },
    { name: 'Fresh Atlantic Salmon', price: 1500, category_id: findCat('Seafood') || findCat('Meat'), image_url: 'https://images.unsplash.com/photo-1499125562588-29fb8a56b5d5?auto=format&fit=crop&w=800&q=80', stock: 10 }
  ]

  const { error: prodError } = await supabase.from('products').upsert(products, { onConflict: 'name' })
  if (prodError) {
    console.error('Error adding products:', prodError)
  } else {
    console.log('Successfully populated products!')
  }
}

populateDB()
