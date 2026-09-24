-- ═══════════════════════════════════════════════════════════════════════════
-- 20260925_a_sources.sql — two more ways an enquiry arrives
-- ═══════════════════════════════════════════════════════════════════════════
-- Run BEFORE 20260925_b_production_readiness.sql. Postgres will not let a new
-- enum value be used in the same transaction that adds it, so this is a
-- separate step. Additive only; re-runnable.

alter type public.enquiry_source add value if not exists 'existing_customer';
alter type public.enquiry_source add value if not exists 'social_media';
