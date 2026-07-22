import type { AdminIconName } from "../ui/AdminIcon";
import type { ActivityType } from "./types";

export type ActivityCategory =
  | "Core"
  | "Assessment"
  | "AI";

export type ActivityPresentation = {
  type: ActivityType;
  title: string;
  description: string;
  icon: AdminIconName;
  category: ActivityCategory;
  allowsMultiple: boolean;
  canCreate: boolean;
  future: boolean;
};

export const activityCatalog = [
  {
    type: "theory",
    title: "Theory",
    description:
      "Introduce a new concept clearly and prepare students for practice.",
    icon: "theory",
    category: "Core",
    allowsMultiple: true,
    canCreate: true,
    future: false,
  },
  {
    type: "listening",
    title: "Listening",
    description:
      "Develop listening comprehension through focused audio practice.",
    icon: "listening",
    category: "Core",
    allowsMultiple: true,
    canCreate: true,
    future: false,
  },
  {
    type: "pronunciation",
    title: "Pronunciation",
    description:
      "Develop clearer speech through listening, comparison, and repetition.",
    icon: "pronunciation",
    category: "Core",
    allowsMultiple: true,
    canCreate: true,
    future: false,
  },
  {
    type: "practice",
    title: "Practice",
    description:
      "Keep existing practice activities compatible with current lessons.",
    icon: "practice",
    category: "Core",
    allowsMultiple: true,
    canCreate: false,
    future: false,
  },
  {
    type: "quiz",
    title: "Quiz",
    description:
      "Check understanding with focused questions and useful feedback.",
    icon: "quiz",
    category: "Assessment",
    allowsMultiple: true,
    canCreate: true,
    future: false,
  },
  {
    type: "ai_speaking_mission",
    title: "AI Speaking Mission",
    description:
      "Extend communication through a guided external AI speaking task.",
    icon: "sparkle",
    category: "AI",
    allowsMultiple: true,
    canCreate: true,
    future: false,
  },
] as const satisfies readonly ActivityPresentation[];

export function getActivityPresentation(type: ActivityType): ActivityPresentation {
  return activityCatalog.find((activity) => activity.type === type) ?? {
    type,
    title: "Unsupported activity",
    description: "This activity remains visible so existing lesson content can be reviewed safely.",
    icon: "activity",
    category: "Core",
    allowsMultiple: false,
    canCreate: false,
    future: false,
  };
}
