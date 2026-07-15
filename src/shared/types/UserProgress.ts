export type UserProgress = {
  lessonsStarted: number[];
  lessonsCompleted: number[];

  activitiesCompleted: {
    lessonId: number;
    activities: number[];
  }[];
};
