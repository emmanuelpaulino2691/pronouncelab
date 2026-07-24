import { ButtonLink, Card } from "../ui";

export function EmptyClassesState() {
  return <Card className="p-10 text-center sm:p-14"><h2 className="text-xl font-bold text-slate-950">You have not created any classes yet.</h2><p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">Classes let you organize students and assign published courses.</p><ButtonLink to="/admin/classes/new" className="mt-6">Create your first class</ButtonLink></Card>;
}
