import { execFileSync } from "node:child_process";
import process from "node:process";

const adminEmail = "admin.pronouncelab@gmail.com";
const teacherEmail = "emmanuelpaulino2691@gmail.com";
const adminPassword = process.env.PRONOUNCELAB_LOCAL_ADMIN_PASSWORD ?? "PronounceLabLocalAdmin!2026";
const teacherPassword = process.env.PRONOUNCELAB_LOCAL_TEACHER_PASSWORD ?? "PronounceLabLocalTeacher!2026";
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

function seedFixture(adminId, teacherId) {
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuid.test(adminId) || !uuid.test(teacherId)) throw new Error("Auth Admin API returned an invalid user ID.");
  const containerOutput = execFileSync("docker", ["ps", "--format", "{{.Names}}"], { encoding: "utf8" });
  const databaseContainer = containerOutput.split(/\r?\n/).find((name) => name.startsWith("supabase_db_"));
  if (!databaseContainer) throw new Error("The local Supabase database container is not running.");
  const sql = `
begin;
insert into public.user_roles (user_id, role) values
  ('${adminId}', 'admin'), ('${teacherId}', 'teacher')
on conflict (user_id, role) do nothing;
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
commit;`;
  execFileSync("docker", ["exec", "-i", databaseContainer, "psql", "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", "postgres"], {
    input: sql,
    stdio: ["pipe", "inherit", "inherit"],
  });
}

const admin = await ensureUser(adminEmail, adminPassword);
const teacher = await ensureUser(teacherEmail, teacherPassword);
seedFixture(admin.id, teacher.id);

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

console.log("Local PronounceLab bootstrap complete.");
console.log(`Admin:   ${adminEmail}`);
console.log(`Teacher: ${teacherEmail}`);
console.log("Both local password logins verified.");
console.log("Teacher fixture visibility verified through RLS.");
console.log("Lesson Studio: http://127.0.0.1:3000/admin/lessons/951021/studio");
console.log("Passwords use documented local defaults unless PRONOUNCELAB_LOCAL_*_PASSWORD overrides were set.");
