-- VITZO FEATURE SUITE DATABASE UPDATES

-- 1. AGENTS TABLE
CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) UNIQUE,
    full_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'terminated')),
    is_active BOOLEAN DEFAULT false,
    salary DECIMAL(10,2) DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0,
    area TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. UPDATE ORDERS TABLE
ALTER TABLE orders ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES agents(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_pin TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'assigned', 'out_for_delivery', 'delivered'));

-- 3. AGENT RATINGS TABLE
CREATE TABLE IF NOT EXISTS agent_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) UNIQUE,
    agent_id UUID REFERENCES agents(id),
    user_id UUID REFERENCES auth.users(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. UPDATE PRODUCTS TABLE
ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '{}';

-- 5. ENABLE RLS
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_ratings ENABLE ROW LEVEL SECURITY;

-- 6. POLICIES

-- Agents: Agents can view their own record
DROP POLICY IF EXISTS "Agents view own" ON agents;
CREATE POLICY "Agents view own" ON agents FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Agents: Public can see agent name/rating (optional but useful for users)
DROP POLICY IF EXISTS "Public view agent stats" ON agents;
CREATE POLICY "Public view agent stats" ON agents FOR SELECT USING (status = 'approved');

-- Agent Ratings: Users can insert ratings for their orders
DROP POLICY IF EXISTS "Users insert agent ratings" ON agent_ratings;
CREATE POLICY "Users insert agent ratings" ON agent_ratings FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = agent_ratings.order_id AND orders.user_id = auth.uid())
);

-- Agent Ratings: Agents can view their ratings
DROP POLICY IF EXISTS "Agents view their ratings" ON agent_ratings;
CREATE POLICY "Agents view their ratings" ON agent_ratings FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM agents WHERE agents.id = agent_ratings.agent_id AND agents.user_id = auth.uid())
);

-- 8. AUTO-UPDATE AGENT STATS
CREATE OR REPLACE FUNCTION update_agent_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update Average Rating
    IF TG_TABLE_NAME = 'agent_ratings' THEN
        UPDATE agents 
        SET average_rating = (
            SELECT AVG(rating)::DECIMAL(3,2) 
            FROM agent_ratings 
            WHERE agent_id = NEW.agent_id
        )
        WHERE id = NEW.agent_id;
    END IF;

    -- Update Total Orders on Delivery
    IF TG_TABLE_NAME = 'orders' AND NEW.delivery_status = 'delivered' AND OLD.delivery_status != 'delivered' AND NEW.agent_id IS NOT NULL THEN
        UPDATE agents 
        SET total_orders = total_orders + 1
        WHERE id = NEW.agent_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_update_agent_rating ON agent_ratings;
CREATE TRIGGER tr_update_agent_rating
AFTER INSERT ON agent_ratings
FOR EACH ROW
EXECUTE FUNCTION update_agent_stats();

DROP TRIGGER IF EXISTS tr_update_agent_orders ON orders;
CREATE TRIGGER tr_update_agent_orders
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_agent_stats();

-- Admin: Full access
DROP POLICY IF EXISTS "Admin manage agents" ON agents;
CREATE POLICY "Admin manage agents" ON agents FOR ALL TO authenticated USING (auth.jwt() ->> 'email' = 'vitzo.hq@gmail.com');

DROP POLICY IF EXISTS "Admin manage ratings" ON agent_ratings;
CREATE POLICY "Admin manage ratings" ON agent_ratings FOR ALL TO authenticated USING (auth.jwt() ->> 'email' = 'vitzo.hq@gmail.com');

-- 7. FUNCTION TO GENERATE DELIVERY PIN
CREATE OR REPLACE FUNCTION generate_delivery_pin()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.delivery_status = 'out_for_delivery' AND OLD.delivery_status != 'out_for_delivery' THEN
        NEW.delivery_pin := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_generate_pin ON orders;
CREATE TRIGGER tr_generate_pin
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION generate_delivery_pin();
