-- Add event limit tracking to profiles
ALTER TABLE public.profiles 
ADD COLUMN events_allowed INTEGER DEFAULT 0,
ADD COLUMN events_created INTEGER DEFAULT 0;

-- Update existing hosts to have 1 event allowed (for migration purposes)
UPDATE public.profiles 
SET events_allowed = 1 
WHERE is_host = true;

-- Update the claim_host_code function to grant 1 event per code
CREATE OR REPLACE FUNCTION public.claim_host_code(p_code text, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_code_id UUID;
BEGIN
  -- Check if code exists and is not used
  SELECT id INTO v_code_id
  FROM public.claim_codes
  WHERE code = p_code
    AND is_used = FALSE
    AND (expires_at IS NULL OR expires_at > NOW());

  IF v_code_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired claim code';
  END IF;

  -- Mark code as used
  UPDATE public.claim_codes
  SET 
    is_used = TRUE,
    used_by = p_user_id,
    used_at = NOW()
  WHERE id = v_code_id;

  -- Set user as host and grant 1 event credit
  UPDATE public.profiles
  SET 
    is_host = TRUE,
    events_allowed = events_allowed + 1
  WHERE id = p_user_id;
END;
$$;

-- Add function to check if user can create events
CREATE OR REPLACE FUNCTION public.can_create_event(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_allowed INTEGER;
  v_created INTEGER;
BEGIN
  SELECT events_allowed, events_created 
  INTO v_allowed, v_created
  FROM public.profiles
  WHERE id = p_user_id;
  
  RETURN (v_created < v_allowed);
END;
$$;

-- Add trigger to increment events_created when event is created
CREATE OR REPLACE FUNCTION public.increment_events_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.profiles
  SET events_created = events_created + 1
  WHERE id = NEW.host_id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_event_created
  AFTER INSERT ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_events_created();