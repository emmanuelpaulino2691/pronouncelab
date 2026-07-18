import type { ParsedAiMissionResult } from "./types";

const maxResultLength = 20_000;
const headings = [
  "Format Version", "Mission", "Overall Pronunciation Score",
  "Words to Practice Again", "Pronunciation Feedback", "Strengths",
  "Goal for Next Practice", "Coach Message",
] as const;

function cleanList(value: string) {
  return value.split(/\r?\n|,/)
    .map((item) => item.replace(/^\s*(?:[-•*]|\d+[.)])\s*/, "").trim())
    .filter((item) => item && !/^none$/i.test(item));
}

function parseScore(value: string) {
  const match = value.match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const number = Number(match[0]);
  if (!Number.isFinite(number) || number < 0 || number > 100) return null;
  return Math.round(number);
}

export function parseAiMissionResult(rawText: string): ParsedAiMissionResult {
  if (rawText.length > maxResultLength) throw new Error("Mission result is too large. Paste no more than 20,000 characters.");
  const normalized = rawText.replace(/\r\n?/g, "\n").trim();
  if (!normalized) throw new Error("Paste the mission result before parsing.");
  const headingPattern = new RegExp(`^\\s*(?:[-•*]\\s*)?(${headings.map((heading) => heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\s*:\\s*(.*)$`, "i");
  const sections = new Map<string, string>();
  let current = "";
  for (const line of normalized.split("\n")) {
    const match = line.match(headingPattern);
    if (match) {
      current = headings.find((heading) => heading.toLowerCase() === match[1].toLowerCase()) ?? "";
      sections.set(current, match[2].trim());
    } else if (current) {
      sections.set(current, `${sections.get(current) ?? ""}\n${line}`.trim());
    }
  }
  const warnings: string[] = [];
  for (const heading of headings) {
    if (!sections.get(heading)?.trim()) warnings.push(`Missing or empty section: ${heading}.`);
  }
  if (!/pronouncelab\s+mission\s+result/i.test(normalized)) warnings.push("The PronounceLab result heading is missing.");
  const score = parseScore(sections.get("Overall Pronunciation Score") ?? "");
  if (score === null) warnings.push("The pronunciation score is missing or outside 0–100.");
  const formatText = sections.get("Format Version") ?? "";
  const formatVersion = /^\d+$/.test(formatText) ? Number(formatText) : null;
  if (formatVersion !== 1) warnings.push("This result does not use supported Format Version 1.");
  return {
    formatVersion,
    mission: sections.get("Mission")?.trim() ?? "",
    score,
    wordsToPracticeAgain: cleanList(sections.get("Words to Practice Again") ?? ""),
    pronunciationFeedback: sections.get("Pronunciation Feedback")?.trim() ?? "",
    strengths: cleanList(sections.get("Strengths") ?? ""),
    goalForNextPractice: sections.get("Goal for Next Practice")?.trim() ?? "",
    coachMessage: sections.get("Coach Message")?.trim() ?? "",
    warnings,
    rawText: normalized,
  };
}
