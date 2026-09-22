-- Trigger functions fire without EXECUTE; nobody should call them over /rpc.
-- is_staff(), is_admin() and enum_values() stay callable: RLS policies and the
-- CRM's boot check call them as the signed-in user. The workflow functions
-- (record_quote, mark_quote_sent, log_follow_up, mark_customer_replied,
-- decide_opportunity, convert_to_project, add_working_days) are the API and
-- each checks is_staff() itself.
revoke execute on function public.convert_enquiry() from authenticated;
revoke execute on function public.handle_new_user() from authenticated;
revoke execute on function public.log_quote_event() from authenticated;
revoke execute on function public.log_stage_change() from authenticated;
revoke execute on function public.log_task_completion() from authenticated;
revoke execute on function public.log_visit_event() from authenticated;
revoke execute on function public.quote_before_write() from authenticated;
revoke execute on function public.set_quote_reference() from authenticated;
revoke execute on function public.touch_opportunity_activity() from authenticated;
revoke execute on function public.touch_updated_at() from authenticated;

alter function public.opp_stage_is_open(opp_stage) set search_path = public;
alter function public.touch_updated_at() set search_path = public;
alter function public.harare_today() set search_path = public;
alter function public.stage_label(opp_stage) set search_path = public;
