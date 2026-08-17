import TheoryActivity from "./TheoryActivity";
import ListeningActivity from "./ListeningActivity";
import PracticeActivity from "./PracticeActivity";
import PronunciationActivity from "./PronunciationActivity";
import QuizActivity from "./QuizActivity";
import AiSpeakingMissionActivity from "./AiSpeakingMissionActivity";

export const activityRegistry = {
  theory: TheoryActivity,
  listening: ListeningActivity,
  practice: PracticeActivity,
  pronunciation: PronunciationActivity,
  quiz: QuizActivity,
  ai_speaking_mission: AiSpeakingMissionActivity,
};
