-- Create a bucket for product images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to read images
CREATE POLICY "Public Read Product Images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Allow authenticated users (Admin) to upload images
CREATE POLICY "Admin Upload Product Images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images' AND
  (auth.jwt() ->> 'email' = 'vitzo.hq@gmail.com')
);

-- Allow Admin to update/delete images
CREATE POLICY "Admin Manage Product Images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images' AND (auth.jwt() ->> 'email' = 'vitzo.hq@gmail.com'));

CREATE POLICY "Admin Delete Product Images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images' AND (auth.jwt() ->> 'email' = 'vitzo.hq@gmail.com'));
