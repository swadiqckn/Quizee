-- =========================================================
-- Enforce One Organisation Per Admin & Deduplicate
-- =========================================================

-- 1. Deduplicate existing organisations where owner_id is duplicated
-- Keep the organization that has the most quizzes or was most recently updated
WITH ranked_orgs AS (
  SELECT 
    id,
    owner_id,
    ROW_NUMBER() OVER (
      PARTITION BY owner_id 
      ORDER BY 
        (SELECT COUNT(*) FROM public.quizzes q WHERE q.org_id = organisations.id) DESC,
        updated_at DESC, 
        created_at ASC
    ) as rn
  FROM public.organisations
  WHERE owner_id IS NOT NULL
)
DELETE FROM public.organisations
WHERE id IN (
  SELECT id FROM ranked_orgs WHERE rn > 1
);

-- 2. Add UNIQUE constraint to enforce exactly one organisation per admin owner
ALTER TABLE public.organisations
  DROP CONSTRAINT IF EXISTS unique_organisation_owner_id;

ALTER TABLE public.organisations
  ADD CONSTRAINT unique_organisation_owner_id UNIQUE (owner_id);
