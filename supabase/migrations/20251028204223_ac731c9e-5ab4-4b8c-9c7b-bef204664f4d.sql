-- Create user_roles table (app_role enum already exists)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents recursive RLS issues)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin'::app_role)
$$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admin can manage claim codes" ON public.claim_codes;
DROP POLICY IF EXISTS "Admins can manage claim codes" ON public.claim_codes;

-- RLS policy: Users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- RLS policy: Only admins can manage roles
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Update claim_codes RLS to use admin role instead of is_host
CREATE POLICY "Admins can manage claim codes"
ON public.claim_codes
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Update claim_host_code function to assign 'host' role
CREATE OR REPLACE FUNCTION public.claim_host_code(p_code TEXT, p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  -- Assign host role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, 'host'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;