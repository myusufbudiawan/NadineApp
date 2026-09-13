-- Supabase Storage bucket for baby profile photos, so the owner's photo
-- syncs across devices and shared (share_grants) accounts can see it too.
-- Private bucket: access is gated by the RLS policies below, mirroring
-- assertBabyAccess (services/api/src/common/auth/baby-access.ts) — that
-- Fastify-layer check never runs for Storage requests, so the same
-- ownership/share-grant logic has to be reimplemented here in SQL.
INSERT INTO storage.buckets (id, name, public)
VALUES ('baby-photos', 'baby-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Objects are stored as "<baby_id>/avatar.jpg" — the leading path segment
-- is the baby's UUID, used below to join back to babies/share_grants.
DROP POLICY IF EXISTS baby_photos_select ON storage.objects;
CREATE POLICY baby_photos_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'baby-photos'
    AND EXISTS (
      SELECT 1 FROM babies b
      WHERE b.id = (split_part(storage.objects.name, '/', 1))::uuid
        AND (
          b.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM share_grants sg
            WHERE sg.baby_id = b.id
              AND sg.revoked_at IS NULL
              AND lower(sg.grantee_email) = lower(auth.jwt() ->> 'email')
          )
        )
    )
  );

DROP POLICY IF EXISTS baby_photos_insert ON storage.objects;
CREATE POLICY baby_photos_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'baby-photos'
    AND EXISTS (
      SELECT 1 FROM babies b
      WHERE b.id = (split_part(storage.objects.name, '/', 1))::uuid
        AND b.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS baby_photos_update ON storage.objects;
CREATE POLICY baby_photos_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'baby-photos'
    AND EXISTS (
      SELECT 1 FROM babies b
      WHERE b.id = (split_part(storage.objects.name, '/', 1))::uuid
        AND b.user_id = auth.uid()
    )
  )
  WITH CHECK (
    bucket_id = 'baby-photos'
    AND EXISTS (
      SELECT 1 FROM babies b
      WHERE b.id = (split_part(storage.objects.name, '/', 1))::uuid
        AND b.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS baby_photos_delete ON storage.objects;
CREATE POLICY baby_photos_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'baby-photos'
    AND EXISTS (
      SELECT 1 FROM babies b
      WHERE b.id = (split_part(storage.objects.name, '/', 1))::uuid
        AND b.user_id = auth.uid()
    )
  );
