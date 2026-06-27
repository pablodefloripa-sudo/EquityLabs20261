
-- Fix leads_enterprise: require auth, add UPDATE/DELETE policies
DROP POLICY IF EXISTS "Anyone can submit enterprise leads" ON public.leads_enterprise;
CREATE POLICY "Authenticated users can submit own enterprise leads"
ON public.leads_enterprise FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own enterprise leads"
ON public.leads_enterprise FOR UPDATE TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own enterprise leads"
ON public.leads_enterprise FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Fix documentos public bucket: make private + remove public-read policy
UPDATE storage.buckets SET public = false WHERE id = 'documentos';
DROP POLICY IF EXISTS "Documents are publicly readable" ON storage.objects;

-- Realtime channel authorization: scope by user
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can subscribe to own realtime channels" ON realtime.messages;
CREATE POLICY "Users can subscribe to own realtime channels"
ON realtime.messages FOR SELECT TO authenticated
USING (
  (realtime.topic() = ('user:' || auth.uid()::text))
);
