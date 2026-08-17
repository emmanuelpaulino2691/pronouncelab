import { describe, expect, it } from "vitest";
import type { LearnerAssignmentSnapshot } from "../classes/learnerClassWorkspace";
import type { LearnerCourseJourney } from "../learner-journey/learnerJourney";
import { presentClassProgress, presentIndependentProgress } from "./learnerProgressPresentation";

describe("learner Progress context separation", () => {
  it("presents Class Progress with Class identity and immutable Release route", () => {
    const assignment={assignmentId:2,classId:3,className:"English A1",releaseId:4,courseTitle:"Vowels",navigation:{completed:2,total:5,percent:40,complete:false,continueLessonId:8}} as LearnerAssignmentSnapshot;
    expect(presentClassProgress([assignment])).toEqual([{key:"3:2",className:"English A1",courseTitle:"Vowels",completed:2,total:5,percent:40,href:"/releases/4?classId=3"}]);
  });
  it("presents only started independent Courses and never blends percentages", () => {
    const course=(id:string,state:"not_started"|"in_progress",percent:number)=>({course:{id,title:`Course ${id}`},state,percent,completedLessons:percent?1:0,totalLessons:4}) as LearnerCourseJourney;
    expect(presentIndependentProgress([course("1","not_started",0),course("2","in_progress",25)])).toEqual([{courseTitle:"Course 2",completed:1,total:4,percent:25,href:"/courses/2"}]);
  });
});
