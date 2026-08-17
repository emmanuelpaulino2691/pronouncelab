import type { ParsedAiMissionResult } from "./types";

const maxResultLength = 20_000;
const headings = [
  "Format Version",
  "Mission",
  "Overall Pronunciation Score",
  "Words to Practice Again",
  "Pronunciation Feedback",
  "Strengths",
  "Goal for Next Practice",
  "Coach Message",
] as const;

function cleanList(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) =>
      item
        .replace(
          /^\s*(?:[-\u2022*]|\d+[.)])\s*/,
          ""
        )
        .trim()
    )
    .filter(
      (item) => item && !/^none$/i.test(item)
    );
}

function parseScore(value: string) {
  const match = value
    .trim()
    .match(/^(0|[1-9]\d?|100)(?:%|\/100)?$/);

  if (!match) {
    return null;
  }

  const score = Number(match[1]);

  return score;
}

export function parseAiMissionResult(
  rawText: string
): ParsedAiMissionResult {
  if (rawText.length > maxResultLength) {
    throw new Error(
      "Mission result is too large. Paste no more than 20,000 characters."
    );
  }

  const normalized = rawText
    .replace(/\r\n?/g, "\n")
    .trim();

  if (!normalized) {
    throw new Error(
      "Paste the mission result before parsing."
    );
  }

  const escapedHeadings = headings
    .map((heading) =>
      heading.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      )
    )
    .join("|");
  const headingPattern = new RegExp(
    `^\\s*(?:[-\\u2022*]\\s*)?(${escapedHeadings})\\s*:\\s*(.*)$`,
    "i"
  );
  const sections = new Map<string, string>();
  const duplicateHeadings = new Set<string>();
  let current = "";

  for (const line of normalized.split("\n")) {
    const match = line.match(headingPattern);

    if (match) {
      const recognized =
        headings.find(
          (heading) =>
            heading.toLowerCase() ===
            match[1].toLowerCase()
        ) ?? "";

      if (sections.has(recognized)) {
        duplicateHeadings.add(recognized);
        current = "";
      } else {
        current = recognized;
        sections.set(current, match[2].trim());
      }
    } else if (current) {
      sections.set(
        current,
        `${sections.get(current) ?? ""}\n${line}`.trim()
      );
    }
  }

  const warnings: string[] = [];

  for (const heading of duplicateHeadings) {
    warnings.push(
      `Duplicate section ignored: ${heading}.`
    );
  }

  for (const heading of headings) {
    if (!sections.get(heading)?.trim()) {
      warnings.push(
        `Missing or empty section: ${heading}.`
      );
    }
  }

  if (
    !/pronouncelab\s+mission\s+result/i.test(
      normalized
    )
  ) {
    warnings.push(
      "The PronounceLab result heading is missing."
    );
  }

  const score = parseScore(
    sections.get(
      "Overall Pronunciation Score"
    ) ?? ""
  );

  if (score === null) {
    warnings.push(
      "The pronunciation score must use 85, 85%, or 85/100 format and be between 0–100."
    );
  }

  const formatText =
    sections.get("Format Version") ?? "";
  const formatVersion = /^\d+$/.test(formatText)
    ? Number(formatText)
    : null;

  if (formatVersion !== 1) {
    warnings.push(
      "This result does not use supported Format Version 1."
    );
  }

  return {
    formatVersion,
    mission:
      sections.get("Mission")?.trim() ?? "",
    score,
    wordsToPracticeAgain: cleanList(
      sections.get("Words to Practice Again") ??
        ""
    ),
    pronunciationFeedback:
      sections
        .get("Pronunciation Feedback")
        ?.trim() ?? "",
    strengths: cleanList(
      sections.get("Strengths") ?? ""
    ),
    goalForNextPractice:
      sections
        .get("Goal for Next Practice")
        ?.trim() ?? "",
    coachMessage:
      sections.get("Coach Message")?.trim() ??
      "",
    warnings,
    rawText: normalized,
  };
}
