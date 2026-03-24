BEGIN;

CREATE OR REPLACE FUNCTION public.auto_assign_order_to_agent()
RETURNS TRIGGER AS $$
DECLARE
  target_agent_id UUID;
BEGIN
  IF NEW.delivery_status = 'ready_for_pickup'
     AND (
       TG_OP = 'INSERT'
       OR OLD.delivery_status IS DISTINCT FROM 'ready_for_pickup'
     ) THEN
    SELECT agents.id
    INTO target_agent_id
    FROM public.agents
    WHERE agents.status = 'approved'
      AND agents.is_active = TRUE
      AND agents.working_area = NEW.shipping_area
    ORDER BY agents.total_orders ASC, agents.created_at ASC
    LIMIT 1;

    IF target_agent_id IS NOT NULL THEN
      NEW.agent_id := target_agent_id;
      NEW.delivery_status := 'assigned';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_auto_assign_order ON public.orders;
CREATE TRIGGER tr_auto_assign_order
BEFORE INSERT OR UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.auto_assign_order_to_agent();

UPDATE public.orders
SET delivery_status = delivery_status
WHERE agent_id IS NULL
  AND delivery_status = 'ready_for_pickup';

COMMIT;
