import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MainLayout from "../../shared/layouts/MainLayout";
import { useLearnerRouteIdentity } from "../auth/useLearnerRouteIdentity";
import { listClassCourseAssignments, listMyMemberships } from "../classes/classService";
import { resolveReleaseNavigation } from "../releases/releaseNavigation";
import { getReleaseManifest, getReleaseProgress } from "../releases/releaseService";
import { selectHomeAssignment, type HomeAssignment } from "./assignmentHome";

export default function DashboardPage(){
  const identity=useLearnerRouteIdentity();const[items,setItems]=useState<HomeAssignment[]>([]);const[loading,setLoading]=useState(false);const[error,setError]=useState(false);
  useEffect(()=>{let active=true;const timer=window.setTimeout(()=>{
    if(identity.kind!=="learner"){setItems([]);return}
    setLoading(true);
    void listMyMemberships().then(async memberships=>{
      const groups=await Promise.all(memberships.map(async membership=>{
        const assignments=await listClassCourseAssignments(membership.class_id);
        return Promise.all(assignments.map(async assignment=>{const[manifest,progress]=await Promise.all([getReleaseManifest(assignment.releaseId),getReleaseProgress(assignment.releaseId)]);const navigation=resolveReleaseNavigation(manifest,progress);return{assignmentId:assignment.assignmentId,releaseId:assignment.releaseId,classId:membership.class_id,className:membership.classes?.name??"Class",courseTitle:assignment.courseTitle,...navigation,lastAccessedAt:progress.lessons.map(row=>row.lastAccessedAt).filter((value):value is string=>Boolean(value)).sort().at(-1)??null,progress}}));
      }));return groups.flat();
    }).then(rows=>{if(active){setItems(rows);setError(false)}}).catch(()=>{if(active)setError(true)}).finally(()=>{if(active)setLoading(false)});
  });return()=>{active=false;window.clearTimeout(timer)}},[identity.kind]);
  const current=selectHomeAssignment(items);
  return <MainLayout><header><h1 className="text-3xl font-bold sm:text-4xl">Improve your English every day.</h1><p className="mt-3 max-w-2xl text-lg text-slate-600">Continue your Class work or choose independent practice from the Course Library.</p></header>
    {identity.kind==="anonymous"&&<section className="mt-8 rounded-2xl border bg-white p-7"><p className="text-xs font-bold uppercase tracking-wide text-blue-700">Class assignments</p><h2 className="mt-2 text-2xl font-bold">Sign in to see your Classes and assignments</h2><p className="mt-2 text-slate-600">Guest practice remains on this device and never appears as assigned Class work.</p><div className="mt-5 flex flex-col gap-3 sm:flex-row"><Link to="/login" state={{from:"/"}} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-600 px-5 font-bold text-white">Sign in</Link><Link to="/courses" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-blue-600 px-5 font-bold text-blue-700">Explore Course Library</Link></div></section>}
    {identity.kind==="staff"&&<section className="mt-8 rounded-2xl border bg-white p-7"><h2 className="text-2xl font-bold">Staff Preview</h2><p className="mt-2 text-slate-600">Staff sessions do not create learner progress.</p><Link to="/admin" className="mt-5 inline-flex font-bold text-blue-700">Back to Content Studio</Link></section>}
    {identity.kind==="learner"&&<section className="mt-8" aria-labelledby="class-work-heading"><p className="text-xs font-bold uppercase tracking-wide text-blue-700">Continue your Class work</p><h2 id="class-work-heading" className="mt-2 text-2xl font-bold">Assignments</h2>{loading&&<p role="status" className="mt-4 rounded-2xl bg-white p-6">Loading assignments…</p>}{error&&<p role="alert" className="mt-4 rounded-2xl border border-red-200 bg-white p-6">Assignments could not be loaded.</p>}{!loading&&!error&&current&&<article className="mt-4 max-w-3xl rounded-2xl border border-blue-200 bg-white p-6 shadow-sm"><p className="text-sm font-bold text-blue-700">Assigned Course</p><h3 className="mt-1 text-2xl font-bold">{current.courseTitle}</h3><p className="mt-1 text-slate-600">{current.className}</p><p className="mt-4 font-semibold">Class Progress: {current.completed} of {current.total} Lessons · {current.percent}%</p><Link to={`/releases/${current.releaseId}?classId=${current.classId}`} className="mt-5 inline-flex min-h-12 items-center rounded-xl bg-blue-600 px-5 font-bold text-white">Continue Assignment</Link></article>}{!loading&&!error&&!current&&<div className="mt-4 rounded-2xl border bg-white p-6"><h3 className="text-xl font-bold">No active assignment needs attention</h3><p className="mt-2 text-slate-600">Open My Classes to review completed work, or practice independently in Course Library.</p></div>}<div className="mt-5 flex flex-col gap-3 sm:flex-row"><Link to="/classes" className="font-bold text-blue-700">My Classes →</Link><Link to="/courses" className="font-bold text-slate-700">Course Library →</Link></div></section>}
  </MainLayout>;
}
