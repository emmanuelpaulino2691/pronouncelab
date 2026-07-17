import type { LessonData } from "../../types/LessonData";

const silentAudioFallback =
  "data:audio/wav;base64,UklGRjQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YRAAAACAgICAgICAgICAgICAgICA";

export const lesson3: LessonData = {
  id: 3,

  title: "Short and Long Vowels",

  description:
    "Practice hearing, identifying, and producing common English short and long vowel contrasts.",

  activities: [
    {
      id: 1,
      title: "Short and Long Vowel Contrasts",
      type: "theory",
    },
    {
      id: 2,
      title: "Vowel Recognition (Spoken Audio Pending)",
      type: "listening",
    },
    {
      id: 3,
      title: "Vowel Pronunciation (Spoken Audio Pending)",
      type: "pronunciation",
    },
    {
      id: 4,
      title: "Vowel Contrast Practice",
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
      text: "Short and Long Vowels",
    },
    {
      type: "paragraph",
      text: "English vowel contrasts can change the meaning of a word. The symbols /ɪ/ and /iː/, for example, distinguish ship from sheep.",
    },
    {
      type: "example",
      title: "/ɪ/ and /iː/",
      text: "Compare ship /ʃɪp/ with sheep /ʃiːp/, and sit /sɪt/ with seat /siːt/.",
    },
    {
      type: "example",
      title: "/ʊ/ and /uː/",
      text: "Compare full /fʊl/ with fool /fuːl/, and pull /pʊl/ with pool /puːl/.",
    },
    {
      type: "paragraph",
      text: "The length mark /ː/ shows that a vowel is typically held longer, but tongue position and lip shape also help distinguish the sounds.",
    },
    {
      type: "tip",
      text: "Practice contrasting two words at a time. Keep the consonants stable and change only the vowel sound.",
    },
  ],

  listening: [
    {
      id: 1,
      title: "Recognize Vowel Contrasts (Spoken Audio Pending)",
      audio: silentAudioFallback,
      instructions:
        "The audio control contains a silent placeholder. Spoken audio is not available yet. Use the transcript and written questions to study each vowel contrast.",
      transcript:
        "Short /ɪ/: ship, sit. Long /iː/: sheep, seat. Short /ʊ/: full, pull. Long /uː/: fool, pool.",
      questions: [
        {
          id: 1,
          question:
            "According to the transcript, which word contains /ɪ/?",
          options: [
            "ship",
            "sheep",
            "seat",
            "pool",
          ],
          correctAnswer: 0,
        },
        {
          id: 2,
          question:
            "According to the transcript, which word contains /iː/?",
          options: [
            "sit",
            "full",
            "seat",
            "pull",
          ],
          correctAnswer: 2,
        },
        {
          id: 3,
          question:
            "According to the transcript, which word contains /ʊ/?",
          options: [
            "fool",
            "pool",
            "sheep",
            "pull",
          ],
          correctAnswer: 3,
        },
        {
          id: 4,
          question:
            "According to the transcript, which word contains /uː/?",
          options: [
            "full",
            "sit",
            "pool",
            "ship",
          ],
          correctAnswer: 2,
        },
      ],
    },
  ],

  pronunciation: [
    {
      id: 1,
      title: "Practice Vowel Pairs (Spoken Audio Pending)",
      audio: silentAudioFallback,
      text: "The audio control contains a silent placeholder; no spoken pronunciation model is available yet. Use the visual guide and alternate each pair slowly: ship /ʃɪp/ — sheep /ʃiːp/; sit /sɪt/ — seat /siːt/; full /fʊl/ — fool /fuːl/; pull /pʊl/ — pool /puːl/.",
    },
  ],

  practice: [
    {
      id: 1,
      title: "Written Vowel Contrast Practice",
      instructions:
        "Use the IPA symbols and written words to identify each vowel. This activity does not require audio.",
      questions: [
        {
          id: 1,
          question:
            "Which transcription represents ship?",
          options: [
            "/ʃɪp/",
            "/ʃiːp/",
            "/sɪt/",
            "/siːt/",
          ],
          correctAnswer: 0,
        },
        {
          id: 2,
          question:
            "Which transcription represents sheep?",
          options: [
            "/ʃɪp/",
            "/ʃiːp/",
            "/fʊl/",
            "/fuːl/",
          ],
          correctAnswer: 1,
        },
        {
          id: 3,
          question:
            "Which pair contrasts /ɪ/ with /iː/?",
          options: [
            "ship and sheep",
            "full and pull",
            "fool and pool",
            "ship and sit",
          ],
          correctAnswer: 0,
        },
        {
          id: 4,
          question:
            "Which word contains the /ʊ/ vowel?",
          options: [
            "seat",
            "sheep",
            "full",
            "fool",
          ],
          correctAnswer: 2,
        },
        {
          id: 5,
          question:
            "Which word contains the /uː/ vowel?",
          options: [
            "pull",
            "pool",
            "ship",
            "sit",
          ],
          correctAnswer: 1,
        },
        {
          id: 6,
          question:
            "Which transcription represents fool?",
          options: [
            "/fʊl/",
            "/fuːl/",
            "/pʊl/",
            "/puːl/",
          ],
          correctAnswer: 1,
        },
        {
          id: 7,
          question:
            "Which pair contrasts /ʊ/ with /uː/?",
          options: [
            "ship and sit",
            "sheep and seat",
            "pull and pool",
            "full and pull",
          ],
          correctAnswer: 2,
        },
        {
          id: 8,
          question:
            "What does the mark /ː/ indicate in /iː/ and /uː/?",
          options: [
            "The vowel is typically held longer",
            "The vowel is silent",
            "The following consonant is doubled",
            "The sound is always unstressed",
          ],
          correctAnswer: 0,
        },
      ],
    },
  ],

  quiz: [
    {
      id: 1,
      title: "Lesson 3 Review",
      questions: [
        "Explain how /ɪ/ differs from /iː/ in ship and sheep.",
        "Identify the vowel contrast in sit and seat.",
        "Explain how /ʊ/ differs from /uː/ in full and fool.",
        "Identify the vowel contrast in pull and pool.",
      ],
      interactiveQuestions: [
        {
          id: 1,
          question:
            "Which word contains the short /ɪ/ vowel?",
          options: [
            "sheep",
            "seat",
            "ship",
            "pool",
          ],
          correctAnswer: 2,
          explanation:
            "Ship is transcribed /ʃɪp/ and contains /ɪ/.",
        },
        {
          id: 2,
          question:
            "Which word contains the long /iː/ vowel?",
          options: [
            "sit",
            "seat",
            "full",
            "pull",
          ],
          correctAnswer: 1,
          explanation:
            "Seat is transcribed /siːt/ and contains /iː/.",
        },
        {
          id: 3,
          question:
            "Which pair contrasts /ʊ/ with /uː/?",
          options: [
            "ship and sheep",
            "sit and seat",
            "pull and pool",
            "ship and sit",
          ],
          correctAnswer: 2,
          explanation:
            "Pull contains /ʊ/, while pool contains /uː/.",
        },
        {
          id: 4,
          question:
            "What does the IPA mark /ː/ indicate in /iː/ and /uː/?",
          options: [
            "The vowel is typically held longer",
            "The vowel is silent",
            "The following consonant is doubled",
            "The syllable is always unstressed",
          ],
          correctAnswer: 0,
          explanation:
            "The length mark /ː/ indicates that the vowel is typically held longer.",
        },
      ],
    },
  ],
};
