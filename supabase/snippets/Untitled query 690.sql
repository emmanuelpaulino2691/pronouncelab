select *
from public.course_releases
where course_id = 952001
order by release_number;


select *
from public.course_release_learner_entitlements;


select
  id,
  email
from auth.users
where id = '2ec42a62-7fc3-4c0e-a3ae-b3649ca2ce8d';