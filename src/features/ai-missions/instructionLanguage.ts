import type { AiSpeakingMissionData } from "./types";

export type StudentInstructionLanguage = "en" | "es";

export function hasSpanishStudentInstructions(
  mission: AiSpeakingMissionData
): boolean {
  return Boolean(mission.studentInstructionsEs?.trim());
}

export function getStudentInstructions(
  mission: AiSpeakingMissionData,
  language: StudentInstructionLanguage
): string {
  if (language === "es" && hasSpanishStudentInstructions(mission)) {
    return mission.studentInstructionsEs!.trim();
  }
  return mission.studentInstructions.trim();
}
