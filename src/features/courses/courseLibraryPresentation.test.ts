import { describe, expect, it } from "vitest";
import type { LearnerCourse } from "../../shared/content/contracts/learnerContent";
import { mostRecentIndependentPractice, publicLibraryCourses } from "./courseLibraryPresentation";

function course(id:string,visibility:LearnerCourse["visibility"],lessonId:string):LearnerCourse {
  return { id,slug:id,title:id,description:"",level:"A1",emoji:"",position:0,unitCount:1,visibility,units:[{ id:`u${id}`,courseId:id,title:"Unit",description:"",position:0,lessonCount:1,lessons:[{ id:lessonId,unitId:`u${id}`,title:"Lesson",description:"",position:0,currentVersionId:"1",activityCount:2,available:true }] }] } as unknown as LearnerCourse;
}

describe("Course Library separation",()=>{
  const courses=[course("1","public","11"),course("2","unlisted","22"),course("3","class_only","33")];
  it("lists only Public Courses",()=>expect(publicLibraryCourses(courses).map(item=>item.id)).toEqual(["1"]));
  it("resumes the most recent accessible independent Lesson and activity",()=>{
    const recent=mostRecentIndependentPractice(courses,{ lessons:[{lessonId:"11",completedAt:null,lastAccessedAt:"2026-01-01",lastActivityId:"111"},{lessonId:"22",completedAt:null,lastAccessedAt:"2026-02-01",lastActivityId:"222"}],activities:[{lessonId:"11",activityId:"111",position:0,completedAt:""},{lessonId:"22",activityId:"222",position:1,completedAt:""}] });
    expect(recent).toMatchObject({href:"/lessons/22?activity=1",activityPosition:1});
  });
  it("does not fabricate recency without synchronized timestamps",()=>expect(mostRecentIndependentPractice(courses,null)).toBeNull());
});
