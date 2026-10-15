
-- Allow system to insert notifications (needed for trigger)
CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- Trigger function to create notifications on order status change
CREATE OR REPLACE FUNCTION public.notify_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_crop_name TEXT;
  v_title TEXT;
  v_message TEXT;
  v_target_user UUID;
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  v_crop_name := NEW.crop_name;

  -- Notify consumer on status changes
  CASE NEW.status
    WHEN 'accepted' THEN
      v_title := 'Order Accepted ✅';
      v_message := 'Your order for ' || v_crop_name || ' has been accepted by the farmer.';
      v_target_user := NEW.consumer_id;
    WHEN 'packed' THEN
      v_title := 'Order Packed 📦';
      v_message := 'Your order for ' || v_crop_name || ' is packed and ready for dispatch.';
      v_target_user := NEW.consumer_id;
    WHEN 'out_for_delivery' THEN
      v_title := 'Out for Delivery 🚚';
      v_message := 'Your order for ' || v_crop_name || ' is on its way! Track it live.';
      v_target_user := NEW.consumer_id;
    WHEN 'delivered' THEN
      v_title := 'Order Delivered 🎉';
      v_message := 'Your order for ' || v_crop_name || ' has been delivered. Thank you!';
      v_target_user := NEW.consumer_id;
    WHEN 'rejected' THEN
      v_title := 'Order Rejected ❌';
      v_message := 'Your order for ' || v_crop_name || ' was rejected by the farmer.';
      v_target_user := NEW.consumer_id;
    ELSE
      RETURN NEW;
  END CASE;

  INSERT INTO public.notifications (user_id, title, message)
  VALUES (v_target_user, v_title, v_message);

  -- Also notify farmer on delivery completion
  IF NEW.status = 'delivered' THEN
    INSERT INTO public.notifications (user_id, title, message)
    VALUES (NEW.farmer_id, 'Delivery Complete ✅', 'Your delivery of ' || v_crop_name || ' has been marked as delivered.');
  END IF;

  RETURN NEW;
END;
$$;

-- Attach trigger
CREATE TRIGGER on_order_status_change
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_order_status_change();
