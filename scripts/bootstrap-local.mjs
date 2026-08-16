import { execFileSync } from "node:child_process";
import process from "node:process";

const adminEmail = "admin.pronouncelab@gmail.com";
const teacherEmail = "emmanuelpaulino2691@gmail.com";
const learnerEmail = "learner.pronouncelab@gmail.com";
const adminPassword = process.env.PRONOUNCELAB_LOCAL_ADMIN_PASSWORD ?? "PronounceLabLocalAdmin!2026";
const teacherPassword = process.env.PRONOUNCELAB_LOCAL_TEACHER_PASSWORD ?? "PronounceLabLocalTeacher!2026";
const learnerPassword = process.env.PRONOUNCELAB_LOCAL_LEARNER_PASSWORD ?? "PronounceLabLocalLearner!2026";
function localStatus() {
  const output = process.platform === "win32"
    ? execFileSync(process.env.ComSpec ?? "cmd.exe", ["/d", "/s", "/c", "npx.cmd supabase status -o env"], { encoding: "utf8" })
    : execFileSync("npx", ["supabase", "status", "-o", "env"], { encoding: "utf8" });
  return Object.fromEntries(output.split(/\r?\n/).flatMap((line) => {
    const match = line.match(/^([A-Z_]+)="(.*)"$/);
    return match ? [[match[1], match[2]]] : [];
  }));
}

const status = localStatus();
const apiUrl = status.API_URL;
const serviceKey = status.SERVICE_ROLE_KEY;
const anonKey = status.ANON_KEY;
if (!apiUrl || !serviceKey || !anonKey || !apiUrl.startsWith("http://127.0.0.1:")) {
  throw new Error("Local Supabase is not running or did not expose local credentials.");
}

const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" };

