import TheoryActivity from "./TheoryActivity";
import ListeningActivity from "./ListeningActivity";
import PronunciationActivity from "./PronunciationActivity";
import PracticeActivity from "./PracticeActivity";
import QuizActivity from "./QuizActivity";

export const activityRegistry = {
  theory: TheoryActivity,
  listening: ListeningActivity,
  pronunciation: PronunciationActivity,
  practice: PracticeActivity,
  quiz: QuizActivity,
};