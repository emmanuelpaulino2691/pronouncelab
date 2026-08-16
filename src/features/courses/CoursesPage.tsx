import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MainLayout from "../../shared/layouts/MainLayout";
import { learnerContentProvider } from "../../shared/content/learnerContentComposition";
import { useLearnerResource } from "../../shared/content/hooks/useLearnerResource";
import { useUserProgress } from "../../shared/hooks/useUserProgress";
import { loadServerLearnerProgress } from "../../shared/progress/learnerProgressService";
import type { ServerLearnerProgress } from "../../shared/progress/learnerProgressSync";
import { loadLessonState } from "../../shared/utils/lessonStorage";
import { useLearnerRouteIdentity } from "../auth/useLearnerRouteIdentity";
import { listClassCourseAssignments, listMyMemberships } from "../classes/classService";
import { resolveLearnerCourseState, resolveRecommendedLearnerStep } from "../learner-journey/learnerJourney";
import { normalizeLessonState } from "../lesson/studentExperience";
import CourseCard from "./components/CourseCard";
import { mostRecentIndependentPractice, publicLibraryCourses } from "./courseLibraryPresentation";

type AssignmentContext={classId:number;className:string;releaseId:number};

export default function CoursesPage(){
  const{progress}=useUserProgress();const identity=useLearnerRouteIdentity();const resource=useLearnerResource(signal=>learnerContentProvider.listCourses(signal),[]);const[server,setServer]=useState<ServerLearnerProgress|null>(null);const[assigned,setAssigned]=useState<Record<string,AssignmentContext[]>>({});
  useEffect(()=>{let active=true;if(identity.kind!=="learner")return;void Promise.all([loadServerLearnerProgress(),listMyMemberships()]).then(async([snapshot,memberships])=>{const rows=await Promise.all(memberships.map(async membership=>({membership,assignments:await listClassCourseAssignments(membership.class_id)})));if(!active)return;setServer(snapshot);const contexts:Record<string,AssignmentContext[]>={};rows.forEach(({membership,assignments})=>assignments.forEach(assignment=>{const key=String(assignment.courseId);contexts[key]=[...(contexts[key]??[]),{classId:membership.class_id,className:membership.classes?.name??"Class",releaseId:assignment.releaseId}]}));setAssigned(contexts)}).catch(()=>{if(active)setServer(null)});return()=>{active=false}},[identity.kind]);
  const accessible=resource.value??[];const publicCourses=publicLibraryCourses(accessible);const activityPositions=Object.fromEntries(accessible.flatMap(course=>course.units.flatMap(unit=>unit.lessons.map(lesson=>[lesson.id,normalizeLessonState(loadLessonState(lesson.id),lesson.activityCount).currentActivity]))));const fallback=resolveRecommendedLearnerStep(publicCourses,progress,activityPositions);const recent=mostRecentIndependentPractice(accessible,server);const journeys=publicCourses.map(course=>resolveLearnerCourseState(course,progress));const ordered=fallback?[...journeys].sort((a,b)=>Number(b.course.id===fallback.course.id)-Number(a.course.id===fallback.course.id)):journeys;
  return <MainLayout><header><p className="text-sm font-bold uppercase tracking-wide text-blue-700">Independent Practice</p><h1 className="mt-1 text-3xl font-bold text-slate-950 sm:text-4xl">Course Library</h1><p className="mt-2 max-w-2xl leading-7 text-slate-600">Practice English on your own. Personal progress here is separate from your Class assignments.</p></header>
    {resource.loading&&<p role="status" className="mt-8 rounded-2xl bg-white p-7">Loading Course Library…</p>}{resource.error&&<section className="mt-8 rounded-2xl border border-red-200 bg-white p-6"><h2 className="text-xl font-bold">Course Library could not be loaded</h2><button onClick={resource.retry} className="mt-5 min-h-12 rounded-xl bg-blue-600 px-5 font-semibold text-white">Try again</button></section>}
    {!resource.loading&&!resource.error&&recent&&<section aria-labelledby="pickup-heading" className="mt-8 rounded-2xl border border-blue-200 bg-white p-6 shadow-sm"><p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-700">Pick up where you left off</p><h2 id="pickup-heading" className="mt-2 text-2xl font-bold">{recent.course.title}</h2><p className="mt-1 text-sm font-semibold text-slate-500">Independent Practice</p><p className="mt-3 text-slate-600">{recent.unit.title} · {recent.lesson.title} · Activity {recent.activityPosition+1}</p><Link to={recent.href} className="mt-5 inline-flex min-h-12 items-center rounded-xl bg-blue-600 px-5 font-bold text-white">Continue Practice</Link></section>}
    {!resource.loading&&!resource.error&&<section className="mt-10" aria-labelledby="browse-library-heading"><h2 id="browse-library-heading" className="text-xl font-bold">Browse Public Courses</h2>{ordered.length?<div className="mt-4 grid gap-5 md:grid-cols-2">{ordered.map(journey=><CourseCard key={journey.course.id} journey={journey} recommended={false} assignments={assigned[String(journey.course.id)]??[]}/>)}</div>:<p className="mt-4 rounded-2xl border border-dashed p-7 text-slate-600">No Public Courses are available yet. Class-only Courses remain available through My Classes.</p>}</section>}
  </MainLayout>;
}
