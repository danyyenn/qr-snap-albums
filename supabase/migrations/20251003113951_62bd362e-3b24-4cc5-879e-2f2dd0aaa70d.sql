-- Create function to claim host code
CREATE OR REPLACE FUNCTION public.claim_host_code(
  p_code TEXT,
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

  -- Set user as host
  UPDATE public.profiles
  SET is_host = TRUE
  WHERE id = p_user_id;
END;
$$;