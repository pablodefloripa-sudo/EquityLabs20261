-- 1) leads_enterprise: user_id NOT NULL (no anonymous leads)
DELETE FROM public.leads_enterprise WHERE user_id IS NULL;
ALTER TABLE public.leads_enterprise ALTER COLUMN user_id SET NOT NULL;

-- 2) Storage UPDATE policy for user-files bucket (owner-scoped by first folder = uid)
DROP POLICY IF EXISTS "Users can update own files in user-files" ON storage.objects;
CREATE POLICY "Users can update own files in user-files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-files'
  AND (auth.uid())::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'user-files'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- 3) Attach privilege-escalation guards on profiles (functions already exist but were not bound to triggers)
DROP TRIGGER IF EXISTS profiles_prevent_insert_escalation ON public.profiles;
CREATE TRIGGER profiles_prevent_insert_escalation
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_profile_insert_escalation();

DROP TRIGGER IF EXISTS profiles_prevent_update_escalation ON public.profiles;
CREATE TRIGGER profiles_prevent_update_escalation
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_profile_privilege_escalation();