CREATE TABLE IF NOT EXISTS public.tool_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tool_name TEXT NOT NULL,
  input JSONB DEFAULT '{}'::jsonb,
  output JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tool_executions TO authenticated;
GRANT ALL ON public.tool_executions TO service_role;

ALTER TABLE public.tool_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tool executions"
ON public.tool_executions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tool executions"
ON public.tool_executions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tool executions"
ON public.tool_executions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tool executions"
ON public.tool_executions FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_tool_executions_updated_at
BEFORE UPDATE ON public.tool_executions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_tool_executions_user_id ON public.tool_executions(user_id);