import type { ActivityTemplate, TemplateCategory, TemplateRegistry } from "./types";

const template = (value: ActivityTemplate) => value;

export const activityTemplateRegistry: TemplateRegistry = [
  template({ id: "learn-blank", category: "learn", name: "Blank Learn", description: "Start with an empty explanation activity.", learnerLevel: "Any", duration: "5–15 min", activityType: "theory", recommendedUse: "Build a custom teaching sequence.", tags: ["Reading"] }),
  template({ id: "learn-vocabulary", category: "learn", name: "Vocabulary Lesson", description: "Introduce useful words with examples and guidance.", learnerLevel: "A1–B2", duration: "10–15 min", activityType: "theory", recommendedUse: "Prepare learners for a topic or task.", tags: ["Vocabulary", "Reading"] }),
  template({ id: "learn-grammar", category: "learn", name: "Grammar Explanation", description: "Explain a language pattern with examples and tips.", learnerLevel: "A2–C1", duration: "10–15 min", activityType: "theory", recommendedUse: "Clarify one focused grammar point.", tags: ["Grammar", "Reading"] }),
  template({ id: "learn-reading", category: "learn", name: "Reading Introduction", description: "Set context and key language before a reading task.", learnerLevel: "A2–C1", duration: "5–10 min", activityType: "theory", recommendedUse: "Activate knowledge before reading.", tags: ["Reading", "Vocabulary"] }),
  template({ id: "listening-single", category: "listening", name: "Single Audio", description: "Focus attention on one short recording.", learnerLevel: "A1–C1", duration: "5–10 min", activityType: "listening", recommendedUse: "Target one listening skill.", tags: ["Listening"] }),
  template({ id: "listening-dialogue", category: "listening", name: "Dialogue", description: "Explore meaning and language in a conversation.", learnerLevel: "A2–B2", duration: "10–15 min", activityType: "listening", recommendedUse: "Practice conversational comprehension.", tags: ["Listening", "Conversation"] }),
  template({ id: "listening-dictation", category: "listening", name: "Dictation", description: "Listen closely and reconstruct spoken language.", learnerLevel: "A2–C1", duration: "10 min", activityType: "listening", recommendedUse: "Develop detailed listening accuracy.", tags: ["Listening", "Assessment"] }),
  template({ id: "listening-quiz", category: "listening", name: "Listening Quiz", description: "Pair audio with comprehension checks.", learnerLevel: "A1–C1", duration: "10–15 min", activityType: "listening", recommendedUse: "Check understanding after listening.", tags: ["Listening", "Assessment"] }),
  template({ id: "pronunciation-pairs", category: "pronunciation", name: "Minimal Pairs", description: "Compare two easily confused sounds in words.", learnerLevel: "A1–C1", duration: "5–10 min", activityType: "pronunciation", recommendedUse: "Build sound discrimination and production.", tags: ["Speaking", "Listening", "Pairs"] }),
  template({ id: "pronunciation-sound", category: "pronunciation", name: "Sound Focus", description: "Practice one spelling and sound relationship.", learnerLevel: "A1–B2", duration: "10 min", activityType: "pronunciation", recommendedUse: "Introduce or reinforce a target sound.", tags: ["Speaking", "Listening"] }),
  template({ id: "pronunciation-stress", category: "pronunciation", name: "Stress Practice", description: "Notice and produce prominent syllables and words.", learnerLevel: "A2–C1", duration: "10 min", activityType: "pronunciation", recommendedUse: "Improve rhythm and intelligibility.", tags: ["Speaking", "Listening"] }),
  template({ id: "pronunciation-shadowing", category: "pronunciation", name: "Shadowing", description: "Repeat closely with a spoken model.", learnerLevel: "B1–C1", duration: "10–15 min", activityType: "pronunciation", recommendedUse: "Practice connected speech and rhythm.", tags: ["Speaking", "Listening"] }),
  template({ id: "quiz-choice", category: "quiz", name: "Multiple Choice", description: "Check one learning objective with focused choices.", learnerLevel: "Any", duration: "5–10 min", activityType: "quiz", recommendedUse: "Run a concise knowledge check.", tags: ["Assessment"] }),
  template({ id: "quiz-review", category: "quiz", name: "Mixed Review", description: "Review several lesson points in one assessment.", learnerLevel: "Any", duration: "10–15 min", activityType: "quiz", recommendedUse: "Consolidate learning at lesson end.", tags: ["Assessment"] }),
  template({ id: "ai-pronunciation", category: "ai-mission", name: "Pronunciation Practice", description: "Guide an external AI pronunciation exchange.", learnerLevel: "A2–C1", duration: "10 min", activityType: "ai_speaking_mission", recommendedUse: "Extend guided speaking practice.", tags: ["Speaking"] }),
  template({ id: "ai-conversation", category: "ai-mission", name: "Conversation Practice", description: "Prepare a structured external AI conversation.", learnerLevel: "A2–C1", duration: "10–15 min", activityType: "ai_speaking_mission", recommendedUse: "Apply language in conversation.", tags: ["Speaking", "Conversation"] }),
  template({ id: "ai-reading", category: "ai-mission", name: "Reading Practice", description: "Use a reading passage in an external voice workflow.", learnerLevel: "A2–C1", duration: "10 min", activityType: "ai_speaking_mission", recommendedUse: "Practice reading aloud with feedback.", tags: ["Speaking", "Reading"] }),
];

export function groupTemplates(registry: TemplateRegistry = activityTemplateRegistry) {
  return registry.reduce<Record<TemplateCategory, ActivityTemplate[]>>((groups, item) => {
    groups[item.category].push(item); return groups;
  }, { learn: [], listening: [], pronunciation: [], quiz: [], "ai-mission": [] });
}

export function getActivityTemplate(id: string) {
  return activityTemplateRegistry.find((item) => item.id === id) ?? null;
}
