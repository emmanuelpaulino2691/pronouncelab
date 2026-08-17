import { describe, expect, it } from "vitest";
import { homeEmptyState, orderHomeAssignments, selectHomeAssignment, type HomeAssignment } from "./assignmentHome";

const item = (id:number, complete=false, last:string|null=null, completed=complete?1:0) => ({
  assignmentId:id,releaseId:id,classId:id,className:`Class ${id}`,courseId:id,courseTitle:"Course",courseDescription:"",courseLevel:"A1",releaseNumber:1,latestReleaseNumber:1,assignedAt:`2026-01-0${id}`,endedAt:null,status:"active",lastAccessedAt:last,
  navigation:{completed,total:1,percent:complete?100:completed*100,complete,continueLessonId:complete?null:id},progress:{lessons:[],activities:[]},
}) as HomeAssignment;

describe("Home assignment continuation", () => {
  it("prioritizes a recently active in-progress Assignment", () => expect(selectHomeAssignment([item(1,false,null),item(2,false,"2026-02-01",1),item(3,true,"2026-03-01")])?.assignmentId).toBe(2));
  it("keeps not-started Assignments after started Assignments", () => expect(orderHomeAssignments([item(1),item(2,false,"2026-01-01")]).map(row=>row.assignmentId)).toEqual([2,1]));
  it("does not let completed Assignments dominate", () => expect(selectHomeAssignment([item(1,true)])).toBeNull());
  it("distinguishes no Classes, no Assignments, and completed work", () => {
    expect(homeEmptyState(0,0)).toBe("no-classes");expect(homeEmptyState(1,0)).toBe("no-assignments");expect(homeEmptyState(1,1)).toBe("all-complete");
  });
});
