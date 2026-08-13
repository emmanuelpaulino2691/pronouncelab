/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MainLayout from "../../shared/layouts/MainLayout";
import { useLearnerRouteIdentity } from "../auth/useLearnerRouteIdentity";
import { joinClass, listMyMemberships, type EnrollmentRecord } from "./classService";

export default function LearnerClassesPage() {
  const identity=useLearnerRouteIdentity(); const [items,setItems]=useState<EnrollmentRecord[]>([]); const [code,setCode]=useState(""); const [message,setMessage]=useState<string|null>(null);
  const load=async()=>setItems(await listMyMemberships());
  useEffect(()=>{if(identity.kind==="learner") void load().catch(()=>setMessage("Classes could not be loaded.")); else setItems([]);},[identity.kind]);
  if(identity.kind==="anonymous") return <MainLayout><section className="rounded-2xl border bg-white p-7"><h1 className="text-3xl font-bold">Classes</h1><p className="mt-3 text-slate-600">Sign in with a learner account to join and view Classes.</p><Link to="/login" state={{from:"/classes"}} className="mt-5 inline-flex rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white">Sign in</Link></section></MainLayout>;
  if(identity.kind==="staff") return <MainLayout><section className="rounded-2xl border bg-white p-7"><h1 className="text-3xl font-bold">Staff preview</h1><p className="mt-3 text-slate-600">Staff accounts cannot enroll as learners.</p><Link to="/admin/classes" className="mt-5 inline-flex font-semibold text-blue-700">Open Content Studio Classes</Link></section></MainLayout>;
  return <MainLayout><section className="mx-auto max-w-4xl space-y-7"><header><h1 className="text-3xl font-bold">Your Classes</h1><p className="mt-2 text-slate-600">Join a teacher's Class with its private code.</p></header><form className="flex gap-3 rounded-2xl border bg-white p-5" onSubmit={e=>{e.preventDefault();setMessage(null);void joinClass(code).then(()=>load()).then(()=>{setCode("");setMessage("Class joined.");}).catch(()=>setMessage("That join code is invalid or unavailable."));}}><input aria-label="Class join code" value={code} onChange={e=>setCode(e.target.value.toUpperCase())} className="min-w-0 flex-1 rounded-xl border px-4" maxLength={16} required/><button className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white">Join Class</button></form>{message&&<p role="status">{message}</p>}<div className="grid gap-4 sm:grid-cols-2">{items.map(item=><article key={item.class_id} className="rounded-2xl border bg-white p-5"><h2 className="text-lg font-bold">{item.classes?.name}</h2><p className="mt-2 text-sm text-slate-600">{item.classes?.description}</p></article>)}</div>{items.length===0&&<p className="rounded-2xl border border-dashed p-7 text-slate-600">You have not joined a Class yet.</p>}</section></MainLayout>;
}
