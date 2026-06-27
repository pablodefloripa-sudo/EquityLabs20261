
CREATE TABLE public.user_planes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  plan text NOT NULL DEFAULT 'free',
  status text NOT NULL DEFAULT 'active',
  start_date timestamp with time zone NOT NULL DEFAULT now(),
  end_date timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.user_planes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own plan" ON public.user_planes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own plan" ON public.user_planes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own plan" ON public.user_planes FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_user_planes_updated_at
BEFORE UPDATE ON public.user_planes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
