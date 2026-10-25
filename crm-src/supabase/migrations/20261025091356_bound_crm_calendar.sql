-- Calendar input must not cause an unbounded loop through a callable API.
create or replace function public.add_working_days(d date,n integer)
returns date language plpgsql stable security invoker set search_path='' as $$
declare days smallint[]; r date:=d; remaining integer:=greatest(coalesce(n,0),0);
begin
  if d is null or not isfinite(d) or remaining>3660 then
    raise exception 'Choose a finite date and no more than 3660 working days' using errcode='23514';
  end if;
  select working_weekdays into days from public.crm_settings where id;
  if days is null or cardinality(days)=0 or not days <@ array[1,2,3,4,5,6,7]::smallint[] then
    days:='{1,2,3,4,5}';
  end if;
  while remaining>0 loop
    r:=r+1;
    if extract(isodow from r)::smallint=any(days) then remaining:=remaining-1; end if;
  end loop;
  return r;
end $$;
revoke all on function public.add_working_days(date,integer) from public,anon;
grant execute on function public.add_working_days(date,integer) to authenticated,service_role;
