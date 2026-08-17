export type UserProgress = {
  lessonsStarted: string[];
  lessonsCompleted: string[];

  activitiesCompleted: {
    lessonId: string;
    activities: number[];
  }[];
};
