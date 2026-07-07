ALTER TABLE public.user_planes
ALTER COLUMN plan SET DEFAULT 'FREE_30_DAYS';

UPDATE public.user_planes
SET plan = CASE lower(plan)
  WHEN 'free' THEN 'FREE_30_DAYS'
  WHEN 'tactical' THEN 'TACTICAL_25'
  WHEN 'premium' THEN 'PREMIUM_50'
  WHEN 'mastermind' THEN 'MASTERMIND_100'
  WHEN 'enterprise' THEN 'ENTERPRISE_500'
  WHEN 'alliance' THEN 'ALLIANCE_1000'
  ELSE plan
END
WHERE plan IN ('free', 'tactical', 'premium', 'mastermind', 'enterprise', 'alliance');

CREATE TABLE IF NOT EXISTS public.free_ai_usage (
  user_id uuid NOT NULL,
  usage_date date NOT NULL DEFAULT current_date,
  request_count integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, usage_date)
);

ALTER TABLE public.free_ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own free AI usage"
ON public.free_ai_usage FOR SELECT
USING (auth.uid() = user_id);

GRANT SELECT ON public.free_ai_usage TO authenticated;
GRANT ALL ON public.free_ai_usage TO service_role;

CREATE OR REPLACE FUNCTION public.consume_free_ai_quota(
  p_user_id uuid,
  p_daily_limit integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count integer;
BEGIN
  INSERT INTO public.free_ai_usage (user_id, usage_date, request_count)
  VALUES (p_user_id, current_date, 0)
  ON CONFLICT (user_id, usage_date) DO NOTHING;

  SELECT request_count
  INTO current_count
  FROM public.free_ai_usage
  WHERE user_id = p_user_id
    AND usage_date = current_date
  FOR UPDATE;

  IF current_count >= p_daily_limit THEN
    RETURN false;
  END IF;

  UPDATE public.free_ai_usage
  SET request_count = request_count + 1,
      updated_at = now()
  WHERE user_id = p_user_id
    AND usage_date = current_date;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.consume_free_ai_quota(uuid, integer) TO service_role;
