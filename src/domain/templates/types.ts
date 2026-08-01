import type { ActivityType } from "../shared/constants";

export type TemplateCategory = "learn" | "listening" | "pronunciation" | "quiz" | "ai-mission";
export type TemplateTag = "Reading" | "Vocabulary" | "Grammar" | "Listening" | "Speaking" | "Pairs" | "Assessment" | "Conversation";

export type ActivityTemplate = {
  id: string;
  category: TemplateCategory;
  name: string;
  description: string;
  learnerLevel: string;
  duration: string;
  activityType: ActivityType;
  recommendedUse: string;
  tags: readonly TemplateTag[];
};

export type TemplateRegistry = readonly ActivityTemplate[];
export type TemplatePreview = ActivityTemplate;
