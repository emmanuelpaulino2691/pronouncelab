import type { LessonData } from "../../types/LessonData";

export const lesson1: LessonData = {
  id: 1,

  title: "Introduction to English Sounds",

  description:
    "Learn the basic English sounds and why they are important.",

    activities: [
  {
    id: 1,
    title: "Introduction",
    type: "theory",
  },
  {
    id: 2,
    title: "Listen and Repeat",
    type: "listening",
  },
  {
  id: 3,
  title: "Pronunciation Practice",
  type: "pronunciation",
},
{
  id: 4,
  title: "Practice",
  type: "practice",
},
{
  id: 5,
  title: "Quiz",
  type: "quiz",
},
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
      text: "Some sounds may not exist in your native language, so learning to hear and produce them correctly takes practice.",
    },
    {
      type: "tip",
      text: "Don't try to memorize everything at once. Focus on one sound at a time.",
    },
    {
      type: "audio",
      src: "/audio/sample.mp3",
    },
    {
  type: "example",
  title: "Example",
  text: "ship /ʃɪp/ → sheep /ʃiːp/",
},
  ],

listening: [
  {
    id: 1,
    title: "Listen and Repeat",
    audio: "/audio/sample.mp3",
    instructions: "Listen carefully and repeat the sounds.",
    transcript: "ship → sheep",

    questions: [
      {
        id: 1,
        question: "Which word contains the long /iː/ sound?",
        options: ["ship", "sheep", "both", "neither"],
        correctAnswer: 1,
      },
    ],
  },
],
practice: [
  {
    id: 1,
    title: "Practice the Sounds",
    instructions: "Choose the correct answer for each question.",

    questions: [
      {
        id: 1,
        question: "Which word contains the short /ɪ/ sound?",
        options: ["ship", "sheep", "both", "neither"],
        correctAnswer: 0,
      },
      {
        id: 2,
        question: "Which word contains the long /iː/ sound?",
        options: ["ship", "sheep", "both", "neither"],
        correctAnswer: 1,
      },
    ],
  },
],
};