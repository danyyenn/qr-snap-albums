-- Fix search_path for all functions to prevent search path mutable warnings

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- Fix handle_new_user function (already has search_path but ensuring consistency)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', '')
  );
  RETURN new;
END;
$function$;

-- Fix claim_host_code function (already has search_path but ensuring consistency)
CREATE OR REPLACE FUNCTION public.claim_host_code(p_code text, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_code_id UUID;
BEGIN
  SELECT id INTO v_code_id
  FROM public.claim_codes
  WHERE code = p_code
    AND is_used = FALSE
    AND (expires_at IS NULL OR expires_at > NOW());

  IF v_code_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired claim code';
  END IF;

  UPDATE public.claim_codes
  SET 
    is_used = TRUE,
    used_by = p_user_id,
    used_at = NOW()
  WHERE id = v_code_id;

  UPDATE public.profiles
  SET 
    is_host = TRUE,
    events_allowed = events_allowed + 1
  WHERE id = p_user_id;
END;
$function$;

-- Fix can_create_event function
CREATE OR REPLACE FUNCTION public.can_create_event(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

-- Fix increment_events_created function
CREATE OR REPLACE FUNCTION public.increment_events_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.profiles
  SET events_created = events_created + 1
  WHERE id = NEW.host_id;
  
  RETURN NEW;
END;
$function$;

-- Fix get_event_by_upload_code function
CREATE OR REPLACE FUNCTION public.get_event_by_upload_code(p_upload_code text)
RETURNS TABLE(id uuid, name text, event_date date, location text, description text, allow_guest_view boolean, require_approval boolean, max_photos integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.name,
    e.event_date,
    e.location,
    e.description,
    e.allow_guest_view,
    e.require_approval,
    e.max_photos
  FROM public.events e
  WHERE e.upload_code = p_upload_code
  LIMIT 1;
END;
$function$;

-- Fix event_allows_guest_view function
CREATE OR REPLACE FUNCTION public.event_allows_guest_view(p_event_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_allows_guest_view boolean;
BEGIN
  SELECT allow_guest_view OR is_public_gallery
  INTO v_allows_guest_view
  FROM public.events
  WHERE id = p_event_id;
  
  RETURN COALESCE(v_allows_guest_view, false);
END;
$function$;