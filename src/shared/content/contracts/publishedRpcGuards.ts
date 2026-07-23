import { validateAiSpeakingMission } from "../../../features/ai-missions";
import type {
  DecimalContentId,
  PublishedCatalogRpcEnvelope,
  PublishedLessonRpcEnvelope,
  PublishedRpcActivity,
  PublishedRpcAiMissionConfig,
  PublishedRpcErrorEnvelope,
  PublishedRpcMedia,
  PublishedRpcMediaId,
  PublishedRpcQuestion,
  PublishedRpcTheoryBlock,
} from "./publishedRpc";

const maxSignedBigint = "9223372036854775807";
const prohibitedKeys = new Set([
  "answer_key",
  "correct_option",
  "correctAnswer",
  "created_by",
  "editor",
  "internalNotes",
  "is_correct",
  "isCorrect",
  "explanation",
  "publisher",
  "updated_by",
]);
const canonicalTimestamp =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/;
const aiMissionConfigKeys = new Set([
  "missionTitle",
  "missionLabel",
  "cefrLevel",
  "goal",
  "estimatedMinutes",
  "primarySoundLabel",
  "primarySoundIpa",
  "secondarySoundLabel",
  "secondarySoundIpa",
  "primaryWords",
  "secondaryWords",
  "sentences",
  "readingText",
  "supportedTools",
  "promptLanguage",
  "feedbackLanguage",
  "difficultyLabel",
  "resultFormatVersion",
  "teacherInstructions",
  "studentInstructions",
  "studentInstructionsEs",
]);

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function hasProhibitedKey(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some(hasProhibitedKey);
  }
  if (!isRecord(value)) return false;
  return Object.entries(value).some(
    ([key, child]) =>
      prohibitedKeys.has(key) ||
      hasProhibitedKey(child)
  );
}

export function isDecimalContentId(
  value: unknown
): value is DecimalContentId {
  if (
    typeof value !== "string" ||
    !/^[1-9]\d*$/.test(value)
  ) {
    return false;
  }
  return (
    value.length < maxSignedBigint.length ||
    (value.length === maxSignedBigint.length &&
      value <= maxSignedBigint)
  );
}

function isPosition(value: unknown) {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0
  );
}

function isPositiveInteger(value: unknown) {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 1
  );
}

function isText(value: unknown) {
  return typeof value === "string";
}

function isTimestamp(value: unknown) {
  return (
    typeof value === "string" &&
    canonicalTimestamp.test(value)
  );
}

function isNullableText(value: unknown) {
  return value === null || isText(value);
}

function isMedia(
  value: unknown
): value is PublishedRpcMedia {
  if (!isRecord(value)) return false;
  return (
    isPublishedRpcMediaId(value.id) &&
    (value.kind === "audio" ||
      value.kind === "image") &&
    isText(value.publicPath) &&
    isNullableText(value.mimeType) &&
    isNullableText(value.altText)
  );
}

function isPublishedRpcMediaId(
  value: unknown
): value is PublishedRpcMediaId {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value
    )
  );
}

function isNullableMedia(value: unknown) {
  return value === null || isMedia(value);
}

function isTheoryBlock(
  value: unknown
): value is PublishedRpcTheoryBlock {
  if (!isRecord(value)) return false;
  switch (value.type) {
    case "heading":
      return (
        (value.level === 1 ||
          value.level === 2 ||
          value.level === 3) &&
        isText(value.text)
      );
    case "paragraph":
    case "tip":
      return isText(value.text);
    case "example":
      return (
        isText(value.title) &&
        isText(value.text)
      );
    case "image":
      return (
        isMedia(value.media) &&
        value.media.kind === "image" &&
        isText(value.alt)
      );
    case "audio":
      return (
        isMedia(value.media) &&
        value.media.kind === "audio"
      );
    default:
      return false;
  }
}

function isQuestionOption(value: unknown) {
  if (!isRecord(value)) return false;
  return (
    isDecimalContentId(value.id) &&
    isText(value.text) &&
    isPosition(value.position)
  );
}

function isQuestion(
  value: unknown
): value is PublishedRpcQuestion {
  if (!isRecord(value)) return false;
  return (
    isDecimalContentId(value.id) &&
    isText(value.prompt) &&
    isPosition(value.position) &&
    typeof value.required === "boolean" &&
    Array.isArray(value.options) &&
    value.options.every(isQuestionOption)
  );
}

function isListeningItem(value: unknown) {
  if (!isRecord(value)) return false;
  return (
    isDecimalContentId(value.id) &&
    isText(value.title) &&
    isPosition(value.position) &&
    isNullableText(value.instructions) &&
    isNullableText(value.transcript) &&
    isNullableMedia(value.audio) &&
    (value.audio === null ||
      value.audio.kind === "audio") &&
    Array.isArray(value.questions) &&
    value.questions.every(isQuestion)
  );
}

function isPronunciationItem(value: unknown) {
  if (!isRecord(value)) return false;
  const hasBlock = value.blockType === "word_list" || value.blockType === "minimal_pairs";
  const validEntries = !hasBlock || (
    Array.isArray(value.entries) && value.entries.every((entry) =>
      value.blockType === "word_list"
        ? typeof entry === "string" && entry.trim().length > 0
        : isRecord(entry) && isText(entry.left) && isText(entry.right)
    )
  );
  return (
    isDecimalContentId(value.id) &&
    isText(value.title) &&
    isPosition(value.position) &&
    isNullableText(value.instructions) &&
    isText(value.displayText) &&
    validEntries &&
    (!hasBlock || value.spellingPattern === null || value.spellingPattern === undefined || isText(value.spellingPattern)) &&
    isNullableMedia(value.audio) &&
    (value.audio === null ||
      value.audio.kind === "audio")
  );
}

