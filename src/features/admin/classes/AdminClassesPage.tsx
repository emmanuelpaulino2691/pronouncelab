import { useMemo, useState } from "react";
import { ButtonLink, Card, PageHeader, Select, TextInput } from "../ui";
import { filterClassSummaries } from "./classFilters";
import { EmptyClassesState } from "./EmptyClassesState";

export default function AdminClassesPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "draft" | "archived">("all");
  const classes = useMemo(() => filterClassSummaries([], query, status), [query, status]);
  return <section className="mx-auto max-w-7xl space-y-7"><PageHeader eyebrow="Teacher Workspace" title="My Classes" description="Manage your teaching groups." actions={<ButtonLink to="/admin/classes/new" icon="plus">Create Class</ButtonLink>} /><Card className="p-4"><div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem]"><label><span className="sr-only">Search classes</span><TextInput value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search classes" /></label><label><span className="sr-only">Filter classes by status</span><Select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}><option value="all">All</option><option value="active">Active</option><option value="draft">Draft</option><option value="archived">Archived</option></Select></label></div></Card>{classes.length === 0 ? <EmptyClassesState /> : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{classes.map((item) => <div key={item.id}>{item.name}</div>)}</div>}</section>;
}
