begin;

alter type public.admin_role
  add value if not exists 'teacher';

commit;
