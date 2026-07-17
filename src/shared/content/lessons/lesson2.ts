import type { LessonData } from "../../types/LessonData";

const silentAudioFallback =
  "data:audio/wav;base64,UklGRjQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YRAAAACAgICAgICAgICAgICAgICA";

export const lesson2: LessonData = {
  id: 2,

  title: "The English Alphabet and Sounds",

  description:
    "Learn the relationship between English letters, letter names, and speech sounds.",

  activities: [
    {
      id: 1,
      title: "Letters and Sounds",
      type: "theory",
    },
    {
      id: 2,
      title: "Sound Recognition (Spoken Audio Pending)",
      type: "listening",
    },
    {
      id: 3,
      title: "Pronunciation Guide (Spoken Audio Pending)",
      type: "pronunciation",
    },
    {
      id: 4,
      title: "Sound Practice",
      type: "practice",
    },
    {
      id: 5,
      title: "Lesson Review",
      type: "quiz",
    },
  ],

  theory: [
    {
      type: "heading",
      text: "Letters and Sounds Are Different",
    },
    {
      type: "paragraph",
      text: "English has 26 written letters, but it uses around 44 speech sounds. A letter name tells you what a letter is called; it does not always tell you how that letter sounds inside a word.",
    },
    {
      type: "example",
      title: "The letter C",
      text: "C sounds like /k/ in cat and /s/ in city.",
    },
    {
      type: "example",
      title: "The letter G",
      text: "G sounds like /g/ in go and /dʒ/ in giant.",
    },
    {
      type: "paragraph",
      text: "Two letters can also work together to represent one sound. Common examples include sh in ship, ch in chair, and th in think.",
    },
    {
      type: "tip",
      text: "Listen to the complete word instead of assuming its pronunciation from spelling alone.",
    },
  ],

  listening: [
    {
      id: 1,
      title: "Recognize Letter Sounds (Spoken Audio Pending)",
      audio: silentAudioFallback,
      instructions:
        "The audio control contains a silent placeholder. Spoken audio is not available yet. Use the transcript and questions to study the sound patterns.",
      transcript:
        "C: cat /k/, city /s/. G: go /g/, giant /dʒ/. Letter pairs: ship /ʃ/, chair /tʃ/, think /θ/.",
      questions: [
        {
          id: 1,
          question:
            "Which word begins with the /k/ sound?",
          options: [
            "cat",
            "city",
            "ship",
            "giant",
          ],
          correctAnswer: 0,
        },
        {
          id: 2,
          question:
            "Which word begins with the /dʒ/ sound?",
          options: [
            "go",
            "cat",
            "giant",
            "think",
          ],
          correctAnswer: 2,
        },
        {
          id: 3,
          question:
            "Which letter pair represents /ʃ/ in the transcript?",
          options: [
            "ch",
            "sh",
            "th",
            "ng",
          ],
          correctAnswer: 1,
        },
      ],
    },
  ],

  pronunciation: [
    {
      id: 1,
      title: "Practice Letter and Word Sounds (Spoken Audio Pending)",
      audio: silentAudioFallback,
      text: "The audio control contains a silent placeholder; no spoken pronunciation model is available yet. Use this visual guide to practice slowly: C /siː/ — cat /k/ — city /s/; G /dʒiː/ — go /g/ — giant /dʒ/; ship /ʃ/ — chair /tʃ/ — think /θ/.",
    },
  ],

  practice: [
    {
      id: 1,
      title: "Visual Letters and Sounds Practice",
      instructions:
        "Read each word and identify its written sound pattern. This activity does not require audio.",
      questions: [
        {
          id: 1,
          question:
            "In which word does C represent /s/?",
          options: [
            "cat",
            "coat",
            "city",
            "cup",
          ],
          correctAnswer: 2,
        },
        {
          id: 2,
          question:
            "In which word does G represent /g/?",
          options: [
            "giant",
            "gym",
            "go",
            "gentle",
          ],
          correctAnswer: 2,
        },
        {
          id: 3,
          question:
            "Which word begins with the /tʃ/ sound?",
          options: [
            "ship",
            "chair",
            "think",
            "city",
          ],
          correctAnswer: 1,
        },
        {
          id: 4,
          question:
            "In which word does C have the hard /k/ sound?",
          options: [
            "cat",
            "city",
            "center",
            "cycle",
          ],
          correctAnswer: 0,
        },
        {
          id: 5,
          question:
            "In which word does G have the soft /dʒ/ sound?",
          options: [
            "giant",
            "game",
            "go",
            "gum",
          ],
          correctAnswer: 0,
        },
        {
          id: 6,
          question:
            "Which word begins with SH representing /ʃ/?",
          options: [
            "chair",
            "shoe",
            "think",
            "city",
          ],
          correctAnswer: 1,
        },
        {
          id: 7,
          question:
            "Which word begins with TH representing /θ/ as in think?",
          options: [
            "shoe",
            "chair",
            "thin",
            "game",
          ],
          correctAnswer: 2,
        },
        {
          id: 8,
          question:
            "Which pair contains two words where C represents /k/?",
          options: [
            "cat and cup",
            "city and cycle",
            "center and city",
            "cycle and center",
          ],
          correctAnswer: 0,
        },
      ],
    },
  ],

  quiz: [
    {
      id: 1,
      title: "Lesson 2 Review",
      questions: [
        "Explain the difference between a letter name and a speech sound.",
        "Give one word where C represents /k/ and one where it represents /s/.",
        "Give one word where G represents /g/ and one where it represents /dʒ/.",
        "Identify the letter pairs in ship, chair, and think.",
      ],
    },
  ],
};
