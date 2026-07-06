
CREATE TABLE public.admob_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publisher_id text NOT NULL DEFAULT '',
  app_id text NOT NULL DEFAULT '',
  app_open_id text NOT NULL DEFAULT '',
  banner_id text NOT NULL DEFAULT '',
  interstitial_id text NOT NULL DEFAULT '',
  rewarded_id text NOT NULL DEFAULT '',
  rewarded_interstitial_id text NOT NULL DEFAULT '',
  native_id text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  singleton boolean NOT NULL DEFAULT true UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.admob_config TO anon, authenticated;
GRANT ALL ON public.admob_config TO service_role;

ALTER TABLE public.admob_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active admob config"
  ON public.admob_config FOR SELECT
  USING (is_active = true);

-- No INSERT/UPDATE/DELETE policies — writes only via service_role (server-side admin).

CREATE OR REPLACE FUNCTION public.admob_config_touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER admob_config_set_updated_at
  BEFORE UPDATE ON public.admob_config
  FOR EACH ROW EXECUTE FUNCTION public.admob_config_touch_updated_at();

INSERT INTO public.admob_config (singleton) VALUES (true);
