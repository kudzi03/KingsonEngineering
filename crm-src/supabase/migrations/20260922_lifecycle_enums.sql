-- New values have to commit before any function or view can use them, so
-- they are their own migration, applied before 20260922_quote_lifecycle.sql.
alter type public.opp_stage add value if not exists 'on_hold' after 'followup';
alter type public.activity_kind add value if not exists 'reply';
alter type public.activity_kind add value if not exists 'on_hold';
