BEGIN;

CREATE TABLE IF NOT EXISTS public.admin_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invited_email TEXT NOT NULL,
  invite_token TEXT NOT NULL UNIQUE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  accepted_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '7 days')
);

CREATE INDEX IF NOT EXISTS admin_invites_email_idx
  ON public.admin_invites (invited_email, status, created_at DESC);

ALTER TABLE public.admin_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin manage admin invites" ON public.admin_invites;
CREATE POLICY "Admin manage admin invites"
ON public.admin_invites
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION public.create_admin_invite(p_invited_email TEXT)
RETURNS TABLE (
  invite_token TEXT,
  invited_email TEXT,
  expires_at TIMESTAMPTZ
) AS $$
DECLARE
  v_token TEXT;
  v_email TEXT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'UNAUTHORIZED';
  END IF;

  v_email := LOWER(TRIM(p_invited_email));

  IF v_email = '' THEN
    RAISE EXCEPTION 'INVITE_EMAIL_REQUIRED';
  END IF;

  UPDATE public.admin_invites
  SET status = 'revoked'
  WHERE public.admin_invites.invited_email = v_email
    AND public.admin_invites.status = 'pending';

  v_token := ENCODE(gen_random_bytes(18), 'hex');

  RETURN QUERY
  INSERT INTO public.admin_invites (invited_email, invite_token, invited_by)
  VALUES (v_email, v_token, auth.uid())
  RETURNING
    public.admin_invites.invite_token,
    public.admin_invites.invited_email,
    public.admin_invites.expires_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.create_admin_invite(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.accept_admin_invite(p_invite_token TEXT)
RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
  v_invite public.admin_invites%ROWTYPE;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED';
  END IF;

  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = v_user_id;

  IF v_user_email IS NULL THEN
    RAISE EXCEPTION 'ACCOUNT_EMAIL_REQUIRED';
  END IF;

  SELECT *
  INTO v_invite
  FROM public.admin_invites
  WHERE invite_token = p_invite_token
    AND status = 'pending'
  FOR UPDATE;

  IF v_invite.id IS NULL THEN
    RAISE EXCEPTION 'ADMIN_INVITE_INVALID';
  END IF;

  IF v_invite.expires_at < NOW() THEN
    RAISE EXCEPTION 'ADMIN_INVITE_EXPIRED';
  END IF;

  IF LOWER(v_invite.invited_email) <> LOWER(v_user_email) THEN
    RAISE EXCEPTION 'ADMIN_INVITE_EMAIL_MISMATCH';
  END IF;

  UPDATE public.profiles
  SET role = 'admin', updated_at = NOW()
  WHERE id = v_user_id;

  UPDATE public.admin_invites
  SET
    status = 'accepted',
    accepted_by = v_user_id
  WHERE id = v_invite.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.accept_admin_invite(TEXT) TO authenticated;

COMMIT;