function isPracticeItem(value: unknown) {
  if (!isRecord(value)) return false;
  return (
    isDecimalContentId(value.id) &&
    isText(value.title) &&
    isPosition(value.position) &&
    isNullableText(value.instructions)
  );
}

function isAssessment(value: unknown) {
  if (!isRecord(value)) return false;
  return (
    isDecimalContentId(value.id) &&
    isText(value.title) &&
    isPosition(value.position) &&
    Array.isArray(value.questions) &&
    value.questions.every(isQuestion)
  );
}

function isAiMissionConfig(
  value: unknown
): value is PublishedRpcAiMissionConfig {
  return (
    isRecord(value) &&
    Object.keys(value).length >=
      aiMissionConfigKeys.size - 1 &&
    Object.keys(value).every((key) =>
      aiMissionConfigKeys.has(key)
    ) &&
    validateAiSpeakingMission(value).ok
  );
}

function hasActivityBase(
  value: Record<string, unknown>
) {
  return (
    isDecimalContentId(value.id) &&
    isText(value.title) &&
    isPosition(value.position) &&
    typeof value.required === "boolean"
  );
}

function isActivity(
  value: unknown
): value is PublishedRpcActivity {
  if (!isRecord(value) || !hasActivityBase(value)) {
    return false;
  }
  switch (value.type) {
    case "theory":
      return (
        Array.isArray(value.blocks) &&
        value.blocks.every(isTheoryBlock)
      );
    case "listening":
      return (
        Array.isArray(value.items) &&
        value.items.every(isListeningItem)
      );
    case "pronunciation":
      return (
        Array.isArray(value.items) &&
        value.items.every(isPronunciationItem)
      );
    case "practice":
      return (
        Array.isArray(value.items) &&
        value.items.every(isPracticeItem)
      );
    case "quiz":
      return (
        Array.isArray(value.assessments) &&
        value.assessments.every(isAssessment)
      );
    case "ai_speaking_mission":
      return (
        isDecimalContentId(value.missionId) &&
        isAiMissionConfig(value.config)
      );
    default:
      return false;
  }
}

function isLessonSummary(value: unknown) {
  if (!isRecord(value)) return false;
  return (
    isDecimalContentId(value.id) &&
    isDecimalContentId(value.unitId) &&
    isText(value.title) &&
    isText(value.description) &&
    isPosition(value.position) &&
    isDecimalContentId(value.currentVersionId) &&
    isPosition(value.activityCount)
  );
}

function isUnit(value: unknown) {
  if (!isRecord(value)) return false;
  return (
    isDecimalContentId(value.id) &&
    isDecimalContentId(value.courseId) &&
    isText(value.title) &&
    isText(value.description) &&
    isPosition(value.position) &&
    Array.isArray(value.lessons) &&
    value.lessons.every(isLessonSummary)
  );
}

function isCourse(value: unknown) {
  if (!isRecord(value)) return false;
  return (
    isDecimalContentId(value.id) &&
    isText(value.slug) &&
    isText(value.title) &&
    isText(value.description) &&
    isText(value.level) &&
    isText(value.emoji) &&
    isPosition(value.position) &&
    Array.isArray(value.units) &&
    value.units.every(isUnit)
  );
}

export function isPublishedCatalogRpcEnvelope(
  value: unknown
): value is PublishedCatalogRpcEnvelope {
  return (
    !hasProhibitedKey(value) &&
    isRecord(value) &&
    value.schemaVersion === 1 &&
    isText(value.catalogRevision) &&
    isTimestamp(value.generatedAt) &&
    Array.isArray(value.courses) &&
    value.courses.every(isCourse)
  );
}

export function isPublishedLessonRpcEnvelope(
  value: unknown
): value is PublishedLessonRpcEnvelope {
  if (
    hasProhibitedKey(value) ||
    !isRecord(value) ||
    value.schemaVersion !== 1 ||
    !isText(value.lessonRevision) ||
    !isTimestamp(value.generatedAt)
  ) {
    return false;
  }
  if (value.lesson === null) return true;
  if (!isRecord(value.lesson)) return false;
  return (
    isDecimalContentId(value.lesson.id) &&
    isDecimalContentId(value.lesson.unitId) &&
    isDecimalContentId(value.lesson.courseId) &&
    isText(value.lesson.title) &&
    isText(value.lesson.description) &&
    isDecimalContentId(
      value.lesson.currentVersionId
    ) &&
    isPositiveInteger(value.lesson.versionNumber) &&
    isTimestamp(value.lesson.publishedAt) &&
    Array.isArray(value.lesson.activities) &&
    value.lesson.activities.every(isActivity)
  );
}

export function isPublishedRpcErrorEnvelope(
  value: unknown
): value is PublishedRpcErrorEnvelope {
  if (
    !isRecord(value) ||
    !isRecord(value.error)
  ) {
    return false;
  }
  const requested =
    value.error.requestedSchemaVersion;
  return (
    value.error.code ===
      "unsupported_schema_version" &&
    (requested === null ||
      (typeof requested === "number" &&
        Number.isSafeInteger(requested))) &&
    Array.isArray(
      value.error.supportedSchemaVersions
    ) &&
    value.error.supportedSchemaVersions.length ===
      1 &&
    value.error.supportedSchemaVersions[0] === 1
  );
}
