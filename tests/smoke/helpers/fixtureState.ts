import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

type LocalFixture = { apiUrl: string; databaseUrl: string; databaseContainer: string; users: Record<Fixture, string> };
type Fixture = "join" | "completion";

const fixtures = {
  join: { classId: 953102 },
  completion: { classId: 953101 },
} as const;

let fixtureCache: LocalFixture | null = null;

function localFixture(): LocalFixture {
  if (fixtureCache) return fixtureCache;
  let values: LocalFixture;
  try {
    values = JSON.parse(readFileSync(new URL("../.local-fixture.json", import.meta.url), "utf8")) as LocalFixture;
  } catch {
    throw new Error("Run npm.cmd run local:bootstrap before smoke tests; the local fixture descriptor is missing.");
  }
  const api = new URL(values.apiUrl);
  const database = new URL(values.databaseUrl);
  if (!["localhost", "127.0.0.1"].includes(api.hostname) || !["localhost", "127.0.0.1"].includes(database.hostname)) {
    throw new Error(`Smoke fixture reset refused non-local services (${api.origin}, ${database.hostname}).`);
  }
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!values.databaseContainer?.startsWith("supabase_db_") || !uuid.test(values.users?.join) || !uuid.test(values.users?.completion)) throw new Error("The local smoke fixture descriptor is incomplete; rerun local:bootstrap.");
  fixtureCache = values;
  return fixtureCache;
}

export async function resetSmokeFixture(name: Fixture) {
  const descriptor = localFixture();
  const fixture = fixtures[name];
  const learnerId = descriptor.users[name];
  const sql = name === "join"
    ? `delete from public.class_enrollments where class_id=${fixture.classId} and learner_user_id='${learnerId}';`
    : `delete from public.learner_release_activity_progress where learner_id='${learnerId}'; delete from public.learner_release_lesson_progress where learner_id='${learnerId}';`;
  execFileSync("docker", ["exec", "-i", descriptor.databaseContainer, "psql", "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", "postgres"], {
    input: `begin; ${sql} commit;`,
    stdio: ["pipe", "pipe", "pipe"],
  });
}
