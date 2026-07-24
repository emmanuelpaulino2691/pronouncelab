export const UserRole = { Administrator: "administrator", Teacher: "teacher", Publisher: "publisher", Editor: "editor", Student: "student" } as const;
export type UserRole = typeof UserRole[keyof typeof UserRole];

export const CourseStatus = { Draft: "draft", Published: "published", Unpublished: "unpublished", Archived: "archived" } as const;
export type CourseStatus = typeof CourseStatus[keyof typeof CourseStatus];
export type PublicationStatus = CourseStatus;
export type LessonStatus = CourseStatus;

export const ClassStatus = { Draft: "draft", Active: "active", Archived: "archived" } as const;
export type ClassStatus = typeof ClassStatus[keyof typeof ClassStatus];

export const AssignmentStatus = { Draft: "draft", Active: "active", Completed: "completed", Archived: "archived" } as const;
export type AssignmentStatus = typeof AssignmentStatus[keyof typeof AssignmentStatus];

export const ActivityType = { Theory: "theory", Listening: "listening", Pronunciation: "pronunciation", Practice: "practice", Quiz: "quiz", AiSpeakingMission: "ai_speaking_mission", InteractivePractice: "interactive_practice" } as const;
export type ActivityType = typeof ActivityType[keyof typeof ActivityType];
export type AIActivityType = typeof ActivityType.AiSpeakingMission;
