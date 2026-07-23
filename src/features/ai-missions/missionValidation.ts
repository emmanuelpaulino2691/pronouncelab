import {
  aiMissionFormatVersion,
  cefrLevels,
  type AiMissionProvider,
  type AiSpeakingMissionData,
} from "./types";

export type AiMissionValidationResult =
  | { ok: true; value: AiSpeakingMissionData }
  | { ok: false; error: string };

const stringKeys = [
  "missionTitle",
  "missionLabel",
  "goal",
  "primarySoundLabel",
  "primarySoundIpa",
  "secondarySoundLabel",
  "secondarySoundIpa",
  "readingText",
  "promptLanguage",
  "feedbackLanguage",
  "difficultyLabel",
  "teacherInstructions",
  "studentInstructions",
] as const;

function failure(error: string): AiMissionValidationResult {
  return { ok: false, error };
}

function isStringArray(
  value: unknown,
  minimum: number,
  maximum: number
): value is string[] {
  return (
    Array.isArray(value) &&
    value.length >= minimum &&
    value.length <= maximum &&
    value.every(
      (item) =>
        typeof item === "string" &&
        Boolean(item.trim())
    )
  );
}

export function validateAiSpeakingMission(
  value: unknown
): AiMissionValidationResult {
  if (typeof value !== "object" || value === null) {
    return failure(
      "AI Speaking Mission configuration is required."
    );
  }

  const mission = value as Record<string, unknown>;
  if (
    "studentInstructionsEs" in mission &&
    typeof mission.studentInstructionsEs !== "string"
  ) {
    return failure(
      "Spanish student instructions must be text."
    );
  }
  if (
    stringKeys.some(
      (key) => typeof mission[key] !== "string"
    )
  ) {
    return failure(
      "AI Speaking Mission text configuration is malformed."
    );
  }
  const text = mission as Record<
    (typeof stringKeys)[number],
    string
  >;

  if (!text.missionTitle.trim() || !text.goal.trim()) {
    return failure(
      "Mission title and goal are required."
    );
  }
  if (
    text.missionTitle.length > 200 ||
    text.goal.length > 2000
  ) {
    return failure(
      "Mission title or goal is too long."
    );
  }
  if (
    text.missionLabel.length > 100 ||
    text.difficultyLabel.length > 100
  ) {
    return failure(
      "Mission label or difficulty is too long."
    );
  }
  if (
    !text.primarySoundLabel.trim() ||
    !text.primarySoundIpa.trim()
  ) {
    return failure(
      "The primary sound name and IPA are required."
    );
  }
  if (
    [
      text.primarySoundLabel,
      text.primarySoundIpa,
      text.secondarySoundLabel,
      text.secondarySoundIpa,
    ].some((item) => item.length > 200)
  ) {
    return failure(
      "Sound names and IPA must use 200 characters or fewer."
    );
  }

  if (
    !isStringArray(mission.primaryWords, 1, 50) ||
    !isStringArray(mission.secondaryWords, 0, 50)
  ) {
    return failure(
      "AI Speaking Mission word configuration is malformed."
    );
  }
  if (
    mission.secondaryWords.length > 0 &&
    (!text.secondarySoundLabel.trim() ||
      !text.secondarySoundIpa.trim())
  ) {
    return failure(
      "Add the secondary sound name and IPA when using secondary words."
    );
  }
  if (
    !isStringArray(mission.sentences, 1, 20) ||
    !text.readingText.trim()
  ) {
    return failure(
      "Add at least one sentence and a short reading."
    );
  }
  if (text.readingText.length > 3000) {
    return failure(
      "Use no more than 20 sentences and 3,000 reading characters."
    );
  }

  if (
    !isStringArray(mission.supportedTools, 1, 2)
  ) {
    return failure(
      "Select at least one supported AI platform."
    );
  }
  const supportedTools = mission.supportedTools as string[];
  if (
    supportedTools.some(
      (tool) =>
        tool !== "ChatGPT" && tool !== "Gemini"
    ) ||
    new Set(supportedTools).size !== supportedTools.length
  ) {
    return failure(
      "AI Speaking Mission provider configuration is malformed."
    );
  }

  if (
    !text.promptLanguage.trim() ||
    !text.feedbackLanguage.trim() ||
    text.promptLanguage.length > 100 ||
    text.feedbackLanguage.length > 100
  ) {
    return failure(
      "Instruction and feedback languages are required and must use 100 characters or fewer."
    );
  }
  if (
    text.teacherInstructions.length > 5000 ||
    text.studentInstructions.length > 5000 ||
    (typeof mission.studentInstructionsEs === "string" &&
      mission.studentInstructionsEs.length > 5000)
  ) {
    return failure(
      "Teacher and student instructions must use 5,000 characters or fewer."
    );
  }
  if (
    typeof mission.cefrLevel !== "string" ||
    !cefrLevels.includes(
      mission.cefrLevel as (typeof cefrLevels)[number]
    )
  ) {
    return failure(
      "AI Speaking Mission CEFR level is malformed."
    );
  }
  if (
    !Number.isInteger(mission.estimatedMinutes) ||
    Number(mission.estimatedMinutes) < 1 ||
    Number(mission.estimatedMinutes) > 60
  ) {
    return failure(
      "Estimated duration must be between 1 and 60 minutes."
    );
  }
  if (
    mission.resultFormatVersion !== aiMissionFormatVersion
  ) {
    return failure(
      "Only mission Format Version 1 is supported."
    );
  }

  return {
    ok: true,
    value: {
      missionTitle: text.missionTitle,
      missionLabel: text.missionLabel,
      cefrLevel:
        mission.cefrLevel as AiSpeakingMissionData["cefrLevel"],
      goal: text.goal,
      estimatedMinutes: Number(mission.estimatedMinutes),
      primarySoundLabel: text.primarySoundLabel,
      primarySoundIpa: text.primarySoundIpa,
      secondarySoundLabel: text.secondarySoundLabel,
      secondarySoundIpa: text.secondarySoundIpa,
      primaryWords: [...mission.primaryWords],
      secondaryWords: [...mission.secondaryWords],
      sentences: [...mission.sentences],
      readingText: text.readingText,
      supportedTools: [
        ...(mission.supportedTools as AiMissionProvider[]),
      ],
      promptLanguage: text.promptLanguage,
      feedbackLanguage: text.feedbackLanguage,
      difficultyLabel: text.difficultyLabel,
      resultFormatVersion: Number(
        mission.resultFormatVersion
      ),
      teacherInstructions: text.teacherInstructions,
      studentInstructions: text.studentInstructions,
      ...(typeof mission.studentInstructionsEs === "string" &&
      mission.studentInstructionsEs.trim()
        ? { studentInstructionsEs: mission.studentInstructionsEs.trim() }
        : {}),
    },
  };
}