async function request(path, init = {}) {
  const response = await fetch(`${apiUrl}${path}`, { ...init, headers: { ...headers, ...init.headers } });
  if (!response.ok) throw new Error(`${init.method ?? "GET"} ${path} failed (${response.status}): ${await response.text()}`);
  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function ensureUser(email, password) {
  const listed = await request(`/auth/v1/admin/users?page=1&per_page=1000`);
  let user = listed.users.find((candidate) => candidate.email?.toLowerCase() === email);
  if (!user) {
    user = await request("/auth/v1/admin/users", { method: "POST", body: JSON.stringify({ email, password, email_confirm: true }) });
  } else {
    await request(`/auth/v1/admin/users/${user.id}`, { method: "PUT", body: JSON.stringify({ password, email_confirm: true }) });
  }
  return user;
}

function seedFixture(adminId, teacherId, learnerId) {
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuid.test(adminId) || !uuid.test(teacherId) || !uuid.test(learnerId)) throw new Error("Auth Admin API returned an invalid user ID.");
  const containerOutput = execFileSync("docker", ["ps", "--format", "{{.Names}}"], { encoding: "utf8" });
  const databaseContainer = containerOutput.split(/\r?\n/).find((name) => name.startsWith("supabase_db_"));
  if (!databaseContainer) throw new Error("The local Supabase database container is not running.");
  const sql = `
begin;
insert into public.user_roles (user_id, role) values
  ('${adminId}', 'admin'), ('${teacherId}', 'teacher')
on conflict (user_id, role) do nothing;
insert into public.classes (id, owner_user_id, name, description, status, join_code, join_code_enabled)
values
  (953001, '${teacherId}', 'Local Enrolled Class', 'Pre-enrolled roster and progress reporting fixture.', 'active', 'A52B000000000001', true),
  (953002, '${teacherId}', 'Local Joinable Class', 'Empty Class for manual join-code testing.', 'active', 'A52B000000000002', true)
on conflict (id) do update set owner_user_id=excluded.owner_user_id,name=excluded.name,description=excluded.description,status=excluded.status,join_code=excluded.join_code,join_code_enabled=true;
insert into public.class_enrollments (class_id, learner_user_id, status, ended_at)
values (953001, '${learnerId}', 'active', null)
on conflict (class_id, learner_user_id) do update set status='active',ended_at=null,updated_at=pg_catalog.now();
set local request.jwt.claim.sub = '${teacherId}';
insert into public.courses (id, slug, title, description, level, emoji, position, status, owner_user_id, created_by, updated_by)
values (951001, 'local-authoring-fixture', 'Local Authoring Fixture', 'Deterministic local-only course for browser validation.', 'A1', '🧪', coalesce((select max(position) + 1 from public.courses where owner_user_id = '${teacherId}' and id <> 951001), 0), 'draft', '${teacherId}', '${teacherId}', '${teacherId}')
on conflict (id) do update set owner_user_id = excluded.owner_user_id, created_by = excluded.created_by, updated_by = excluded.updated_by;
insert into public.units (id, course_id, title, description, position, status, created_by, updated_by)
values (951011, 951001, 'Fixture Unit', 'Ready for local authoring.', 0, 'draft', '${teacherId}', '${teacherId}')
on conflict (id) do update set created_by = excluded.created_by, updated_by = excluded.updated_by;
insert into public.lessons (id, unit_id, title, description, position, status, current_published_version_id, created_by, updated_by)
values (951021, 951011, 'Fixture Lesson', 'Open this lesson directly in Lesson Studio.', 0, 'draft', null, '${teacherId}', '${teacherId}')
on conflict (id) do update set created_by = excluded.created_by, updated_by = excluded.updated_by;
insert into public.lesson_versions (id, lesson_id, version_number, status, created_by)
values (951031, 951021, 1, 'draft', '${teacherId}')
on conflict (id) do nothing;

-- A separate published hierarchy for learner progression testing. Keep these
-- IDs distinct from the draft authoring fixture and publish through the real
-- course lifecycle rather than setting sealed statuses directly.
insert into public.courses (id, slug, title, description, level, emoji, position, status, owner_user_id, created_by, updated_by)
values (952001, 'local-learner-course', 'Local Learner Course', 'Deterministic published course for learner progression testing.', 'A1', '🎓', coalesce((select max(position) + 1 from public.courses where owner_user_id = '${teacherId}' and id <> 952001), 0), 'draft', '${teacherId}', '${teacherId}', '${teacherId}')
on conflict (id) do nothing;
insert into public.units (id, course_id, title, description, position, status, created_by, updated_by) values
  (952011, 952001, 'Progression Unit 1', 'Complete these lessons in order.', 0, 'draft', '${teacherId}', '${teacherId}'),
  (952012, 952001, 'Progression Unit 2', 'Unlocked after Unit 1 is complete.', 1, 'draft', '${teacherId}', '${teacherId}')
on conflict (id) do nothing;
insert into public.lessons (id, unit_id, title, description, position, status, created_by, updated_by) values
  (952021, 952011, 'Unit 1 · Lesson 1', 'The first available learner lesson.', 0, 'draft', '${teacherId}', '${teacherId}'),
  (952022, 952011, 'Unit 1 · Lesson 2', 'Unlocks after Lesson 1.', 1, 'draft', '${teacherId}', '${teacherId}'),
  (952023, 952011, 'Unit 1 · Lesson 3', 'Completes the first unit.', 2, 'draft', '${teacherId}', '${teacherId}'),
  (952024, 952012, 'Unit 2 · Lesson 1', 'Unlocks after Unit 1.', 0, 'draft', '${teacherId}', '${teacherId}'),
  (952025, 952012, 'Unit 2 · Lesson 2', 'Final progression fixture lesson.', 1, 'draft', '${teacherId}', '${teacherId}')
on conflict (id) do nothing;
insert into public.lesson_versions (id, lesson_id, version_number, status, created_by) values
  (952031, 952021, 1, 'draft', '${teacherId}'),
  (952032, 952022, 1, 'draft', '${teacherId}'),
  (952033, 952023, 1, 'draft', '${teacherId}'),
  (952034, 952024, 1, 'draft', '${teacherId}'),
  (952035, 952025, 1, 'draft', '${teacherId}')
on conflict (id) do nothing;
insert into public.lesson_activities (id, lesson_version_id, type, title, position)
select fixture.id, fixture.lesson_version_id, fixture.type::public.lesson_activity_type, fixture.title, fixture.position from (values
  (952041, 952031, 'theory', 'Learn: Welcome', 0),
  (952042, 952032, 'theory', 'Learn: Keep going', 0),
  (952043, 952033, 'theory', 'Learn: Finish Unit 1', 0),
  (952044, 952034, 'theory', 'Learn: Start Unit 2', 0),
  (952045, 952035, 'theory', 'Learn: Finish the course', 0)
) as fixture(id, lesson_version_id, type, title, position)
where not exists (select 1 from public.lesson_activities existing where existing.id = fixture.id);
insert into public.theory_blocks (id, activity_id, block_type, position, text)
select fixture.id, fixture.activity_id, fixture.block_type, fixture.position, fixture.text from (values
  (952051, 952041, 'paragraph', 0, 'Complete this short Learn activity to unlock the next lesson.'),
  (952052, 952042, 'paragraph', 0, 'This lesson proves sequential lesson unlocking.'),
  (952053, 952043, 'paragraph', 0, 'Completing this lesson unlocks the next unit.'),
  (952054, 952044, 'paragraph', 0, 'Unit 2 is now available for continued practice.'),
  (952055, 952045, 'paragraph', 0, 'You completed the local learner progression fixture.')
) as fixture(id, activity_id, block_type, position, text)
where not exists (select 1 from public.theory_blocks existing where existing.id = fixture.id);

do $$
declare
  result jsonb;
begin
  if (select status = 'draft' from public.courses where id = 952001) then
    result := public.publish_course(952001);
    if not coalesce((result ->> 'ok')::boolean, false) then
      raise exception 'Local learner fixture publication failed: %', result;
    end if;
  end if;
end;
$$;

-- Independent-practice fixtures remain separate from the Class-only assigned Course.
insert into public.courses(id,slug,title,description,level,emoji,position,status,owner_user_id,created_by,updated_by) values
  (954001,'local-public-course','Local Public Course','Independent-practice fixture listed in Course Library.','A1','📚',coalesce((select max(position)+1 from public.courses),0),'draft','${teacherId}','${teacherId}','${teacherId}'),
  (955001,'local-unlisted-course','Local Unlisted Course','Independent-practice fixture available only through its secure link.','A1','🔗',coalesce((select max(position)+2 from public.courses),1),'draft','${teacherId}','${teacherId}','${teacherId}')
on conflict(id) do nothing;
insert into public.units(id,course_id,title,description,position,status,created_by,updated_by) values
  (954011,954001,'Public Practice Unit','Course Library practice.',0,'draft','${teacherId}','${teacherId}'),
  (955011,955001,'Shared Practice Unit','Unlisted link practice.',0,'draft','${teacherId}','${teacherId}') on conflict(id) do nothing;
insert into public.lessons(id,unit_id,title,description,position,status,created_by,updated_by) values
  (954021,954011,'Public Practice Lesson','Visible through Course Library.',0,'draft','${teacherId}','${teacherId}'),
  (955021,955011,'Shared Practice Lesson','Visible after secure link redemption.',0,'draft','${teacherId}','${teacherId}') on conflict(id) do nothing;
insert into public.lesson_versions(id,lesson_id,version_number,status,created_by) values
  (954031,954021,1,'draft','${teacherId}'),(955031,955021,1,'draft','${teacherId}') on conflict(id) do nothing;
do $$ declare result jsonb; begin
  if (select status='draft' from public.lesson_versions where id=954031) then
    insert into public.lesson_activities(id,lesson_version_id,type,title,position) values(954041,954031,'theory','Public Learn activity',0) on conflict(id) do nothing;
    insert into public.theory_blocks(id,activity_id,block_type,position,text) values(954051,954041,'paragraph',0,'This Course demonstrates independent Public practice.') on conflict(id) do nothing;
    result:=public.publish_course(954001); if not coalesce((result->>'ok')::boolean,false) then raise exception 'Public fixture publication failed: %',result; end if;
  end if;
  if (select status='draft' from public.lesson_versions where id=955031) then
    insert into public.lesson_activities(id,lesson_version_id,type,title,position) values(955041,955031,'theory','Shared Learn activity',0) on conflict(id) do nothing;
    insert into public.theory_blocks(id,activity_id,block_type,position,text) values(955051,955041,'paragraph',0,'This Course demonstrates secure Unlisted practice.') on conflict(id) do nothing;
    result:=public.publish_course(955001); if not coalesce((result->>'ok')::boolean,false) then raise exception 'Unlisted fixture publication failed: %',result; end if;
  end if;
end $$;
update public.courses set learner_visibility='class_only' where id=952001;
update public.courses set learner_visibility='public' where id=954001;
update public.courses set learner_visibility='unlisted' where id=955001;
insert into public.course_unlisted_share_links(course_id,token_hash,created_by)
values(955001,encode(extensions.digest(pg_catalog.convert_to('local-unlisted-course-share-52e','UTF8'),'sha256'),'hex'),'${teacherId}')
on conflict(course_id) do update set token_hash=excluded.token_hash,created_by=excluded.created_by;

set constraints capture_course_release_after_publication immediate;

delete from public.course_release_learner_entitlements entitlement
using public.course_releases release
where entitlement.course_release_id=release.id and release.course_id=952001 and entitlement.learner_id='${learnerId}';
insert into public.class_course_assignments(class_id,course_release_id,source_course_id,assigned_by)
select 953001,release.id,release.course_id,'${teacherId}'
from public.course_releases release
where release.course_id=952001 and release.release_number=1
  and not exists(select 1 from public.class_course_assignments assignment where assignment.class_id=953001 and assignment.source_course_id=952001 and assignment.status='active');

do $$ begin if public.learner_lesson_is_eligible('${learnerId}',952021) then raise exception 'Class-only current Course must not grant independent progress'; end if; end $$;
commit;`;
  execFileSync("docker", ["exec", "-i", databaseContainer, "psql", "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", "postgres"], {
    input: sql,
    stdio: ["pipe", "inherit", "inherit"],
  });
}

