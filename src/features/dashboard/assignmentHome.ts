import type{ReleaseProgress}from"../releases/releaseService";
export type HomeAssignment={assignmentId:number;releaseId:number;classId:number;className:string;courseTitle:string;completed:number;total:number;percent:number;complete:boolean;lastAccessedAt:string|null;progress:ReleaseProgress};
export function selectHomeAssignment(items:readonly HomeAssignment[]){return [...items].filter(item=>!item.complete).sort((left,right)=>(right.lastAccessedAt??"").localeCompare(left.lastAccessedAt??"")||left.assignmentId-right.assignmentId)[0]??null}

