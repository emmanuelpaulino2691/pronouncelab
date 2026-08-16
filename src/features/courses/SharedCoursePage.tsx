import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import MainLayout from "../../shared/layouts/MainLayout";
import { useLearnerRouteIdentity } from "../auth/useLearnerRouteIdentity";
import { redeemUnlistedCourseLink } from "./courseLibraryService";

export default function SharedCoursePage(){
  const{token=""}=useParams();const identity=useLearnerRouteIdentity();const navigate=useNavigate();const[error,setError]=useState<string|null>(null);
  useEffect(()=>{if(identity.kind!=="learner")return;let active=true;void redeemUnlistedCourseLink(token).then(courseId=>{if(active)navigate(`/courses/${courseId}`,{replace:true})}).catch(()=>{if(active)setError("This shared Course link is invalid or no longer available.")});return()=>{active=false}},[identity.kind,navigate,token]);
  if(identity.kind==="anonymous")return <MainLayout><section className="mx-auto max-w-xl rounded-2xl border bg-white p-7"><p className="text-sm font-bold uppercase text-blue-700">Independent Practice</p><h1 className="mt-2 text-3xl font-bold">Sign in to open this shared Course</h1><p className="mt-3 text-slate-600">Unlisted links are private, revocable entry points for signed-in learners. They are not Class assignments.</p><Link to="/login" state={{from:`/shared/${token}`}} className="mt-5 inline-flex min-h-12 items-center rounded-xl bg-blue-600 px-5 font-semibold text-white">Sign in</Link></section></MainLayout>;
  if(identity.kind==="staff")return <MainLayout><section className="rounded-2xl border bg-white p-7"><h1 className="text-2xl font-bold">Learner link unavailable</h1><p className="mt-2 text-slate-600">Staff accounts cannot create independent learner progress. Use Student Preview from Content Studio.</p></section></MainLayout>;
  return <MainLayout><section className="rounded-2xl border bg-white p-7"><h1 className="text-2xl font-bold">Opening shared Course…</h1>{error?<p role="alert" className="mt-3 text-red-700">{error}</p>:<p role="status" className="mt-3 text-slate-600">Confirming your secure link.</p>}</section></MainLayout>;
}