const admin = await ensureUser(adminEmail, adminPassword);
const teacher = await ensureUser(teacherEmail, teacherPassword);
const learner = await ensureUser(learnerEmail, learnerPassword);
seedFixture(admin.id, teacher.id, learner.id);

async function verifyLogin(email, password, expectedId) {
  const response = await fetch(`${apiUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: anonKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw new Error(`Local login verification failed for ${email} (${response.status}).`);
  const session = await response.json();
  if (session.user?.id !== expectedId || !session.access_token) throw new Error(`Local login verification returned the wrong user for ${email}.`);
  return session;
}

await verifyLogin(adminEmail, adminPassword, admin.id);
const teacherSession = await verifyLogin(teacherEmail, teacherPassword, teacher.id);
const learnerSession = await verifyLogin(learnerEmail, learnerPassword, learner.id);
const teacherHeaders = { apikey: anonKey, Authorization: `Bearer ${teacherSession.access_token}` };
const lessonResponse = await fetch(`${apiUrl}/rest/v1/lessons?id=eq.951021&select=id,status`, {
  headers: teacherHeaders,
});
const versionResponse = await fetch(`${apiUrl}/rest/v1/lesson_versions?id=eq.951031&select=id,lesson_id,version_number,status`, {
  headers: teacherHeaders,
});
if (!lessonResponse.ok || !versionResponse.ok) throw new Error(`Teacher fixture visibility check failed (${lessonResponse.status}/${versionResponse.status}).`);
const visibleLessons = await lessonResponse.json();
const visibleVersions = await versionResponse.json();
if (visibleLessons[0]?.status !== "draft" || visibleVersions[0]?.status !== "draft" || visibleVersions[0]?.lesson_id !== 951021) {
  throw new Error("Teacher cannot load the fixture Lesson and Draft Version 1.");
}

const learnerHeaders = { apikey: anonKey, Authorization: `Bearer ${learnerSession.access_token}`, "Content-Type": "application/json" };
const catalogResponse = await fetch(`${apiUrl}/rest/v1/rpc/get_published_learning_catalog`, {
  method: "POST", headers: learnerHeaders, body: JSON.stringify({ requested_schema_version: 1 }),
});
const progressResponse = await fetch(`${apiUrl}/rest/v1/rpc/get_my_learner_progress`, {
  method: "POST", headers: learnerHeaders, body: "{}",
});
const assignmentsResponse = await fetch(`${apiUrl}/rest/v1/rpc/get_class_course_assignments`, {
  method: "POST", headers: learnerHeaders, body: JSON.stringify({ requested_class_id: 953001 }),
});
if (!catalogResponse.ok || !progressResponse.ok || !assignmentsResponse.ok) throw new Error(`Learner fixture verification failed (${catalogResponse.status}/${progressResponse.status}/${assignmentsResponse.status}).`);
const catalog = await catalogResponse.json();
const progress = await progressResponse.json();
const courses = catalog?.courses ?? catalog?.catalog?.courses ?? [];
const publicCourse = courses.find((course) => String(course.id) === "954001");
if (!publicCourse || courses.some((course) => ["951001","952001","955001"].includes(String(course.id)))) throw new Error("Course Library visibility fixtures are incorrect.");
if ((progress?.lessons ?? []).length !== 0 || (progress?.activities ?? []).length !== 0) throw new Error("Local learner fixture must start without progress.");
const assignments = await assignmentsResponse.json();
if (assignments.length !== 1 || assignments[0]?.courseId !== 952001 || assignments[0]?.status !== "active") throw new Error("Local Class assignment fixture is incorrect.");

console.log("Local PronounceLab bootstrap complete.");
console.log(`Admin:   ${adminEmail}`);
console.log(`Teacher: ${teacherEmail}`);
console.log(`Learner: ${learnerEmail}`);
console.log("All local password logins verified.");
console.log("Teacher fixture visibility verified through RLS.");
console.log("Class-only, Public, and Unlisted learner visibility fixtures verified.");
console.log("Lesson Studio: http://127.0.0.1:3000/admin/lessons/951021/studio");
console.log("Learner Home:  http://127.0.0.1:3000/");
console.log("Assigned Course: http://127.0.0.1:3000/classes");
console.log("Course Library: http://127.0.0.1:3000/courses");
console.log("Unlisted Course: http://127.0.0.1:3000/shared/local-unlisted-course-share-52e");
console.log("Passwords use documented local defaults unless PRONOUNCELAB_LOCAL_*_PASSWORD overrides were set.");
