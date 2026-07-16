import type { LessonData } from "../../types/LessonData";

export const lesson1: LessonData = {
  id: 1,

  title: "Introduction to English Sounds",

  description:
    "Learn the basic English sounds and why they are important.",

  activities: [
    { id: 1, title: "Introduction", type: "theory" },
    { id: 2, title: "Listen and Repeat", type: "listening" },
    { id: 3, title: "Pronunciation Practice", type: "pronunciation" },
    { id: 4, title: "Practice", type: "practice" },
    { id: 5, title: "Quiz", type: "quiz" },
  ],

  theory: [
    {
      type: "heading",
      text: "Introduction to English Sounds",
    },
    {
      type: "paragraph",
      text: "English uses around 44 different sounds. Learning these sounds is the foundation of clear pronunciation.",
    },
    {
      type: "paragraph",
      text: "Some English sounds may not exist in your native language, so practice is important.",
    },
    {
      type: "tip",
      text: "Focus on one sound at a time.",
    },
  ],

  listening: [
    {
      id: 1,
      title: "Listen and Repeat",
      audio: "/audio/sample.mp3",
    },
  ],

  pronunciation: [
    {
      id: 1,
      title: "Pronounce the Words",
      audio: "/audio/sample.mp3",
      text: "ship → sheep",
    },
  ],

  practice: [
    {
      id: 1,
      title: "Practice the Sounds",
      instructions: "Choose the correct answer.",

      questions: [
        {
          id: 1,
          question: "Which word has the short /ɪ/ sound?",
          options: [
            "ship",
            "sheep",
            "seat",
            "see",
          ],
          correctAnswer: 0,
        },
      ],
    },
  ],

  quiz: [
    {
      id: 1,
      title: "Lesson Quiz",
      questions: [
        "Identify the short /ɪ/ sound.",
        "Identify the long /iː/ sound.",
      ],
    },
  ],
};
