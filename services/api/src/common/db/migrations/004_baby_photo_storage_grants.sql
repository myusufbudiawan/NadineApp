-- 003_baby_photo_storage.sql's storage.objects policies subquery babies and
-- share_grants, but those tables only grant access to service_role (see
-- 001_initial.sql) — Storage runs as `authenticated`, which had neither a
-- table-level GRANT nor an RLS policy on babies/share_grants, causing
-- "permission denied for table babies" on every upload.
GRANT SELECT ON babies TO authenticated;
GRANT SELECT ON share_grants TO authenticated;

DROP POLICY IF EXISTS babies_select_own ON babies;
CREATE POLICY babies_select_own ON babies
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS share_grants_select_own ON share_grants;
CREATE POLICY share_grants_select_own ON share_grants
  FOR SELECT TO authenticated
  USING (lower(grantee_email) = lower(auth.jwt() ->> 'email'));
